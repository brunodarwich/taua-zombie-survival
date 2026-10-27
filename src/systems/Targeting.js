// Re-evaluate at each shot so a defeated or overtaken enemy never stays locked.
export function nearestZombie(origin, zombies) {
  let target = null, nearest = Infinity;
  for (const zombie of zombies) {
    if (zombie.dead || zombie.hp <= 0) continue;
    const distance = (zombie.position.x - origin.x) ** 2 + (zombie.position.z - origin.z) ** 2;
    if (distance < nearest) { nearest = distance; target = zombie; }
  }
  return target;
}
