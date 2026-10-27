// Shared X/Z footprints for rendering, movement, spawning and swept projectiles.
export function segmentBoxHit(a, b, box, padding = 0) {
  let near = 0, far = 1;
  for (const [axis, low, high] of [['x', 'minX', 'maxX'], ['z', 'minZ', 'maxZ']]) {
    const d = b[axis] - a[axis];
    const min = box[low] - padding, max = box[high] + padding;
    if (Math.abs(d) < 1e-9) {
      if (a[axis] < min || a[axis] > max) return null;
    } else {
      const t1 = (min - a[axis]) / d, t2 = (max - a[axis]) / d;
      near = Math.max(near, Math.min(t1, t2));
      far = Math.min(far, Math.max(t1, t2));
      if (near > far) return null;
    }
  }
  return near;
}

class MinHeap {
  constructor() { this.items = []; }
  push(item) {
    const a = this.items;
    let i = a.length;
    a.push(item);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= item.f) break;
      a[i] = a[p]; i = p;
    }
    a[i] = item;
  }
  pop() {
    const a = this.items, first = a[0], last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let c = i * 2 + 1;
        if (c + 1 < a.length && a[c + 1].f < a[c].f) c++;
        if (a[c].f >= last.f) break;
        a[i] = a[c]; i = c;
      }
      a[i] = last;
    }
    return first;
  }
}

export class WorldNavigation {
  constructor({ size = 110, obstacles = [], safeBounds }) {
    this.obstacles = obstacles;
    this.safeBounds = safeBounds;
    this.limit = size / 2 - 2;
    this.cell = 2;
    this.origin = -this.limit + 1;
    this.width = Math.floor((this.limit - 1 - this.origin) / this.cell) + 1;
    this.grids = [false, true].map(zombie => {
      const grid = new Uint8Array(this.width ** 2);
      for (let i = 0; i < grid.length; i++) grid[i] = this.isFree(this.point(i), zombie, 1.25) ? 1 : 0;
      return grid;
    });
    // Arena obstacles are immutable: validate each grid edge once, rather than
    // intersecting every wall again for every A* expansion and every zombie.
    this.edges = [false, true].map(zombie => Array.from(
      { length: this.width ** 2 }, (_, i) => this.buildNeighbors(i, zombie)
    ));
    // Only spawn in the component reachable from the central starting area.
    this.reachable = [false, true].map(zombie => {
      const grid = this.grids[Number(zombie)];
      let start = -1, best = Infinity;
      for (let i = 0; i < grid.length; i++) {
        const p = this.point(i), distance = p.x ** 2 + p.z ** 2;
        if (grid[i] && distance < best) { start = i; best = distance; }
      }
      return start < 0 ? new Uint8Array(grid.length) : this.flood(start, zombie);
    });
  }

  inSafeZone(p) {
    const b = this.safeBounds;
    return !!b && p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ;
  }

  isFree(p, zombie = false, radius = 1.1) {
    if (Math.abs(p.x) > this.limit || Math.abs(p.z) > this.limit) return false;
    for (const b of this.obstacles) {
      if (p.x > b.minX - radius && p.x < b.maxX + radius && p.z > b.minZ - radius && p.z < b.maxZ + radius) return false;
    }
    if (zombie && this.safeBounds && segmentBoxHit(p, p, this.safeBounds, radius) !== null) return false;
    return true;
  }

  firstHit(a, b, zombie = false, radius = 0) {
    let first = null;
    const check = box => {
      const t = segmentBoxHit(a, b, box, radius);
      if (t !== null && (first === null || t < first)) first = t;
    };
    this.obstacles.forEach(check);
    if (zombie && this.safeBounds) check(this.safeBounds);
    return first;
  }

