import test from 'node:test';
import assert from 'node:assert/strict';
import { RescueMission } from '../src/systems/RescueMission.js';

const zone = { inSafeZone: p => p.z < -30, firstHit: () => null };
const point = { x: 0, z: -39 };
function survivor(x = 0, z = 0) {
  return { state: 'waiting', dead: false, position: { x, z },
    startFollowing() { this.state = 'following'; },
    deliver() { if (this.state !== 'following') return false; this.state = 'delivered'; return true; },
    setShelterPosition(position) { Object.assign(this.position, position); },
    destroy() { this.dead = true; } };
}
test('recruiting starts escort without awarding rescue points', () => {
  const s = survivor(), player = { position: { x: 0, z: 1 }, score: 0, rescuedCount: 0 };
  new RescueMission(zone, point).update(player, [s]);
  assert.equal(s.state, 'following');
  assert.equal(player.score, 0);
  assert.equal(player.rescuedCount, 0);
});
test('delivery awards exactly once and removes the survivor from active simulation', () => {
  const s = survivor(0, -37); s.state = 'following';
  const active = [s], player = { position: { x: 0, z: -36 }, score: 100, rescuedCount: 0 };
  const mission = new RescueMission(zone, point);
  mission.update(player, active); mission.update(player, active);
  assert.equal(player.score, 450);
  assert.equal(player.rescuedCount, 1);
  assert.equal(s.state, 'delivered');
  assert.equal(active.length, 0);
  assert.equal(s.dead, false);
  assert.deepEqual(mission.rescuedSurvivors, [s]);
});

test('rescued survivors accumulate inside the shelter with a clear central reception lane', () => {
  const mission = new RescueMission(zone, point);
  const player = { position: { x: 0, z: -36 }, score: 0, rescuedCount: 0 };
  for (let i = 0; i < 40; i++) {
    const s = survivor(0, -37); s.state = 'following';
    mission.update(player, [s]);
  }
  assert.equal(mission.rescuedSurvivors.length, 40);
  assert.equal(player.rescuedCount, 40);
  const positions = new Set();
  for (const s of mission.rescuedSurvivors) {
    assert.equal(s.dead, false);
    assert.equal(s.state, 'delivered');
    assert.ok(zone.inSafeZone(s.position));
    assert.ok(Math.abs(s.position.x) >= 3.5 && Math.abs(s.position.x) <= 7.5);
    assert.ok(s.position.z >= -42 && s.position.z <= -34);
    positions.add(`${s.position.x},${s.position.z}`);
  }
  assert.equal(positions.size, 40);
});
test('dead survivors and escorts outside reception never count as saved', () => {
  const dead = survivor(0, -39); dead.dead = true; dead.state = 'dead';
  const distant = survivor(0, -31); distant.state = 'following';
  const player = { position: { x: 0, z: -35 }, score: 0, rescuedCount: 0 };
  new RescueMission(zone, point).update(player, [dead, distant]);
  assert.equal(player.rescuedCount, 0);
});
test('a wall prevents recruiting a survivor through it', () => {
  const s = survivor(), player = { position: { x: 0, z: 1 }, score: 0, rescuedCount: 0 };
  new RescueMission({ ...zone, firstHit: () => 0.5 }, point).update(player, [s]);
  assert.equal(s.state, 'waiting');
});
