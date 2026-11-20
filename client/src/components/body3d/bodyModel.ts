/**
 * Segments the CC0 human model (public/models/human.glb — see LICENSE.txt next to it) into 21 selectable regions.
 *
 * The model is a skinned MakeHuman/MPFB mesh with a 53-bone game skeleton. Each vertex is classified using its
 * dominant bone (which limb chain it belongs to) refined by joint positions (e.g. the band around the knee joint
 * = knee). The result is ONE static geometry with a per-vertex `regionId` attribute; highlighting is done in the
 * shader, so region borders blend smoothly across a single triangle instead of showing jagged triangle edges.
 *
 * Coordinate system: Y up, the figure faces +Z, anatomical LEFT is +X (bone suffix "_l").
 */
import * as THREE from 'three';

export const REGION_SLUGS = [
  'head', 'neck', 'chest', 'abdomen', 'upper_back', 'lower_back', 'pelvis',
  'left_shoulder', 'right_shoulder', 'left_arm', 'right_arm', 'left_elbow', 'right_elbow', 'left_hand', 'right_hand',
  'left_leg', 'right_leg', 'left_knee', 'right_knee', 'left_foot', 'right_foot',
] as const;
export type RegionSlug = (typeof REGION_SLUGS)[number];
export const regionIndex = (s: RegionSlug) => REGION_SLUGS.indexOf(s);

export interface Region {
  slug: RegionSlug;
  anchor: THREE.Vector3; // label / camera focus point
  facing: 'front' | 'back' | 'both';
}

export interface BodyData {
  geometry: THREE.BufferGeometry; // has `regionId` float attribute
  regions: Region[];
  vertexRegion: Uint8Array;
  adjacency: { weld: Uint32Array; start: Uint32Array; nbr: Uint32Array; m: number };
  masks: Map<number, Float32Array>;
}

export const MODEL_URL = '/models/human.glb';

let cache: BodyData | null = null;

