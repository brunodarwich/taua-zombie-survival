import * as THREE from 'three';

// One wire mesh and one instanced set of posts for the entire perimeter.
export function createRefugeFence(scene, panels) {
  const group = new THREE.Group();
  group.name = 'refuge-wire-fence';
  const vertices = [], posts = [];
  const height = 3.2;
  for (const [, x, z, w, , d] of panels) {
    const length = Math.max(w, d);
    const alongX = w > d;
    const point = (u, y, offset = 0) => alongX
      ? [x - length / 2 + u, y, z + offset]
      : [x + offset, y, z - length / 2 + u];
    const wire = (a, b) => vertices.push(...a, ...b);
    const bays = Math.ceil(length / 3);
    for (let i = 0; i <= bays; i++) posts.push(point(i * length / bays, 1.85));
    for (const y of [0.18, height]) wire(point(0, y), point(length, y));
    // Clipped diagonal strands form an open diamond-pattern chain-link mesh.
    for (let start = -height; start <= length; start += 0.65) {
      const low = Math.max(0, -start), high = Math.min(height, length - start);
      if (low >= high) continue;
      wire(point(start + low, low), point(start + high, high));
      wire(point(start + low, height - low), point(start + high, height - high));
    }
    // Razor-wire coils and crossed barbs along the top of each panel.
    for (let u = 0; u < length; u += 0.12) {
      const next = Math.min(length, u + 0.12);
      const coil = t => point(t, 3.65 + Math.sin(t * Math.PI * 2 / 1.1) * 0.28,
        Math.cos(t * Math.PI * 2 / 1.1) * 0.28);
      wire(coil(u), coil(next));
    }
    for (let u = 0.5; u < length; u += 1.1) {
      wire(point(u - 0.13, 3.48), point(u + 0.13, 3.86));
      wire(point(u - 0.13, 3.86), point(u + 0.13, 3.48));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: 0x9db9bd, transparent: true, opacity: 0.72
  })));
  const postMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.13, 3.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x63868a, metalness: 0.75, roughness: 0.5 }), posts.length);
  const matrix = new THREE.Matrix4();
  posts.forEach((position, i) => postMesh.setMatrixAt(i, matrix.makeTranslation(...position)));
  group.add(postMesh);
  scene.add(group);
  return group;
}
