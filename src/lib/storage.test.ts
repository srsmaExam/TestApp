import { describe, expect, it } from 'vitest';
import { readFileRecord, saveBufferWithHash, deleteIfExists } from './storage';

describe('Storage dual persistence (database + disk)', () => {
  it('saves and reads back a buffer with sha256', async () => {
    // Cold PGlite/WASM initialisation can exceed vitest's 5s default on a slow
    // machine/CI runner — this is unrelated to the assertions below.
    const testKey = 'test/sample.pdf';
    const sampleBytes = Buffer.from('%PDF-1.4 test content for storage verification');

    const saved = await saveBufferWithHash(testKey, sampleBytes, 'application/pdf');
    expect(saved.size).toBe(sampleBytes.length);
    expect(saved.sha256).toBeTruthy();

    const record = await readFileRecord(testKey);
    expect(record).not.toBeNull();
    expect(record?.buffer.toString()).toBe(sampleBytes.toString());
    expect(record?.contentType).toBe('application/pdf');
    expect(record?.size).toBe(sampleBytes.length);

    await deleteIfExists(testKey);
    const afterDelete = await readFileRecord(testKey);
    expect(afterDelete).toBeNull();
  }, 20_000);
});