export function segmentBody(scene: THREE.Object3D): BodyData {
  if (cache) return cache;
  scene.updateMatrixWorld(true);

  let found: THREE.SkinnedMesh | null = null;
  scene.traverse((o) => {
    if (!found && (o as THREE.SkinnedMesh).isSkinnedMesh) found = o as THREE.SkinnedMesh;
  });
  if (!found) throw new Error('Skinned body mesh not found in model');
  const mesh = found as THREE.SkinnedMesh;
  const src = mesh.geometry;
  const bones = mesh.skeleton.bones;

  // Static bind-pose copy in world space.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', (src.getAttribute('position') as THREE.BufferAttribute).clone());
  geometry.setAttribute('normal', (src.getAttribute('normal') as THREE.BufferAttribute).clone());
  geometry.setIndex(src.getIndex()!.clone());
  geometry.applyMatrix4(mesh.matrixWorld);
  const P = geometry.getAttribute('position') as THREE.BufferAttribute;

  const joint = (name: string) => {
    const b = bones.find((x) => x.name === name);
    if (!b) throw new Error(`Bone ${name} missing`);
    return new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
  };
  const J = {
    l: { shoulder: joint('upperarm_l'), elbow: joint('lowerarm_l'), wrist: joint('hand_l'), hip: joint('thigh_l'), knee: joint('calf_l'), ankle: joint('foot_l') },
    r: { shoulder: joint('upperarm_r'), elbow: joint('lowerarm_r'), wrist: joint('hand_r'), hip: joint('thigh_r'), knee: joint('calf_r'), ankle: joint('foot_r') },
    spine: [joint('pelvis'), joint('spine_01'), joint('spine_02'), joint('spine_03'), joint('neck_01')].sort((a, b) => a.y - b.y),
  };
  const hipY = (J.l.hip.y + J.r.hip.y) / 2;
  const shoulderY = (J.l.shoulder.y + J.r.shoulder.y) / 2;
  const torsoH = shoulderY - hipY;
  const pelvisTop = hipY + torsoH * 0.2; // ≈ iliac crest
  const chestBottom = hipY + torsoH * 0.56; // ≈ lower ribs

  // Torso front/back plane: mean z of the torso surface at each height (computed from the mesh itself).
  const bins = 64;
  const minY = hipY - 0.05;
  const maxY = shoulderY + 0.15;
  const zSum = new Float64Array(bins);
  const zCnt = new Uint32Array(bins);
  const bin = (y: number) => THREE.MathUtils.clamp(Math.floor(((y - minY) / (maxY - minY)) * bins), 0, bins - 1);

  const along = (p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) => {
    const ab = b.clone().sub(a);
    return p.clone().sub(a).dot(ab) / ab.lengthSq();
  };

  const skinIndex = src.getAttribute('skinIndex') as THREE.BufferAttribute;
  const skinWeight = src.getAttribute('skinWeight') as THREE.BufferAttribute;
  const n = P.count;
  const chain = new Array<string>(n);
  const sideOf = new Array<'l' | 'r'>(n);
  const p = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    let best = 0;
    let bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = skinWeight.getComponent(i, k);
      if (w > bw) {
        bw = w;
        best = skinIndex.getComponent(i, k);
      }
    }
    const bone = bones[best].name;
    p.fromBufferAttribute(P, i);
    let c: string;
    if (bone === 'head') c = 'head';
    else if (bone === 'neck_01') c = 'neck';
    else if (/^(hand|index|middle|ring|pinky|thumb)_/.test(bone)) c = 'hand';
    else if (bone.startsWith('clavicle_')) c = 'clavicle';
    else if (bone.startsWith('upperarm_') || bone.startsWith('lowerarm_')) c = 'arm';
    else if (bone.startsWith('thigh_') || bone.startsWith('calf_')) c = 'leg';
    else if (bone.startsWith('foot_') || bone.startsWith('ball_')) c = 'foot';
    else c = 'torso';
    // Upper inner thigh is often weighted to the pelvis bone: give it back to the leg.
    if (c === 'torso' && p.y < hipY - 0.025 && Math.abs(p.x) > 0.035) c = 'leg';
    chain[i] = c;
    sideOf[i] = bone.endsWith('_l') ? 'l' : bone.endsWith('_r') ? 'r' : p.x >= 0 ? 'l' : 'r';
    if (c === 'torso') {
      const b = bin(p.y);
      zSum[b] += p.z;
      zCnt[b]++;
    }
  }
  const midZ = (y: number) => {
    const b = bin(y);
    for (let d = 0; d < bins; d++) {
      for (const k of [b - d, b + d]) if (k >= 0 && k < bins && zCnt[k]) return zSum[k] / zCnt[k];
    }
    return 0;
  };

  const vertexRegion = new Uint8Array(n);
  const ids = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(P, i);
    const s = sideOf[i];
    const side = s === 'l' ? 'left' : 'right';
    const j = J[s];
    let r: RegionSlug;
    switch (chain[i]) {
      case 'head': r = 'head'; break;
      case 'neck': r = 'neck'; break;
      case 'hand': r = `${side}_hand`; break;
      case 'foot': r = `${side}_foot`; break;
      case 'clavicle': r = `${side}_shoulder`; break;
      case 'arm': {
        const tu = along(p, j.shoulder, j.elbow);
        const tl = along(p, j.elbow, j.wrist);
        // axial distance from the elbow joint along the (averaged) arm direction → a clean band around the elbow
        const axis = j.wrist.clone().sub(j.shoulder).normalize();
        const axial = Math.abs(p.clone().sub(j.elbow).dot(axis));
        if (tu < 0.24) r = `${side}_shoulder`;
        else if (axial < 0.042) r = `${side}_elbow`;
        else if (tl > 0.98) r = `${side}_hand`;
        else r = `${side}_arm`;
        break;
      }
      case 'leg': {
        const dKnee = Math.abs(p.y - j.knee.y);
        r = dKnee < 0.06 ? `${side}_knee` : p.y < j.ankle.y - 0.005 && along(p, j.knee, j.ankle) > 1 ? `${side}_foot` : `${side}_leg`;
        break;
      }
      default: {
        const front = p.z > midZ(p.y);
        if (p.y < pelvisTop) r = 'pelvis';
        else if (p.y < chestBottom) r = front ? 'abdomen' : 'lower_back';
        else r = front ? 'chest' : 'upper_back';
      }
    }
    vertexRegion[i] = regionIndex(r);
    ids[i] = vertexRegion[i];
  }
  geometry.setAttribute('regionId', new THREE.BufferAttribute(ids, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  // Anchors from the vertices of each region.
  const boxes = REGION_SLUGS.map(() => new THREE.Box3());
  for (let i = 0; i < n; i++) boxes[vertexRegion[i]].expandByPoint(p.fromBufferAttribute(P, i));
  const facing: Partial<Record<RegionSlug, Region['facing']>> = { chest: 'front', abdomen: 'front', upper_back: 'back', lower_back: 'back' };
  const regions: Region[] = REGION_SLUGS.map((slug, k) => {
    const box = boxes[k];
    const anchor = box.isEmpty() ? new THREE.Vector3(0, 1, 0) : box.getCenter(new THREE.Vector3());
    const f = facing[slug] ?? 'both';
    if (f === 'front') anchor.z = box.max.z;
    if (f === 'back') anchor.z = box.min.z;
    return { slug, anchor, facing: f };
  });

  // Mask attributes, filled on demand by regionMask() (smooth, rounded borders instead of triangle zig-zags).
  for (const name of ['selMask', 'hoverMask', 'markMask']) geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(n), 1));

  cache = { geometry, regions, vertexRegion, adjacency: buildAdjacency(P, geometry.getIndex()!), masks: new Map() };
  if (import.meta.env.DEV) (window as unknown as { __medmapBody: BodyData }).__medmapBody = cache;
  return cache;
}

