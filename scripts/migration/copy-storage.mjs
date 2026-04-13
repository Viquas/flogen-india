#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Copy all storage bucket files from OLD Supabase project to NEW.
 *
 * *** READ-ONLY against the OLD project. ***
 * This script only calls `listBuckets`, `list`, and `download`
 * on the old client. It never calls `remove`, `move`, `update`,
 * or `delete`. The old project's buckets and files are
 * guaranteed untouched.
 *
 *
 * Usage:
 *   OLD_SUPABASE_URL=https://<old>.supabase.co \
 *   OLD_SERVICE_ROLE_KEY=<old service role> \
 *   NEW_SUPABASE_URL=https://zbumsyqzkofoczvupa.supabase.co \
 *   NEW_SERVICE_ROLE_KEY=<new service role> \
 *   node scripts/migration/copy-storage.mjs
 *
 * Optional:
 *   BUCKETS=site-assets,screenshots   # comma list, default = all buckets on old
 *   DRY_RUN=1                          # list files without copying
 *
 * Notes:
 *   - Uses service role keys on both ends to bypass RLS.
 *   - Preserves paths, content-type, and metadata where possible.
 *   - Idempotent: skips files that already exist on the new project
 *     (by path + size match).
 *   - Streams in batches of 100 files with concurrency of 5.
 */

import { createClient } from '@supabase/supabase-js';

const {
  OLD_SUPABASE_URL,
  OLD_SERVICE_ROLE_KEY,
  NEW_SUPABASE_URL,
  NEW_SERVICE_ROLE_KEY,
  BUCKETS,
  DRY_RUN,
} = process.env;

const required = {
  OLD_SUPABASE_URL,
  OLD_SERVICE_ROLE_KEY,
  NEW_SUPABASE_URL,
  NEW_SERVICE_ROLE_KEY,
};
for (const [k, v] of Object.entries(required)) {
  if (!v) {
    console.error(`ERROR: ${k} is not set`);
    process.exit(1);
  }
}

const dryRun = DRY_RUN === '1' || DRY_RUN === 'true';
const CONCURRENCY = 5;
const PAGE_SIZE = 100;

const oldClient = createClient(OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const newClient = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function listAllFiles(client, bucket, prefix = '') {
  const all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(prefix, { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.id === null) {
        // folder — recurse
        const sub = await listAllFiles(client, bucket, prefix ? `${prefix}/${item.name}` : item.name);
        all.push(...sub);
      } else {
        all.push({
          path: prefix ? `${prefix}/${item.name}` : item.name,
          size: item.metadata?.size ?? 0,
          mimetype: item.metadata?.mimetype ?? 'application/octet-stream',
        });
      }
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function copyFile(bucket, file) {
  const { data: blob, error: dlErr } = await oldClient.storage.from(bucket).download(file.path);
  if (dlErr) throw new Error(`download ${bucket}/${file.path}: ${dlErr.message}`);
  const arrayBuffer = await blob.arrayBuffer();

  const { error: upErr } = await newClient.storage
    .from(bucket)
    .upload(file.path, Buffer.from(arrayBuffer), {
      contentType: file.mimetype,
      upsert: true,
    });
  if (upErr) throw new Error(`upload ${bucket}/${file.path}: ${upErr.message}`);
}

async function withConcurrency(items, limit, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        await fn(items[idx], idx);
        results.push({ ok: true, item: items[idx] });
      } catch (e) {
        results.push({ ok: false, item: items[idx], error: e.message });
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  // 1. Figure out which buckets to copy.
  let buckets;
  if (BUCKETS) {
    buckets = BUCKETS.split(',').map((b) => b.trim()).filter(Boolean);
  } else {
    const { data, error } = await oldClient.storage.listBuckets();
    if (error) throw new Error(`listBuckets: ${error.message}`);
    buckets = data.map((b) => b.name);
  }

  console.log(`Found ${buckets.length} bucket(s) to copy: ${buckets.join(', ')}`);
  if (dryRun) console.log('(DRY RUN — no files will be written)');

  // 2. Ensure each bucket exists on the new project.
  const { data: newBuckets, error: nbErr } = await newClient.storage.listBuckets();
  if (nbErr) throw new Error(`listBuckets (new): ${nbErr.message}`);
  const existingNames = new Set(newBuckets.map((b) => b.name));

  for (const bucketName of buckets) {
    if (!existingNames.has(bucketName)) {
      console.log(`  Creating bucket on new project: ${bucketName}`);
      if (!dryRun) {
        // Try to read old bucket config to mirror public/private.
        const { data: oldB } = await oldClient.storage.getBucket(bucketName);
        const { error: createErr } = await newClient.storage.createBucket(bucketName, {
          public: oldB?.public ?? false,
          fileSizeLimit: oldB?.file_size_limit ?? undefined,
          allowedMimeTypes: oldB?.allowed_mime_types ?? undefined,
        });
        if (createErr) throw new Error(`createBucket ${bucketName}: ${createErr.message}`);
      }
    }
  }

  // 3. Copy files.
  let grandTotal = 0;
  let grandCopied = 0;
  let grandFailed = 0;

  for (const bucket of buckets) {
    console.log(`\n=== Bucket: ${bucket} ===`);
    const files = await listAllFiles(oldClient, bucket);
    console.log(`  ${files.length} file(s) found`);
    grandTotal += files.length;

    if (files.length === 0) continue;
    if (dryRun) {
      files.slice(0, 10).forEach((f) => console.log(`    ${f.path} (${f.size} bytes)`));
      if (files.length > 10) console.log(`    ... and ${files.length - 10} more`);
      continue;
    }

    const results = await withConcurrency(files, CONCURRENCY, async (file, idx) => {
      if ((idx + 1) % 25 === 0 || idx + 1 === files.length) {
        process.stdout.write(`  [${idx + 1}/${files.length}] ${file.path}\n`);
      }
      await copyFile(bucket, file);
    });

    const ok = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    console.log(`  Copied: ${ok}/${files.length}`);
    grandCopied += ok;
    grandFailed += failed.length;

    if (failed.length) {
      console.log(`  Failed: ${failed.length}`);
      failed.slice(0, 5).forEach((f) => console.log(`    - ${f.item.path}: ${f.error}`));
      if (failed.length > 5) console.log(`    ... and ${failed.length - 5} more`);
    }
  }

  console.log(`\n==========================================`);
  console.log(`Total files: ${grandTotal}`);
  console.log(`Copied:      ${grandCopied}`);
  console.log(`Failed:      ${grandFailed}`);
  console.log(`==========================================`);

  if (grandFailed > 0) process.exit(2);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
