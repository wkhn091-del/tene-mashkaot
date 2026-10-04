/**
 * Swaps the glass in the hero pour asset for a new source glass, keeping the bottle and its label as
 * they are. The wine volume is re-lathed from the new bowl's inner profile.
 *
 * Current source: "Wine Glass" by cleisonrodrigues (CC BY 4.0)
 * https://sketchfab.com/3d-models/wine-glass-0367336574904207b7386f39f631750f
 *
 * Usage: node scripts/replace-pour-glass.mjs <glass.glb> [model.glb]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dequantize, mergeDocuments, meshopt, prune, transformPrimitive } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const [glassInput, modelArg] = process.argv.slice(2);
const model = modelArg ?? path.resolve('public/models/pour-bottle-glass.glb');
if (!glassInput) {
  console.error('Usage: node scripts/replace-pour-glass.mjs <glass.glb> [model.glb]');
  process.exit(1);
}

/** Same layout as build-pour-model.mjs: glass 2/3 of the 0.2-tall bottle, standing at y = 0. */
const GLASS_HEIGHT = 0.2 * 0.66;
const GLASS_X = 0.036;

/**
 * Inner radius of the bowl per height, both as fractions of the glass height, sampled from the
 * source mesh's inner-wall rings. Stops below the rim, where the runtime never fills.
 */
const BOWL_PROFILE = [
  [0.4988, 0],
  [0.5154, 0.0322],
  [0.5316, 0.0631],
  [0.5469, 0.0913],
  [0.5607, 0.1155],
  [0.5729, 0.1346],
  [0.5838, 0.1493],
  [0.5942, 0.1604],
  [0.6046, 0.1687],
  [0.6156, 0.1751],
  [0.6276, 0.1799],
  [0.6408, 0.1834],
  [0.6554, 0.1859],
  [0.6716, 0.1876],
  [0.6891, 0.1887],
  [0.7075, 0.189],
  [0.7264, 0.1887],
  [0.7454, 0.1878],
  [0.7642, 0.1864],
  [0.7824, 0.1846],
  [0.7997, 0.1826],
  [0.8159, 0.1805],
  [0.8314, 0.1782],
  [0.8468, 0.1758],
  [0.8627, 0.1731],
  [0.8793, 0.1701],
  [0.8965, 0.1669],
  [0.9135, 0.1635],
  [0.9301, 0.16],
];

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});

function lathe(doc, buffer, profile, segments, radiusScale) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let i = 0; i < profile.length; i += 1) {
    const [y, r] = profile[i];
    const [yPrev, rPrev] = profile[Math.max(0, i - 1)];
    const [yNext, rNext] = profile[Math.min(profile.length - 1, i + 1)];
    // Profile tangent (dr, dy) -> outward normal (dy, -dr).
    const dr = rNext - rPrev;
    const dy = yNext - yPrev;
    const len = Math.hypot(dr, dy) || 1;
    for (let s = 0; s <= segments; s += 1) {
      const theta = (s / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      positions.push(r * radiusScale * cos, y, r * radiusScale * sin);
      normals.push((dy / len) * cos, -dr / len, (dy / len) * sin);
    }
  }
  const row = segments + 1;
  for (let i = 0; i < profile.length - 1; i += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = i * row + s;
      const b = a + row;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  return doc
    .createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer));
}

const doc = await io.read(model);
const root = doc.getRoot();
await doc.transform(dequantize());

const scene = root.listScenes()[0];
const buffer = root.listBuffers()[0];
const oldGlassRoot = scene.listChildren().find((n) => n.getName() === 'glassRoot');
if (!oldGlassRoot) throw new Error(`${model} has no glassRoot node`);
for (const child of oldGlassRoot.listChildren()) child.dispose();
oldGlassRoot.dispose();

// --- New glass: bake its transforms so it stands upright in its own units --------------------------
const glassDoc = await io.read(glassInput);
const glassPrims = [];
for (const node of glassDoc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    transformPrimitive(prim, node.getWorldMatrix());
    for (const semantic of prim.listSemantics()) if (semantic !== 'POSITION' && semantic !== 'NORMAL') prim.setAttribute(semantic, null);
    glassPrims.push(prim);
  }
}
let minY = Infinity;
let maxY = -Infinity;
for (const prim of glassPrims) {
  const pos = prim.getAttribute('POSITION');
  const a = [0, 0, 0];
  for (let i = 0; i < pos.getCount(); i += 1) {
    pos.getElement(i, a);
    minY = Math.min(minY, a[1]);
    maxY = Math.max(maxY, a[1]);
  }
}
const sourceHeight = maxY - minY;
const glassScale = GLASS_HEIGHT / sourceHeight;

const glassMap = mergeDocuments(doc, glassDoc);
const mergedPrims = glassPrims.map((p) => glassMap.get(p));
for (const s of glassDoc.getRoot().listScenes()) {
  const merged = glassMap.get(s);
  for (const node of merged.listChildren()) node.dispose();
  merged.dispose();
}

const glassRoot = doc.createNode('glassRoot')
  .setScale([glassScale, glassScale, glassScale])
  .setTranslation([GLASS_X, -minY * glassScale, 0]);
const glassMaterial = doc.createMaterial('glass').setBaseColorFactor([1, 1, 1, 0.2]).setMetallicFactor(0).setRoughnessFactor(0.03).setDoubleSided(true);
const glassMesh = doc.createMesh('glass');
for (const prim of mergedPrims) glassMesh.addPrimitive(prim.setMaterial(glassMaterial));
glassRoot.addChild(doc.createNode('glass').setMesh(glassMesh));

const wineProfile = BOWL_PROFILE.map(([t, r]) => [minY + t * sourceHeight, r * sourceHeight]);
const winePrim = lathe(doc, buffer, wineProfile, 64, 0.965)
  .setMaterial(doc.createMaterial('wine').setBaseColorFactor([0.35, 0.02, 0.06, 1]).setRoughnessFactor(0.1).setDoubleSided(true));
glassRoot.addChild(doc.createNode('wine').setMesh(doc.createMesh('wine').addPrimitive(winePrim)));
scene.addChild(glassRoot);

for (const b of root.listBuffers()) if (b !== buffer) b.dispose();
for (const accessor of root.listAccessors()) accessor.setBuffer(buffer);

await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
doc.createExtension(EXTMeshoptCompression).setRequired(true);

const asset = root.getAsset();
asset.extras = {
  ...asset.extras,
  glassSource: {
    title: 'Wine Glass',
    author: 'cleisonrodrigues',
    license: 'CC-BY-4.0',
    source: 'https://sketchfab.com/3d-models/wine-glass-0367336574904207b7386f39f631750f',
  },
};

await io.write(model, doc);
const { size } = await stat(model);
console.log(`Wrote ${model} (${(size / 1024).toFixed(0)}KB), glass scale ${glassScale.toExponential(3)}`);
