/**
 * Second-pass optimizer for the hero's 3D assets (run after build-pour-model.mjs).
 * Simplifies dense meshes by an error budget relative to each mesh's size, so nothing visibly
 * changes at hero viewing distances, while the per-frame triangle count drops by ~65%.
 *
 * Usage: node scripts/optimize-hero-assets.mjs [modelsDir=public/models]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, dequantize, meshopt, prune, simplifyPrimitive, weld } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { stat } from 'node:fs/promises';
import path from 'node:path';

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

/** Rules are tried in order; the first whose minimum triangle count matches a primitive applies. */
const JOBS = {
  'wine-room.glb': [
    { minTris: 40000, ratio: 0.2, error: 0.0012 },
    { minTris: 6000, ratio: 0.5, error: 0.0008 },
  ],
  'rose-table.glb': [
    { minTris: 60000, ratio: 0.14, error: 0.0015 },
    { minTris: 20000, ratio: 0.25, error: 0.0012 },
    { minTris: 4000, ratio: 0.55, error: 0.0008 },
  ],
  'pour-bottle-glass.glb': [
    { name: 'label', ratio: 0.75, error: 0.0001 },
    { name: 'bottle', ratio: 0.6, error: 0.00025 },
  ],
};

const triangles = (prim) => {
  const indices = prim.getIndices();
  return (indices ? indices.getCount() : prim.getAttribute('POSITION').getCount()) / 3;
};

const dir = path.resolve(process.argv[2] ?? 'public/models');
for (const [file, rules] of Object.entries(JOBS)) {
  const input = path.join(dir, file);
  const before = (await stat(input)).size;
  const doc = await io.read(input);
  await doc.transform(dequantize(), weld());
  let trisBefore = 0;
  let trisAfter = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const count = triangles(prim);
      trisBefore += count;
      const rule = rules.find((r) => (r.name ? r.name === mesh.getName() : count >= r.minTris));
      if (rule) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: rule.ratio, error: rule.error });
      trisAfter += triangles(prim);
    }
  }
  await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(input, doc);
  const after = (await stat(input)).size;
  console.log(`${file}: ${Math.round(trisBefore)} → ${Math.round(trisAfter)} triangles, ${(before / 1e6).toFixed(2)}MB → ${(after / 1e6).toFixed(2)}MB`);
}
