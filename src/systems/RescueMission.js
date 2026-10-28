export class RescueMission {
  constructor(navigation, reception, onDelivered = () => {}) {
    this.navigation = navigation;
    this.reception = reception;
    this.onDelivered = onDelivered;
    this.rescuedSurvivors = [];
  }

  arrangeShelter() {
    // Two banks of residents keep the coordinator and entrance accessible.
    const count = this.rescuedSurvivors.length;
    const columns = Math.ceil(Math.sqrt(count / 2));
    const rows = Math.ceil(count / (columns * 2));
    this.rescuedSurvivors.forEach((survivor, i) => {
      const slot = Math.floor(i / 2);
      const x = 3.5 + (columns > 1 ? (slot % columns) * 4 / (columns - 1) : 0);
      const z = this.reception.z - 3 + (rows > 1 ? Math.floor(slot / columns) * 8 / (rows - 1) : 4);
      survivor.setShelterPosition({ x: this.reception.x + (i % 2 ? x : -x), y: 0, z });
    });
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
        this.rescuedSurvivors.push(survivor);
        this.arrangeShelter();
        survivors.splice(i, 1);
      }
    }
  }
}
