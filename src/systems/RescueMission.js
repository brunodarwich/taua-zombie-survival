export class RescueMission {
  constructor(navigation, reception, onDelivered = () => {}) {
    this.navigation = navigation;
    this.reception = reception;
    this.onDelivered = onDelivered;
  }

  update(player, survivors) {
    for (let i = survivors.length - 1; i >= 0; i--) {
      const survivor = survivors[i];
      if (survivor.dead) continue;
      const p = survivor.position;
      if (survivor.state === 'waiting' && Math.hypot(p.x - player.position.x, p.z - player.position.z) < 3.8 && this.navigation.firstHit(p, player.position) === null) {
        survivor.startFollowing();
      }
      if (survivor.state === 'following' && this.navigation.inSafeZone(p) && Math.hypot(p.x - this.reception.x, p.z - this.reception.z) <= 4 && survivor.deliver()) {
        player.rescuedCount++;
        player.score += 350;
        this.onDelivered(survivor);
        survivor.destroy();
        survivors.splice(i, 1);
      }
    }
  }
}
