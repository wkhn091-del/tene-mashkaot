/**
 * Replaces the artwork on the hero bottle's label.
 *
 * Input: upright label art at the label's true proportions, about 2.1:1 (the label wraps 245° around
 * the bottle; keep the main design in the middle ~40%). scripts/label/label.html is the source of the
 * current art — screenshot it at 2138×1024 to regenerate scripts/label/label.webp.
 * The model's UVs expect a square texture flipped vertically, so the art is squashed and flipped here.
 *
 * Usage: node scripts/apply-label.mjs scripts/label/label.webp [public/models/pour-bottle-glass.glb]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import path from 'node:path';

const [art, modelArg] = process.argv.slice(2);
if (!art) {
  console.error('Usage: node scripts/apply-label.mjs <label.png> [model.glb]');
  process.exit(1);
}
const model = path.resolve(modelArg ?? 'public/models/pour-bottle-glass.glb');

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(model);
const label = doc.getRoot().listMeshes().find((mesh) => mesh.getName() === 'label');
const material = label?.listPrimitives()[0]?.getMaterial();
const texture = material?.getBaseColorTexture();
if (!material || !texture) throw new Error('The model has no textured "label" mesh');
// Relief/roughness maps baked from the previous artwork would ghost through the new design.
for (const [slot, get, set] of [
  ['normal', () => material.getNormalTexture(), () => material.setNormalTexture(null)],
  ['occlusion', () => material.getOcclusionTexture(), () => material.setOcclusionTexture(null)],
  ['metallicRoughness', () => material.getMetallicRoughnessTexture(), () => material.setMetallicRoughnessTexture(null)],
  ['emissive', () => material.getEmissiveTexture(), () => material.setEmissiveTexture(null)],
]) {
  if (get()) {
    set();
    console.log(`removed old ${slot} map from the label`);
  }
}
material.setRoughnessFactor(0.62).setMetallicFactor(0);

const image = await sharp(art).resize(1024, 1024, { fit: 'fill', kernel: 'lanczos3' }).flip().webp({ quality: 90 }).toBuffer();
texture.setImage(new Uint8Array(image)).setMimeType('image/webp');
await doc.transform(prune());
await io.write(model, doc);
console.log(`Label applied to ${path.basename(model)} (${Math.round(image.byteLength / 1024)}KB texture)`);
