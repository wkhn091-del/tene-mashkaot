'use client';

import { Environment, Lightformer, useGLTF, useProgress, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackSide,
  Box3,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Plane,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
  Texture,
  Vector3,
  type PerspectiveCamera,
} from 'three';
import { MODEL_URL } from '@/lib/defaults';
import { pourState, STAGE_SIDE_QUERY } from './pour';

/** The source model is ~0.2m tall; scale it to scene units. */
const MODEL_SCALE = 20;
const POUR_ANGLE = MathUtils.degToRad(112);
const WINE_COLOR = '#6d0f22';
const BACKDROP_URL = '/images/store/bar-backdrop.webp';
const ROOM_URL = '/models/wine-room.glb?v=2';
const ROSE_URL = '/models/rose-table.glb?v=2';

/**
 * The wine room is modelled in its own units (its wine bottle is ~87 tall); this matches it to our
 * ~4-unit bottle. ROOM_ANCHOR is the spot on the bar peninsula where the pour happens, in room units.
 */
const ROOM_SCALE = 4 / 87;
const ROOM_ANCHOR = new Vector3(456, 266, -535);
const ROOM_FLOOR_Y = 2.8;
const ROSE_SCALE = 4 / 3.04;
const ROSE_SPOT = new Vector3(545, ROOM_FLOOR_Y, -365);

/** Converts a point in room units to scene units, given the bar top height in the scene. */
function fromRoom(x: number, y: number, z: number, barY: number): Vector3 {
  return new Vector3((x - ROOM_ANCHOR.x) * ROOM_SCALE, barY + (y - ROOM_ANCHOR.y) * ROOM_SCALE, (z - ROOM_ANCHOR.z) * ROOM_SCALE);
}

const CLOSE_FOV = 30;
const WIDE_FOV = 42;

/** high: refractive glass; medium: reflective glass without the extra transmission pass. */
export type SceneQuality = 'high' | 'medium';

interface SceneRig {
  root: Group;
  glass: Mesh;
  glassMaterials: Record<SceneQuality, MeshPhysicalMaterial>;
  pour: Group;
  opener: Group;
  capMaterial: MeshPhysicalMaterial;
  corkMaterial: MeshStandardMaterial;
  wineMaterial: MeshPhysicalMaterial;
  plane: Plane;
  disc: Mesh;
  stream: Mesh;
  ripple: Mesh;
  bottleShadow: Mesh;
  wineBox: Box3;
  radiusAt: (y: number) => number;
  mouthLocal: Vector3;
  pivotRest: Vector3;
  pivotPour: Vector3;
  wineCenter: Vector3;
  floorY: number;
}

function findMesh(scene: Object3D, name: string): Mesh | null {
  let found: Mesh | null = null;
  scene.traverse((child) => {
    if (!found && child.name === name && (child as Mesh).isMesh) found = child as Mesh;
  });
  return found;
}

function radialShadowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.6)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Max horizontal radius of the wine volume per height band, sampled from its world-space vertices. */
function buildRadiusProfile(mesh: Mesh, center: Vector3, box: Box3, bins = 40) {
  const radii = new Float32Array(bins);
  const position = mesh.geometry.getAttribute('position');
  const v = new Vector3();
  const height = box.max.y - box.min.y || 1;
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
    const bin = Math.min(bins - 1, Math.max(0, Math.floor(((v.y - box.min.y) / height) * bins)));
    const r = Math.hypot(v.x - center.x, v.z - center.z);
    if (r > radii[bin]!) radii[bin] = r;
  }
  for (let i = 1; i < bins; i += 1) if (radii[i] === 0) radii[i] = radii[i - 1]!;
  return (y: number) => {
    const t = MathUtils.clamp(((y - box.min.y) / height) * bins - 0.5, 0, bins - 1);
    const i = Math.floor(t);
    const f = t - i;
    return MathUtils.lerp(radii[i]!, radii[Math.min(i + 1, bins - 1)]!, f) * 0.985;
  };
}

