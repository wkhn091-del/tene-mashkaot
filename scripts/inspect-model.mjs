import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/inspect-model.mjs <file.glb>');
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();
const outDir = path.resolve('.model-inspect');
await mkdir(outDir, { recursive: true });

for (const material of root.listMaterials()) {
  const specGloss = material.getExtension('KHR_materials_pbrSpecularGlossiness');
  console.log('material', material.getName(), {
    alphaMode: material.getAlphaMode(),
    baseColor: material.getBaseColorFactor(),
    baseTex: material.getBaseColorTexture()?.getName() ?? null,
    diffuse: specGloss?.getDiffuseFactor?.(),
    diffuseTex: specGloss?.getDiffuseTexture?.()?.getURI?.() ?? (specGloss?.getDiffuseTexture?.() ? 'embedded' : null),
    specular: specGloss?.getSpecularFactor?.(),
    glossiness: specGloss?.getGlossinessFactor?.(),
    normalTex: material.getNormalTexture() ? 'yes' : null,
  });
}

let i = 0;
for (const texture of root.listTextures()) {
  const file = path.join(outDir, `texture-${i}.${texture.getMimeType() === 'image/png' ? 'png' : 'jpg'}`);
  await writeFile(file, texture.getImage());
  console.log('texture', i, texture.getMimeType(), texture.getSize(), file);
  i += 1;
}

for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const worldMatrix = node.getWorldMatrix();
  console.log('node', node.getName(), 'world', worldMatrix.map((n) => Number(n.toFixed(3))).join(','));
}
