/**
 * Builds the hero pour asset from two Sketchfab sources:
 * - "Bottle of red wine": glass and label simplified hard (the source is ~2.8M triangles); the capsule
 *   is rebuilt as a neck foil plus a removable top cap.
 * - A wine glass: kept as is, plus a wine volume lathed from the bowl's inner profile. BOWL_PROFILE
 *   below matches the original glass only; to change the glass, use scripts/replace-pour-glass.mjs.
 * Output node names are what the runtime expects: bottle, label, foil, cap, cork, glass, wine.
 *
 * Usage: node scripts/build-pour-model.mjs <bottle.glb> <glass.glb> [output.glb]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  join,
  mergeDocuments,
  meshopt,
  prune,
  simplifyPrimitive,
  textureCompress,
  transformPrimitive,
  weld,
} from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const [bottleInput, glassInput, outputArg] = process.argv.slice(2);
const output = outputArg ?? path.resolve('public/models/pour-bottle-glass.glb');
if (!bottleInput || !glassInput) {
  console.error('Usage: node scripts/build-pour-model.mjs <bottle.glb> <glass.glb> [output.glb]');
  process.exit(1);
}

/** Final layout, in model units (the runtime scales by 20): bottle 0.2 tall, glass 2/3 of it. */
const BOTTLE_HEIGHT = 0.2;
const GLASS_HEIGHT = BOTTLE_HEIGHT * 0.66;
const BOTTLE_X = -0.042;
const GLASS_X = 0.036;

const SIMPLIFY = {
  Glass_Gems_Emerald: { ratio: 0.035, error: 0.0008 },
  Metal_Gold: { ratio: 0.6, error: 0.0004 },
};

const ROLE = {
  Glass_Gems_Emerald: 'bottle',
  Metal_Gold: 'label',
};

/**
 * The source capsule is ~2M triangles and falls apart when decimated, so it is rebuilt as lathes
 * with the same measurements (source units, around the bottle axis): a foil sleeve over the neck
 * that stays on, and the top cap that comes off before pouring.
 */
const BOTTLE_AXIS = [0.0939, 0.0001];
const FOIL_PROFILE = [
  [2.074, 0.344],
  [2.084, 0.356],
  [2.1, 0.3585],
  [3.03, 0.3585],
];
/** Foil lid over the lip; overlaps the sleeve so its cut edge shows once the lid is off. */
const CAP_PROFILE = [
  [3.0, 0.31],
  [3.0, 0.3605],
  [3.085, 0.3605],
  [3.095, 0.354],
  [3.1, 0.335],
  [3.1, 0],
];
/** Cork seated in the neck (inner radius ~0.307), pulled out together with the lid. */
const CORK_PROFILE = [
  [2.25, 0],
  [2.25, 0.285],
  [2.27, 0.3],
  [2.98, 0.3],
  [3.0, 0.29],
  [3.0, 0],
];

/** Inner radius of the glass bowl per source height, sampled from the source mesh. */
const BOWL_PROFILE = [
  [0.1115, 0],
  [0.1135, 0.0085],
  [0.1176, 0.015],
  [0.1226, 0.0258],
  [0.1276, 0.0302],
  [0.1325, 0.0368],
  [0.1375, 0.039],
  [0.1425, 0.0406],
  [0.1475, 0.0417],
  [0.1524, 0.0423],
  [0.1624, 0.0423],
  [0.1674, 0.042],
  [0.1724, 0.0415],
  [0.1773, 0.0408],
  [0.1873, 0.0399],
  [0.1923, 0.0387],
  [0.1972, 0.0374],
  [0.2072, 0.036],
  [0.2122, 0.0344],
  [0.2221, 0.0329],
];

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});

function worldBounds(prims) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const prim of prims) {
    const pos = prim.getAttribute('POSITION');
    const a = [0, 0, 0];
    for (let i = 0; i < pos.getCount(); i += 1) {
      pos.getElement(i, a);
      for (let k = 0; k < 3; k += 1) {
        min[k] = Math.min(min[k], a[k]);
        max[k] = Math.max(max[k], a[k]);
      }
    }
  }
  return { min, max };
}

function lathe(doc, buffer, profile, segments, radiusScale, [cx, cz] = [0, 0]) {
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
      positions.push(cx + r * radiusScale * cos, y, cz + r * radiusScale * sin);
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
  const prim = doc
    .createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer));
  return prim;
}

// --- Bottle ---------------------------------------------------------------------------------------
const doc = await io.read(bottleInput);
const root = doc.getRoot();

for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (mesh && mesh.listPrimitives().some((p) => !ROLE[p.getMaterial()?.getName()])) node.dispose();
}
await doc.transform(prune(), flatten());

// Bake node transforms into vertices so every primitive shares one space.
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const matrix = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) transformPrimitive(prim, matrix);
  node.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}