const STREAM_RINGS = 28;
const STREAM_SIDES = 14;
/** Scene units are ~7.5cm (a 30cm bottle is 4 units), so gravity is 9.81 / 0.075. */
const GRAVITY = 130;
const STREAM_SPEED = 1.6;
const STREAM_RADIUS = 0.075;

function createStreamGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  const row = STREAM_SIDES + 1;
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(STREAM_RINGS * row * 3), 3));
  const index: number[] = [];
  for (let i = 0; i < STREAM_RINGS - 1; i += 1) {
    for (let s = 0; s < STREAM_SIDES; s += 1) {
      const a = i * row + s;
      index.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
}

const streamScratch = { v: new Vector3(), p: new Vector3(), n1: new Vector3(), n2: new Vector3(), z: new Vector3(0, 0, 1) };

/**
 * Lays the stream along a ballistic arc: it leaves the mouth along the bottle axis, falls under gravity and
 * thins as it speeds up (constant flow), with a faint travelling wobble. Returns the landing point.
 */
function updateStream(geometry: BufferGeometry, mouth: Vector3, axis: Vector3, endY: number, time: number, out: Vector3) {
  const { v, p, n1, n2, z } = streamScratch;
  const vx = axis.x * STREAM_SPEED;
  const vy = axis.y * STREAM_SPEED;
  const vz = axis.z * STREAM_SPEED;
  const drop = Math.max(mouth.y - endY, 0.001);
  const tEnd = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * drop)) / GRAVITY;
  const position = geometry.getAttribute('position') as Float32BufferAttribute;
  const row = STREAM_SIDES + 1;
  for (let i = 0; i < STREAM_RINGS; i += 1) {
    const f = i / (STREAM_RINGS - 1);
    const t = tEnd * f * f;
    p.set(mouth.x + vx * t, mouth.y + vy * t - 0.5 * GRAVITY * t * t, mouth.z + vz * t);
    v.set(vx, vy - GRAVITY * t, vz);
    const speed = v.length();
    v.divideScalar(speed);
    n1.crossVectors(v, z).normalize();
    n2.crossVectors(v, n1);
    const wobble = 1 + 0.12 * Math.sin(f * 26 - time * 30) * f;
    const radius = STREAM_RADIUS * Math.sqrt(STREAM_SPEED / speed) * wobble * (i === 0 ? 0.8 : 1);
    for (let s = 0; s <= STREAM_SIDES; s += 1) {
      const a = (s / STREAM_SIDES) * Math.PI * 2;
      const c = Math.cos(a) * radius;
      const d = Math.sin(a) * radius;
      position.setXYZ(i * row + s, p.x + n1.x * c + n2.x * d, p.y + n1.y * c + n2.y * d, p.z + n1.z * c + n2.z * d);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return out.copy(p);
}

function useSceneRig(): SceneRig {
  const { scene } = useGLTF(MODEL_URL, false, true);

  return useMemo(() => {
    const root = new Group();
    const model = scene.clone(true);
    model.scale.setScalar(MODEL_SCALE);
    root.add(model);
    root.updateMatrixWorld(true);

    const glass = findMesh(model, 'glass');
    const wine = findMesh(model, 'wine');
    const bottle = findMesh(model, 'bottle');
    const cap = findMesh(model, 'cap');
    const cork = findMesh(model, 'cork');
    const foil = findMesh(model, 'foil');
    const label = findMesh(model, 'label');
    if (!glass || !wine || !bottle) throw new Error('Hero model is missing required meshes');

    // High tier: physically based glass that refracts the wine and the bar behind it (the transmission pass
    // renders at half resolution, see onCreated). Medium tier: a reflective clear coat with no extra pass.
    const glassMaterials: Record<SceneQuality, MeshPhysicalMaterial> = {
      high: new MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.02,
        transmission: 1,
        thickness: 0.12,
        ior: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.8,
        specularIntensity: 1,
        side: DoubleSide,
      }),
      medium: new MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.03,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 2.6,
        specularIntensity: 1,
        ior: 1.5,
        side: DoubleSide,
      }),
    };
    glass.material = glassMaterials.high;
    glass.renderOrder = 2;

    const plane = new Plane(new Vector3(0, -1, 0), 0);
    const wineMaterial = new MeshPhysicalMaterial({
      color: WINE_COLOR,
      roughness: 0.14,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      sheen: 0.4,
      sheenColor: new Color('#c23a55'),
      envMapIntensity: 1.2,
      side: DoubleSide,
      clippingPlanes: [plane],
    });
    wine.material = wineMaterial;

    // Dark green bottle glass full of red wine reads almost black, with green-tinted highlights.
    bottle.material = new MeshPhysicalMaterial({
      color: '#0b1a0e',
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      specularIntensity: 1,
      specularColor: new Color('#d8ffe0'),
      ior: 1.5,
      envMapIntensity: 2.2,
      side: DoubleSide,
    });
    const foilMaterial = new MeshPhysicalMaterial({
      color: '#4a0a16',
      metalness: 0.75,
      roughness: 0.28,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.4,
      side: DoubleSide,
    });
    if (foil) foil.material = foilMaterial;
    const capMaterial = foilMaterial.clone();
    capMaterial.transparent = true;
    if (cap) cap.material = capMaterial;
    if (label && label.material instanceof MeshStandardMaterial) label.material.envMapIntensity = 1.1;

    const corkMaterial = new MeshStandardMaterial({ color: '#8c6139', roughness: 0.9, metalness: 0, transparent: true });
    if (cork) cork.material = corkMaterial;

    // Group bottle, label and foil under a pivot so they tilt together; lid + cork ride on it and pull out.
    const bottleBox = new Box3().setFromObject(bottle);
    const bottleCenter = bottleBox.getCenter(new Vector3());
    const pivotRest = new Vector3(bottleCenter.x, bottleBox.min.y + (bottleBox.max.y - bottleBox.min.y) * 0.55, bottleCenter.z);
    const pour = new Group();
    pour.position.copy(pivotRest);
    root.add(pour);
    pour.updateMatrixWorld(true);
    pour.attach(bottle);
    if (label) pour.attach(label);
    if (foil) pour.attach(foil);

    const opener = new Group();
    pour.add(opener);
    opener.updateMatrixWorld(true);
    if (cap) opener.attach(cap);
    if (cork) opener.attach(cork);

    const wineBox = new Box3().setFromObject(wine);
    const wineCenter = wineBox.getCenter(new Vector3());
    const radiusAt = buildRadiusProfile(wine, wineCenter, wineBox);

    // Mouth sits just under the cap, on the bottle axis (in pivot-local space).
    const mouthLocal = new Vector3(0, bottleBox.max.y - pivotRest.y - 0.02, 0);
    const mouthLength = mouthLocal.y;
    const glassBox = new Box3().setFromObject(glass);
    // Hold the mouth back by the stream's horizontal carry so it lands mid-bowl.
    const streamVx = Math.sin(POUR_ANGLE) * STREAM_SPEED;
    const streamVy = Math.cos(POUR_ANGLE) * STREAM_SPEED;
    const typicalDrop = 0.55 + (glassBox.max.y - wineBox.min.y) * 0.5;
    const landTime = (streamVy + Math.sqrt(streamVy * streamVy + 2 * GRAVITY * typicalDrop)) / GRAVITY;
    const pourMouthTarget = new Vector3(wineCenter.x - streamVx * landTime, glassBox.max.y + 0.55, wineCenter.z);
    const pivotPour = new Vector3(
      pourMouthTarget.x - Math.sin(POUR_ANGLE) * mouthLength,
      pourMouthTarget.y - Math.cos(POUR_ANGLE) * mouthLength,
      pivotRest.z,
    );

    const disc = new Mesh(
      new CircleGeometry(1, 64),
      new MeshPhysicalMaterial({ color: '#5e0f20', roughness: 0.1, clearcoat: 1, envMapIntensity: 0.8, side: DoubleSide }),
    );
    disc.rotation.x = -Math.PI / 2;
    root.add(disc);

    const stream = new Mesh(
      createStreamGeometry(),
      new MeshPhysicalMaterial({ color: WINE_COLOR, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 }),
    );
    stream.frustumCulled = false;
    stream.visible = false;
    root.add(stream);

    const ripple = new Mesh(
      new RingGeometry(0.6, 1, 48),
      new MeshBasicMaterial({ color: '#b83a52', transparent: true, opacity: 0, depthWrite: false, side: DoubleSide }),
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.visible = false;
    root.add(ripple);

    const shadowTexture = radialShadowTexture();
    const floorY = Math.min(bottleBox.min.y, glassBox.min.y) + 0.005;
    const glassShadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
    glassShadow.rotation.x = -Math.PI / 2;
    glassShadow.position.set(wineCenter.x, floorY, wineCenter.z);
    glassShadow.scale.setScalar((glassBox.max.x - glassBox.min.x) * 1.4);
    root.add(glassShadow);
    const bottleShadow = glassShadow.clone();
    bottleShadow.material = (glassShadow.material as MeshBasicMaterial).clone();
    bottleShadow.position.set(bottleCenter.x, floorY, bottleCenter.z);
    bottleShadow.scale.setScalar((bottleBox.max.x - bottleBox.min.x) * 1.8);
    root.add(bottleShadow);

    return { root, glass, glassMaterials, pour, opener, capMaterial, corkMaterial, wineMaterial, plane, disc, stream, ripple, bottleShadow, wineBox, radiusAt, mouthLocal, pivotRest, pivotPour, wineCenter, floorY };
  }, [scene]);
}