/** Vertex adjacency (CSR) over position-welded vertices, so smoothing also crosses UV seams. */
function buildAdjacency(P: THREE.BufferAttribute, index: THREE.BufferAttribute) {
  const n = P.count;
  const weld = new Uint32Array(n);
  const keyMap = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const key = `${Math.round(P.getX(i) * 1e4)},${Math.round(P.getY(i) * 1e4)},${Math.round(P.getZ(i) * 1e4)}`;
    let w = keyMap.get(key);
    if (w === undefined) keyMap.set(key, (w = keyMap.size));
    weld[i] = w;
  }
  const m = keyMap.size;
  const deg = new Uint32Array(m + 1);
  for (let t = 0; t < index.count; t += 3) {
    const a = weld[index.getX(t)], b = weld[index.getX(t + 1)], c = weld[index.getX(t + 2)];
    deg[a] += 2; deg[b] += 2; deg[c] += 2;
  }
  const start = new Uint32Array(m + 1);
  for (let i = 0; i < m; i++) start[i + 1] = start[i] + deg[i];
  const fill = start.slice(0, m);
  const nbr = new Uint32Array(start[m]);
  for (let t = 0; t < index.count; t += 3) {
    const a = weld[index.getX(t)], b = weld[index.getX(t + 1)], c = weld[index.getX(t + 2)];
    nbr[fill[a]++] = b; nbr[fill[a]++] = c;
    nbr[fill[b]++] = a; nbr[fill[b]++] = c;
    nbr[fill[c]++] = a; nbr[fill[c]++] = b;
  }
  return { weld, start, nbr, m };
}

/** Smoothed 0..1 membership of a region per vertex (Laplacian-smoothed one-hot), cached per region. */
export function regionMask(data: BodyData, region: number): Float32Array {
  const hit = data.masks.get(region);
  if (hit) return hit;
  const { weld, start, nbr, m } = data.adjacency;
  let a = new Float32Array(m);
  let b = new Float32Array(m);
  for (let i = 0; i < weld.length; i++) if (data.vertexRegion[i] === region) a[weld[i]] = 1;
  for (let it = 0; it < 10; it++) {
    for (let v = 0; v < m; v++) {
      let s = a[v] * 2;
      const e = start[v + 1];
      for (let k = start[v]; k < e; k++) s += a[nbr[k]];
      b[v] = s / (2 + e - start[v]);
    }
    [a, b] = [b, a];
  }
  const out = new Float32Array(weld.length);
  for (let i = 0; i < weld.length; i++) out[i] = a[weld[i]];
  data.masks.set(region, out);
  return out;
}

export function writeMask(data: BodyData, attr: 'selMask' | 'hoverMask' | 'markMask', regions: number[]) {
  const target = data.geometry.getAttribute(attr) as THREE.BufferAttribute;
  const arr = target.array as Float32Array;
  arr.fill(0);
  for (const r of regions) {
    const m = regionMask(data, r);
    for (let i = 0; i < arr.length; i++) if (m[i] > arr[i]) arr[i] = m[i];
  }
  target.needsUpdate = true;
}

/** Region under a raycast hit: majority of the hit triangle's vertices. */
export function regionOfFace(data: BodyData, face: { a: number; b: number; c: number }): RegionSlug {
  const { vertexRegion: v } = data;
  const a = v[face.a];
  const b = v[face.b];
  const c = v[face.c];
  return REGION_SLUGS[b === c ? b : a];
}