await doc.transform(join({ keepNamed: false }), weld());

const byRole = {};
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    const name = prim.getMaterial().getName();
    const before = prim.getIndices().getCount() / 3;
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ...SIMPLIFY[name] });
    console.log(`${ROLE[name]}: ${before} -> ${prim.getIndices().getCount() / 3} triangles`);
    byRole[ROLE[name]] = { node, prim };
  }
}

const scene = root.listScenes()[0];
const buffer = root.listBuffers()[0];
const bottleBounds = worldBounds([byRole.bottle.prim]);
const bottleTop = CAP_PROFILE.at(-1)[0];
const bottleScale = BOTTLE_HEIGHT / (bottleTop - bottleBounds.min[1]);
const [bottleCx, bottleCz] = BOTTLE_AXIS;

const bottleRoot = doc.createNode('bottleRoot')
  .setScale([bottleScale, bottleScale, bottleScale])
  .setTranslation([BOTTLE_X - bottleCx * bottleScale, -bottleBounds.min[1] * bottleScale, -bottleCz * bottleScale]);

const foilColor = [0.2, 0.01, 0.03, 1];
const parts = {
  bottle: byRole.bottle.prim,
  label: byRole.label.prim,
  foil: lathe(doc, buffer, FOIL_PROFILE, 72, 1, BOTTLE_AXIS).setMaterial(
    doc.createMaterial('foil').setBaseColorFactor(foilColor).setMetallicFactor(0.75).setRoughnessFactor(0.3).setDoubleSided(true),
  ),
  cap: lathe(doc, buffer, CAP_PROFILE, 72, 1, BOTTLE_AXIS).setMaterial(
    doc.createMaterial('cap').setBaseColorFactor(foilColor).setMetallicFactor(0.75).setRoughnessFactor(0.3).setDoubleSided(true),
  ),
  cork: lathe(doc, buffer, CORK_PROFILE, 48, 1, BOTTLE_AXIS).setMaterial(
    doc.createMaterial('cork').setBaseColorFactor([0.55, 0.38, 0.22, 1]).setMetallicFactor(0).setRoughnessFactor(0.9),
  ),
};
for (const [name, prim] of Object.entries(parts)) {
  prim.getMaterial().setName(name);
  const mesh = doc.createMesh(name).addPrimitive(prim);
  bottleRoot.addChild(doc.createNode(name).setMesh(mesh));
}
for (const node of scene.listChildren()) node.dispose();
scene.addChild(bottleRoot);

// --- Glass + wine ---------------------------------------------------------------------------------
const glassDoc = await io.read(glassInput);
for (const node of glassDoc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) transformPrimitive(prim, node.getWorldMatrix());
}
const glassBounds = worldBounds(glassDoc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()));
const glassScale = GLASS_HEIGHT / (glassBounds.max[1] - glassBounds.min[1]);
const glassSceneMap = mergeDocuments(doc, glassDoc);
const glassPrims = glassDoc
  .getRoot()
  .listMeshes()
  .flatMap((m) => m.listPrimitives())
  .map((p) => glassSceneMap.get(p));
for (const s of glassDoc.getRoot().listScenes()) {
  const merged = glassSceneMap.get(s);
  for (const node of merged.listChildren()) node.dispose();
  merged.dispose();
}

const glassRoot = doc.createNode('glassRoot')
  .setScale([glassScale, glassScale, glassScale])
  .setTranslation([GLASS_X, -glassBounds.min[1] * glassScale, 0]);
const glassMesh = doc.createMesh('glass');
const glassMaterial = doc.createMaterial('glass').setBaseColorFactor([1, 1, 1, 0.2]).setMetallicFactor(0).setRoughnessFactor(0.03).setDoubleSided(true);
for (const prim of glassPrims) glassMesh.addPrimitive(prim.setMaterial(glassMaterial));
glassRoot.addChild(doc.createNode('glass').setMesh(glassMesh));

const winePrim = lathe(doc, buffer, BOWL_PROFILE, 64, 0.965)
  .setMaterial(doc.createMaterial('wine').setBaseColorFactor([0.35, 0.02, 0.06, 1]).setRoughnessFactor(0.1).setDoubleSided(true));
glassRoot.addChild(doc.createNode('wine').setMesh(doc.createMesh('wine').addPrimitive(winePrim)));
scene.addChild(glassRoot);

for (const b of root.listBuffers()) if (b !== buffer) b.dispose();
for (const accessor of root.listAccessors()) accessor.setBuffer(buffer);

await doc.transform(
  prune(),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
doc.createExtension(EXTMeshoptCompression).setRequired(true);

await io.write(output, doc);
const { size } = await stat(output);
console.log(`Wrote ${output} (${(size / 1024).toFixed(0)}KB)`);