function Scene({
  progress,
  quality,
  active,
  onReady,
}: {
  progress: MotionValue<number>;
  quality: SceneQuality;
  active: boolean;
  onReady: () => void;
}) {
  const rig = useSceneRig();
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const snapped = useRef(false);
  const rigRef = useRef<typeof rig | null>(null);
  const size = useThree((s) => s.size);
  const pointer = useRef({ x: 0, y: 0 });
  const smoothed = useRef({ scroll: progress.get(), tilt: 0 });
  const tmp = useMemo(
    () => ({ mouth: new Vector3(), axis: new Vector3(), land: new Vector3(), target: new Vector3(), look: new Vector3(), aim: new Vector3() }),
    [],
  );
  const wide = useMemo(
    () => ({ position: fromRoom(620, 330, 150, rig.floorY), look: fromRoom(420, 262, -560, rig.floorY) }),
    [rig.floorY],
  );

  useEffect(() => {
    rigRef.current = rig;
  }, [rig]);

  useEffect(() => {
    rig.glass.material = rig.glassMaterials[quality];
    invalidate();
  }, [rig, quality, invalidate]);

  // Frames are drawn on demand: scrolling (and the damped motion it sets off) schedules them, and an idle
  // page costs the GPU nothing.
  useEffect(() => {
    if (!active) return;
    invalidate();
    return progress.on('change', () => invalidate());
  }, [progress, active, invalidate]);

  // Compile every shader and upload every texture while the poster is still showing, so neither the reveal
  // nor the first scroll hitches on GPU work.
  useEffect(() => {
    let cancelled = false;
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    (async () => {
      const hidden: Object3D[] = [];
      scene.traverse((object) => {
        if (!object.visible) {
          hidden.push(object);
          object.visible = true;
        }
      });
      try {
        await gl.compileAsync(scene, camera);
      } catch {
        // Without parallel shader compilation, programs are built on the first render instead.
      }
      for (const object of hidden) object.visible = false;
      const textures = new Set<Texture>();
      scene.traverse((object) => {
        const material = (object as Mesh).material;
        if (!material) return;
        for (const m of Array.isArray(material) ? material : [material]) {
          for (const value of Object.values(m)) if (value instanceof Texture) textures.add(value);
        }
      });
      for (const texture of textures) {
        if (cancelled) return;
        gl.initTexture(texture);
        await nextFrame();
      }
      for (let i = 0; i < 2; i += 1) {
        invalidate();
        await nextFrame();
      }
      if (!cancelled) onReady();
    })();
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, invalidate, onReady]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [invalidate]);

  // Which screen side the overlay copy occupies (0 when it sits above the scene).
  const textSide = useRef(0);
  useEffect(() => {
    const query = window.matchMedia(STAGE_SIDE_QUERY);
    const update = () => {
      const rtl = document.documentElement.dir === 'rtl';
      textSide.current = query.matches ? (rtl ? 1 : -1) : 0;
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useFrame((state, delta) => {
    const rig = rigRef.current;
    if (!rig) return;
    const now = state.clock.elapsedTime;
    // Frames arrive on demand, so the first one after an idle spell can carry a long delta.
    const dt = Math.min(delta, 0.1);

    const s = smoothed.current;
    const target = progress.get();
    s.scroll = MathUtils.damp(s.scroll, target, 6, dt);
    const { fill, tilt, pouring, intro } = pourState(s.scroll);
    s.tilt = MathUtils.damp(s.tilt, tilt, 10, dt);
    const k = s.tilt;

    // Bottle: stands on the bar until scrolled, then lifts and tilts toward the glass.
    rig.pour.position.lerpVectors(rig.pivotRest, rig.pivotPour, k);
    rig.pour.rotation.z = -POUR_ANGLE * k;
    (rig.bottleShadow.material as MeshBasicMaterial).opacity = 1 - k;

    // Lid and cork are drawn out along the bottle axis as the pour begins, then fade away.
    const open = MathUtils.clamp(k * 6, 0, 1);
    rig.opener.position.y = MathUtils.smoothstep(open, 0, 0.7) * 0.75;
    const openFade = 1 - MathUtils.smoothstep(open, 0.55, 1);
    rig.capMaterial.opacity = openFade;
    rig.corkMaterial.opacity = openFade;
    rig.opener.visible = openFade > 0.01;

    // Wine level (world space) — clip the volume and cap it with a surface disc.
    const { min, max } = rig.wineBox;
    const level = MathUtils.lerp(min.y + 0.01, max.y - 0.004, fill);
    rig.plane.constant = level;
    const radius = rig.radiusAt(level);
    rig.disc.visible = fill > 0.015;
    rig.disc.position.set(rig.wineCenter.x, level, rig.wineCenter.z);
    rig.disc.scale.setScalar(Math.max(radius, 0.001));

    // Stream from the mouth to the surface while pouring.
    rig.pour.updateMatrixWorld(true);
    tmp.mouth.copy(rig.mouthLocal).applyMatrix4(rig.pour.matrixWorld);
    rig.stream.visible = pouring && tmp.mouth.y > level;
    const rippleMaterial = rig.ripple.material as MeshBasicMaterial;
    if (rig.stream.visible) {
      tmp.axis.set(0, 1, 0).transformDirection(rig.pour.matrixWorld);
      updateStream(rig.stream.geometry, tmp.mouth, tmp.axis, level, now, tmp.land);
      const pulse = (now * 2.2) % 1;
      rig.ripple.visible = true;
      rig.ripple.position.set(tmp.land.x, level + 0.004, tmp.land.z);
      rig.ripple.scale.setScalar(MathUtils.lerp(0.06, Math.min(radius * 0.9, 0.34), pulse));
      rippleMaterial.opacity = 0.55 * (1 - pulse);
    } else {
      rig.ripple.visible = false;
    }

    // Camera: fly in from the doorway of the wine room to the bar, then frame the pour
    // (pulling back a little to include the lifted bottle).
    const aspect = size.width / Math.max(size.height, 1);
    const baseHalfW = MathUtils.lerp(1.55, 2.25, k);
    // Side copy takes half the frame: widen the shot and slide the subject into the free half.
    const side = textSide.current;
    const halfW = baseHalfW * (side ? 2 : 1);
    const halfH = MathUtils.lerp(2.2, 2.45, k);
    // Portrait frames carry the text overlay on top, so back off and push the subject lower.
    const portrait = MathUtils.clamp(1.1 - aspect, 0, 0.6);
    const distance =
      (Math.max(halfH, halfW / aspect) / Math.tan(MathUtils.degToRad(CLOSE_FOV) / 2)) * (1 + portrait * 0.45) + 1.2;
    const lift = portrait * MathUtils.lerp(1.4, 3.6, k);
    tmp.look.set(MathUtils.lerp(0.05, -0.7, k) + side * baseHalfW, MathUtils.lerp(2.0, 2.1, k) + lift, 0);
    tmp.target.set(tmp.look.x + pointer.current.x * 0.35, tmp.look.y - pointer.current.y * 0.2 + 0.25, distance);
    tmp.look.lerpVectors(wide.look, tmp.look, intro);
    tmp.target.lerpVectors(wide.position, tmp.target, intro);
    const ease = snapped.current ? 1 - Math.exp(-4 * dt) : 1;
    const cam = state.camera as PerspectiveCamera;
    cam.position.lerp(tmp.target, ease);
    tmp.aim.lerp(tmp.look, ease);
    cam.lookAt(tmp.aim);
    const fov = MathUtils.lerp(WIDE_FOV, CLOSE_FOV, intro);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    snapped.current = true;

    // Keep drawing only while something still moves: the damped scroll, the camera glide or the pour itself.
    const settling =
      Math.abs(s.scroll - target) > 1e-4 ||
      Math.abs(s.tilt - tilt) > 1e-4 ||
      cam.position.distanceToSquared(tmp.target) > 1e-6 ||
      tmp.aim.distanceToSquared(tmp.look) > 1e-6 ||
      rig.stream.visible;
    if (settling && active) state.invalidate();
  });

  return (
    <>
      <primitive object={rig.root} />
      <WineRoom barY={rig.floorY - 0.004} />
      <RoseTable barY={rig.floorY - 0.004} />
      <WindowView barY={rig.floorY} />
    </>
  );
}

/** The wine cellar the pour happens in; its granite bar peninsula becomes the counter. */
function WineRoom({ barY }: { barY: number }) {
  const { scene } = useGLTF(ROOM_URL, false, true);
  const room = useMemo(() => {
    const root = scene.clone(true);
    root.scale.setScalar(ROOM_SCALE);
    root.position.copy(fromRoom(0, 0, 0, barY));
    root.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as MeshStandardMaterial;
      if (material.name === 'ANTIQUE_WHITE') {
        // Plain white walls read as a showroom; warm plaster keeps the cellar mood.
        material.color.set('#6e5847');
        material.roughness = 0.9;
      }
      material.envMapIntensity = 0.55;
    });
    return root;
  }, [scene, barY]);
  return <primitive object={room} />;
}

/** A rosé bottle on a side table near the doorway — seen as the camera flies in. */
function RoseTable({ barY }: { barY: number }) {
  const { scene } = useGLTF(ROSE_URL, false, true);
  const table = useMemo(() => {
    const root = scene.clone(true);
    root.scale.setScalar(ROSE_SCALE);
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    const spot = fromRoom(ROSE_SPOT.x, ROSE_SPOT.y, ROSE_SPOT.z, barY);
    root.position.set(spot.x, spot.y - box.min.y, spot.z);
    root.rotation.y = -0.6;
    return root;
  }, [scene, barY]);
  return <primitive object={table} />;
}

/**
 * The cellar's back panel (behind the hanging glasses) is a flat black recess; a blurred photo of
 * the real store fills it so it reads as a window onto Tene Mashkaot.
 */
const WINDOW = { center: [415, 466, -916] as const, width: 240, height: 338 };
const BACKDROP_ASPECT = 1280 / 800;

function WindowView({ barY }: { barY: number }) {
  const texture = useTexture(BACKDROP_URL, (t) => {
    t.colorSpace = SRGBColorSpace;
    const repeat = WINDOW.width / WINDOW.height / BACKDROP_ASPECT;
    t.repeat.set(repeat, 1);
    t.offset.set((1 - repeat) / 2, 0);
  });
  const [x, y, z] = WINDOW.center;
  return (
    <mesh position={fromRoom(x, y, z, barY)}>
      <planeGeometry args={[WINDOW.width * ROOM_SCALE, WINDOW.height * ROOM_SCALE]} />
      <meshBasicMaterial map={texture} color="#b9a594" toneMapped={false} />
    </mesh>
  );
}

/** Four lights instead of six (fewer per-pixel light loops); reflections come from a one-time environment. */
function Lights() {
  const backdrop = useTexture(BACKDROP_URL);
  const wrap = useMemo(() => {
    const texture = backdrop.clone();
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [backdrop]);
  return (
    <>
      <color attach="background" args={['#0d0507']} />
      <fog attach="fog" args={['#0d0507', 38, 95]} />
      <hemisphereLight args={['#ffdcb0', '#2a130b', 0.55]} />
      <directionalLight position={[3, 6, 5]} intensity={1.35} color="#fff4e0" />
      {/* Warm pendant over the bar */}
      <spotLight position={[0.5, 9, 3]} angle={0.55} penumbra={0.9} intensity={1.5} decay={0} color="#ffdcb0" />
      <pointLight position={[-9, 6, -10]} intensity={1.2} decay={0} distance={30} color="#ff9f5a" />
      {/* Studio softboxes over a dim wrap of the real store: warm shelves show in the bottle and glass. */}
      <Environment resolution={256} frames={1}>
        <mesh scale={60}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial map={wrap} color="#7a6353" side={BackSide} toneMapped={false} />
        </mesh>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 3]} scale={[8, 2, 1]} rotation-x={Math.PI / 2.4} />
        <Lightformer form="rect" intensity={3} color="#ffe2b0" position={[-4, 2, 1]} scale={[1.2, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.4} position={[4, 2, 1]} scale={[1, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.5} color="#d4a95a" position={[0, 1, -5]} scale={3} />
      </Environment>
    </>
  );
}

function ProgressReporter({ onProgress }: { onProgress: (value: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => onProgress(Math.round(progress)), [progress, onProgress]);
  return null;
}

/**
 * One-way quality guard: if real frames (not idle gaps between on-demand frames) average slower than
 * ~38 fps, drop to the medium tier at DPR 1 once, instead of oscillating like an adaptive DPR would.
 */
function FrameBudget({ active, onSlow }: { active: boolean; onSlow: () => void }) {
  const samples = useRef<number[]>([]);
  const done = useRef(false);
  useFrame((_, delta) => {
    if (done.current || !active || delta > 0.25) return;
    const list = samples.current;
    list.push(delta);
    if (list.length < 45) return;
    const average = list.reduce((sum, value) => sum + value, 0) / list.length;
    list.length = 0;
    if (average > 1 / 38) {
      done.current = true;
      onSlow();
    }
  });
  return null;
}

export default function HeroCanvas({
  progress,
  active,
  quality,
  onReady,
  onProgress,
  onError,
}: {
  progress: MotionValue<number>;
  active: boolean;
  quality: SceneQuality;
  onReady: () => void;
  onProgress: (value: number) => void;
  onError: (error: unknown) => void;
}) {
  const [tier, setTier] = useState<SceneQuality>(quality);
  const [dpr, setDpr] = useState<number | [number, number]>(quality === 'high' ? [1, 1.6] : [1, 1.35]);
  const onSlow = useCallback(() => {
    setTier('medium');
    setDpr(1);
  }, []);

  return (
    <>
      <ProgressReporter onProgress={onProgress} />
      <Canvas
        dpr={dpr}
        frameloop={active ? 'demand' : 'never'}
        camera={{ position: [0, 2.2, 9], fov: WIDE_FOV, near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.transmissionResolutionScale = 0.5;
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onError(new Error('WebGL context lost'));
          });
        }}
        aria-hidden
      >
        <FrameBudget active={active} onSlow={onSlow} />
        <Suspense fallback={null}>
          <Lights />
          <Scene progress={progress} quality={tier} active={active} onReady={onReady} />
        </Suspense>
      </Canvas>
    </>
  );
}

useGLTF.preload(MODEL_URL, false, true);
useGLTF.preload(ROOM_URL, false, true);
useGLTF.preload(ROSE_URL, false, true);
useTexture.preload(BACKDROP_URL);
