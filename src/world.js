import * as THREE from 'three';
import { ASSETS } from './config.js';
import { textureCache } from './systems/TextureCache.js';
import { WorldNavigation } from './systems/WorldNavigation.js';
import { createRefugeFence } from './systems/RefugeFence.js';

export const SAFE_BOUNDS = { minX: -10, maxX: 10, minZ: -46, maxZ: -30 };
export const RESCUE_POINT = { x: 0, y: 0, z: -39 };

// Axis-aligned volumes match the visible structures; the central lane stays open.
export const STRUCTURES = [
  ['wall', -24, -22, 13, 3.8, 1.6], ['wall', 23, -20, 13, 3.4, 1.6],
  ['wall', -35, 8, 1.8, 4, 15], ['wall', 33, 10, 1.8, 3.8, 15],
  ['wall', -21, 33, 13, 3.4, 1.6], ['wall', 24, 34, 15, 3.5, 1.6],
  ['car', -18, -7, 7, 2.5, 3.6], ['car', 19, 15, 7, 2.5, 3.6],
  ['car', -35, -36, 3.6, 2.5, 7], ['car', 39, 34, 3.6, 2.5, 7],
  ['crate', -13, 18, 3, 2.8, 3], ['crate', -17, 21, 3.6, 3.3, 3.6],
  ['crate', 16, -32, 3.5, 3, 3.5], ['crate', 20, -35, 3, 2.3, 3],
  ['barrel', -29, -17, 2, 2.5, 2], ['barrel', 28, -13, 2, 2.5, 2],
  ['barrel', -31, 30, 2, 2.5, 2], ['barrel', 12, 5, 2, 2.5, 2],
  ['barricade', -19, 7, 8, 2.2, 1.6], ['barricade', 22, -5, 8, 2.2, 1.6],
  ['fence', -10, -38, 0.18, 3.9, 17], ['fence', 10, -38, 0.18, 3.9, 17],
  ['fence', 0, -46, 20, 3.9, 0.18],
  ['fence', -6.75, -30, 6.5, 3.9, 0.18], ['fence', 6.75, -30, 6.5, 3.9, 0.18]
];

export function createNavigation() {
  return new WorldNavigation({ safeBounds: SAFE_BOUNDS, obstacles: STRUCTURES.map(([type, x, z, w, h, d]) => ({
    minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, height: h, type
  })) });
}

export function makeLabel(text, color = '#83ffd4', width = 6) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#07141eee';
  ctx.beginPath(); ctx.roundRect(4, 4, 760, 120, 22); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = color; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 66, 720);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, transparent: true }));
  sprite.scale.set(width, width / 6, 1);
  sprite.renderOrder = 10;
  return sprite;
}

export function createWorld(scene) {
  const materials = {};
  const material = (color, metalness = 0.15) => materials[color] ??= new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness });
  const box = (group, w, h, d, x, y, z, color) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
    mesh.position.set(x, y, z); group.add(mesh); return mesh;
  };
  for (const [type, x, z, w, h, d] of STRUCTURES) {
    if (type === 'fence') continue;
    const group = new THREE.Group(); group.position.set(x, 0, z);
    if (type === 'barrel') {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 12), material(0x8c4853));
      barrel.position.y = h / 2; group.add(barrel);
      for (const y of [0.35, h - 0.35]) {
        const hoop = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.035, w / 2 + 0.035, 0.15, 12), material(0x293445));
        hoop.position.y = y; group.add(hoop);
      }
    } else if (type === 'car') {
      box(group, w, h * 0.55, d, 0, h * 0.34, 0, 0x375269);
      box(group, w * 0.55, h * 0.48, d * 0.8, 0, h * 0.76, 0, 0x1c2a3a);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(group, w * 0.19, 0.8, d * 0.19, sx * w * 0.3, 0.45, sz * d * 0.43, 0x090e18);
      }
      box(group, w * 0.92, 0.16, d * 1.02, 0, 0.9, 0, 0x85909b);
    } else if (type === 'crate') {
      box(group, w, h, d, 0, h / 2, 0, 0x84644a);
      for (const sx of [-1, 1]) box(group, 0.22, h + 0.04, d + 0.08, sx * w * 0.33, h / 2, 0, 0x3a3840);
      box(group, w + 0.06, 0.22, d + 0.1, 0, h * 0.5, 0, 0xc29656);
    } else if (type === 'barricade') {
      box(group, w, h, d, 0, h / 2, 0, 0xcca34d);
      for (let i = -2; i <= 2; i++) box(group, 0.75, h * 0.85, d + 0.04, i * w / 5, h / 2, 0, 0x262d3b);
    } else {
      box(group, w, h, d, 0, h / 2, 0, 0x47566a);
      box(group, w + 0.1, 0.18, d + 0.1, 0, h, 0, 0x7c8d9e);
      if (w > 5) {
        box(group, w * 0.2, 0.65, d, -w * 0.3, h + 0.3, 0, 0x596b7b);
        box(group, w * 0.25, 0.4, d, w * 0.25, h + 0.15, 0, 0x596b7b);
      }
    }
    scene.add(group);
  }

  createRefugeFence(scene, STRUCTURES.filter(([type]) => type === 'fence'));

  const refuge = new THREE.Group(); scene.add(refuge);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(19, 15), new THREE.MeshStandardMaterial({ color: 0x143f3f, emissive: 0x073d31, emissiveIntensity: 0.6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.065, -38); refuge.add(floor);
  for (const x of [-8.7, 8.7]) box(refuge, 0.13, 0.12, 14, x, 0.14, -38, 0x60ffc4);
  box(refuge, 17.5, 0.12, 0.15, 0, 0.14, -30.7, 0x60ffc4);
  // A rear shelter leaves the reception area and the entire entrance unobstructed.
  box(refuge, 10, 0.25, 3, 0, 4.8, -43, 0x227c78);
  for (const x of [-4.6, 4.6]) box(refuge, 0.3, 4.7, 0.3, x, 2.4, -43.8, 0x53c5b3);
  for (const x of [-8, 8]) {
    box(refuge, 0.35, 4.8, 0.35, x, 2.4, -30, 0x2f6d71);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0x71ffb8 }));
    glow.position.set(x, 5, -30); refuge.add(glow);
  }
  const light = new THREE.PointLight(0x50ffbb, 14, 24, 1.5); light.position.set(0, 5, -38); refuge.add(light);
  const npc = new THREE.Sprite(new THREE.SpriteMaterial({ map: textureCache.load(ASSETS.player[0]), transparent: true }));
  npc.position.set(0, 2.1, -39); npc.scale.set(4.2, 4.2, 1); refuge.add(npc);
  const title = makeLabel('SAFE ZONE · ABRIGO', '#83ffd4', 8);
  title.position.set(0, 8.8, -38); refuge.add(title);
  const name = makeLabel('Coordenador de Resgate', '#ffffff', 7);
  name.position.set(0, 6.8, -38); refuge.add(name);
  const welcome = makeLabel('Traga os sobreviventes até mim', '#aaffde', 7);
  welcome.position.set(0, 5, -38); refuge.add(welcome);
  return { npc, welcome };
}
