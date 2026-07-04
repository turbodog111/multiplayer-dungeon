import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function assertManifestImageExists(baseDir, image) {
  assert.match(image, /\.png$/u, `${image} should be a PNG asset`);
  await assert.doesNotReject(access(join(baseDir, image)), `missing sprite image: ${image}`);
}

test('Sela draft hero sprite manifest references committed PNG assets', async () => {
  const manifestPath = join(ROOT, 'assets/sprites/heroes/sela/sela-draft.animations.json');
  const manifest = await readJson(manifestPath);
  const baseDir = dirname(manifestPath);
  assert.equal(manifest.characterId, 'sela');
  assert.equal(manifest.visualDirection, 'torch-guardian');
  for (const sheet of Object.values(manifest.sheets)) {
    await assertManifestImageExists(baseDir, sheet.image);
  }
});

test('Sela draft effect manifest references committed PNG assets', async () => {
  const manifestPath = join(ROOT, 'assets/sprites/effects/sela/sela-effects-draft.animations.json');
  const manifest = await readJson(manifestPath);
  const baseDir = dirname(manifestPath);
  assert.equal(manifest.characterId, 'sela');
  assert.equal(manifest.effectSet, 'light-and-anchor-drafts');
  for (const sheet of Object.values(manifest.sheets)) {
    await assertManifestImageExists(baseDir, sheet.image);
  }
});
