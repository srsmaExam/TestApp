import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { storedFiles } from '@/db/schema';
import { imageKey, paperKey, resolveDataPath } from './paths';

export type FileRecord = {
  buffer: Buffer;
  contentType: string;
  size: number;
  sha256: string;
};

/**
 * Persists a file into the database (stored_files) and mirrors to disk if writable.
 * This guarantees persistence in serverless environments (Vercel) while maintaining
 * fast local development behavior.
 */
export async function saveBufferWithHash(
  relativeKey: string,
  bytes: Buffer,
  contentType: string = 'application/pdf',
): Promise<{ absPath: string; sha256: string; size: number }> {
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  // 1. Persist to PostgreSQL database
  try {
    const db = await getDb();
    await db
      .insert(storedFiles)
      .values({
        key: relativeKey,
        data: bytes.toString('base64'),
        contentType,
        sizeBytes: bytes.length,
        sha256,
      })
      .onConflictDoUpdate({
        target: storedFiles.key,
        set: {
          data: bytes.toString('base64'),
          contentType,
          sizeBytes: bytes.length,
          sha256,
          createdAt: new Date(),
        },
      });
  } catch (dbErr) {
    console.warn('[storage] failed to write to database stored_files:', dbErr);
  }

  // 2. Attempt to mirror to disk (works on local PC; gracefully skipped in read-only serverless)
  try {
    const absPath = resolveDataPath(relativeKey);
    await fsp.mkdir(path.dirname(absPath), { recursive: true });
    await fsp.writeFile(absPath, bytes);
  } catch {
    // Disk write skipped on read-only serverless filesystems
  }

  return { absPath: relativeKey, sha256, size: bytes.length };
}

export function paperAbsPath(relativeKey: string): string {
  return resolveDataPath(relativeKey);
}

/**
 * Reads a file record from disk cache or database.
 */
export async function readFileRecord(relativeKey: string): Promise<FileRecord | null> {
  // 1. Try disk first (fastest for local development)
  try {
    const abs = resolveDataPath(relativeKey);
    if (fs.existsSync(abs)) {
      const buffer = await fsp.readFile(abs);
      const ext = path.extname(abs).toLowerCase();
      const contentType =
        ext === '.webp'
          ? 'image/webp'
          : ext === '.pdf'
            ? 'application/pdf'
            : 'application/octet-stream';
      const sha256 = createHash('sha256').update(buffer).digest('hex');
      return { buffer, contentType, size: buffer.length, sha256 };
    }
  } catch {
    // Disk not available or read error
  }

  // 2. Fall back to PostgreSQL database
  try {
    const db = await getDb();
    const [row] = await db.select().from(storedFiles).where(eq(storedFiles.key, relativeKey)).limit(1);
    if (row) {
      const buffer = Buffer.from(row.data, 'base64');
      return {
        buffer,
        contentType: row.contentType,
        size: Number(row.sizeBytes),
        sha256: row.sha256,
      };
    }
  } catch (err) {
    console.warn('[storage] database read error for key:', relativeKey, err);
  }

  return null;
}

export async function readBuffer(relativeKey: string): Promise<Buffer> {
  const file = await readFileRecord(relativeKey);
  if (!file) throw new Error(`file_not_found: ${relativeKey}`);
  return file.buffer;
}

export function existsSync(relativeKey: string): boolean {
  try {
    return fs.existsSync(resolveDataPath(relativeKey));
  } catch {
    return false;
  }
}

export async function hasFile(relativeKey: string): Promise<boolean> {
  const file = await readFileRecord(relativeKey);
  return Boolean(file);
}

export async function deleteIfExists(relativeKey: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(storedFiles).where(eq(storedFiles.key, relativeKey));
  } catch {
    // DB delete failed or table not found
  }

  try {
    const abs = resolveDataPath(relativeKey);
    await fsp.rm(abs, { force: true });
  } catch {
    // Disk delete failed
  }
}

export async function saveQuestionImage(
  questionId: string,
  placeholderId: string,
  bytes: Buffer,
): Promise<{ relativeKey: string; size: number }> {
  const relativeKey = imageKey(questionId, placeholderId);
  await saveBufferWithHash(relativeKey, bytes, 'image/webp');
  return { relativeKey, size: bytes.length };
}

export async function deleteQuestionImageDir(questionId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(storedFiles).where(sql`${storedFiles.key} LIKE ${`images/${questionId}/%`}`);
  } catch {
    // Ignore
  }

  try {
    await fsp.rm(resolveDataPath(`images/${questionId}`), { recursive: true, force: true });
  } catch {
    // Ignore
  }
}

export { paperKey };
