import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { getDb, closeDb } from '../src/db/client';
import { resolveDataPath } from '../src/lib/paths';

async function compressImageToWebp(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [
      '-c',
      `
import sys, io
from PIL import Image

try:
    input_data = sys.stdin.buffer.read()
    img = Image.open(io.BytesIO(input_data))
    out = io.BytesIO()
    # If image is RGBA and transparent, preserve RGBA; if RGB or P, handle appropriately
    if img.mode in ('RGBA', 'LA'):
        img.save(out, 'WEBP', quality=80, method=6)
    elif img.mode == 'P':
        img = img.convert('RGBA')
        img.save(out, 'WEBP', quality=80, method=6)
    else:
        img = img.convert('RGB')
        img.save(out, 'WEBP', quality=80, method=6)
    sys.stdout.buffer.write(out.getvalue())
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`,
    ]);

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    py.stdout.on('data', (chunk) => chunks.push(chunk));
    py.stderr.on('data', (chunk) => errChunks.push(chunk));

    py.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        const errMsg = Buffer.concat(errChunks).toString('utf8');
        reject(new Error(`Python compression failed: ${errMsg}`));
      }
    });

    py.stdin.write(buffer);
    py.stdin.end();
  });
}

async function main() {
  console.log('=== Starting Database Image Optimization ===');
  const db = await getDb();

  const rowsRes = await db.$client.query<{
    key: string;
    content_type: string;
    size_bytes: string | number;
    data: string;
    sha256: string;
  }>("SELECT key, content_type, size_bytes, data, sha256 FROM stored_files WHERE key LIKE 'images/%'");

  const rows = rowsRes.rows;
  console.log(`Found ${rows.length} image(s) in stored_files.`);

  let totalOldBytes = 0;
  let totalNewBytes = 0;
  let optimizedCount = 0;

  for (const row of rows) {
    const oldBuffer = Buffer.from(row.data, 'base64');
    const oldSize = oldBuffer.length;
    totalOldBytes += oldSize;

    try {
      const compressedBuffer = await compressImageToWebp(oldBuffer);
      const newSize = compressedBuffer.length;

      // Only apply if there is actual size reduction
      if (newSize < oldSize * 0.95) {
        const newSha256 = createHash('sha256').update(compressedBuffer).digest('hex');
        const newBase64 = compressedBuffer.toString('base64');

        await db.$client.query(
          `UPDATE stored_files
           SET data = $1, size_bytes = $2, sha256 = $3, content_type = 'image/webp'
           WHERE key = $4`,
          [newBase64, newSize, newSha256, row.key],
        );

        // Also update local file if present
        try {
          const abs = resolveDataPath(row.key);
          if (fs.existsSync(abs)) {
            fs.writeFileSync(abs, compressedBuffer);
          }
        } catch {
          // Ignore disk error
        }

        const pct = Math.round(((oldSize - newSize) / oldSize) * 100);
        console.log(
          `[✓] Optimized ${row.key}: ${(oldSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (-${pct}%)`,
        );
        totalNewBytes += newSize;
        optimizedCount++;
      } else {
        console.log(
          `[-] Skipped ${row.key}: already optimal (${(oldSize / 1024).toFixed(1)} KB vs ${(newSize / 1024).toFixed(1)} KB)`,
        );
        totalNewBytes += oldSize;
      }
    } catch (err) {
      console.warn(`[!] Failed to compress ${row.key}:`, err);
      totalNewBytes += oldSize;
    }
  }

  const savedBytes = totalOldBytes - totalNewBytes;
  const savedMb = (savedBytes / (1024 * 1024)).toFixed(2);
  const totalOldMb = (totalOldBytes / (1024 * 1024)).toFixed(2);
  const totalNewMb = (totalNewBytes / (1024 * 1024)).toFixed(2);

  console.log('\n=== Summary ===');
  console.log(`Total images processed: ${rows.length}`);
  console.log(`Images compressed: ${optimizedCount}`);
  console.log(`Initial DB storage: ${totalOldMb} MB (${totalOldBytes.toLocaleString()} bytes)`);
  console.log(`Optimized DB storage: ${totalNewMb} MB (${totalNewBytes.toLocaleString()} bytes)`);
  console.log(`Total storage & egress saved: ${savedMb} MB (-${Math.round((savedBytes / (totalOldBytes || 1)) * 100)}%)`);

  await closeDb();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exitCode = 1;
});