  move(p, dx, dz, zombie = false) {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.35));
    for (let i = 0; i < steps; i++) {
      const nextX = { x: p.x + dx / steps, z: p.z };
      if (this.isFree(nextX, zombie)) p.x = nextX.x;
      const nextZ = { x: p.x, z: p.z + dz / steps };
      if (this.isFree(nextZ, zombie)) p.z = nextZ.z;
    }
  }

  point(i) { return { x: this.origin + (i % this.width) * this.cell, z: this.origin + Math.floor(i / this.width) * this.cell }; }
  index(p) {
    const clamp = n => Math.max(0, Math.min(this.width - 1, Math.round((n - this.origin) / this.cell)));
    return clamp(p.z) * this.width + clamp(p.x);
  }
  neighbors(i, zombie) {
    return this.edges[Number(zombie)][i];
  }
  buildNeighbors(i, zombie) {
    const result = [], grid = this.grids[Number(zombie)], x = i % this.width, z = Math.floor(i / this.width);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nx >= this.width || nz < 0 || nz >= this.width) continue;
      const j = nz * this.width + nx;
      if (grid[j] && this.firstHit(this.point(i), this.point(j), zombie, 1.25) === null) result.push(j);
    }
    return result;
  }
  flood(start, zombie) {
    const seen = new Uint8Array(this.width ** 2), queue = [start];
    seen[start] = 1;
    for (let q = 0; q < queue.length; q++) {
      for (const n of this.neighbors(queue[q], zombie)) if (!seen[n]) { seen[n] = 1; queue.push(n); }
    }
    return seen;
  }
  nearestIndex(p, zombie = false) {
    let best = -1, distance = Infinity;
    const reachable = this.reachable[Number(zombie)];
    for (let i = 0; i < reachable.length; i++) {
      if (!reachable[i]) continue;
      const q = this.point(i), d = (p.x - q.x) ** 2 + (p.z - q.z) ** 2;
      if (d < distance) { best = i; distance = d; }
    }
    return best;
  }
  findPath(from, to, zombie = false) {
    if (this.isFree(to, zombie, 1.25) && this.firstHit(from, to, zombie, 1.25) === null) return [{ x: to.x, z: to.z }];
    const start = this.nearestIndex(from, zombie), goal = this.nearestIndex(to, zombie);
    if (start < 0 || goal < 0) return [];
    const heap = new MinHeap(), g = new Float64Array(this.width ** 2).fill(Infinity);
    const parent = new Int32Array(g.length).fill(-1), closed = new Uint8Array(g.length);
    const goalPoint = this.point(goal);
    const heuristic = i => { const p = this.point(i); return Math.abs(p.x - goalPoint.x) + Math.abs(p.z - goalPoint.z); };
    g[start] = 0; heap.push({ i: start, f: heuristic(start) });
    while (heap.items.length) {
      const { i } = heap.pop();
      if (closed[i]) continue;
      if (i === goal) {
        const path = [];
        for (let n = goal; n !== -1; n = parent[n]) path.push(this.point(n));
        path.reverse();
        // Include the grid entry node when needed to avoid clipping a corner.
        if (path.length && Math.hypot(path[0].x - from.x, path[0].z - from.z) < 0.3) path.shift();
        if (this.isFree(to, zombie, 1.25) && this.firstHit(goalPoint, to, zombie, 1.25) === null) path.push({ x: to.x, z: to.z });
        return path;
      }
      closed[i] = 1;
      for (const n of this.neighbors(i, zombie)) {
        const cost = g[i] + this.cell;
        if (cost < g[n]) { g[n] = cost; parent[n] = i; heap.push({ i: n, f: cost + heuristic(n) }); }
      }
    }
    return [];
  }
  follow(entity, target, speed, delta, zombie = false, stopDistance = 0.4) {
    const p = entity.position, distance = Math.hypot(target.x - p.x, target.z - p.z);
    if (distance <= stopDistance) return;
    entity.pathTimer = (entity.pathTimer ?? 0) - delta;
    const key = this.index(target);
    if (!entity.path || entity.pathTimer <= 0 || key !== entity.pathGoal) {
      entity.path = this.findPath(p, target, zombie);
      entity.pathTimer = 0.65 + (entity.navigationPhase ??= Math.random() * 0.3);
      entity.pathGoal = key;
    }
    let budget = speed * delta;
    while (entity.path.length && budget > 0.001) {
      const next = entity.path[0], dx = next.x - p.x, dz = next.z - p.z, length = Math.hypot(dx, dz);
      if (length < 0.12) { entity.path.shift(); continue; }
      const amount = Math.min(budget, length, Math.max(0, distance - stopDistance));
      this.move(p, dx / length * amount, dz / length * amount, zombie);
      budget -= amount;
      if (amount < length) break;
      entity.path.shift();
    }
  }
  validSpawn(p, zombie = false) {
    return this.isFree(p, zombie, 1.4) && !this.inSafeZone(p) && !!this.reachable[Number(zombie)][this.index(p)];
  }
  spawnPoint(center, min, max, zombie = false) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const angle = Math.random() * Math.PI * 2, distance = min + Math.random() * (max - min);
      const p = { x: center.x + Math.cos(angle) * distance, z: center.z + Math.sin(angle) * distance };
      if (this.validSpawn(p, zombie)) return p;
    }
    return null; // Skip this spawn rather than place an entity inside a wall.
  }
  dropPoint(p) {
    if (this.validSpawn(p)) return p;
    const index = this.nearestIndex(p), point = index < 0 ? null : this.point(index);
    return point && this.validSpawn(point) ? point : null;
  }
}
