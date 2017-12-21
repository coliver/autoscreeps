module.exports = {
  parts: [
    [TOUGH, MOVE, MOVE, HEAL],
    // [MOVE, MOVE, MOVE, HEAL, HEAL, HEAL]
  ],

  action() {
    const { creep } = this;

    this.keepAwayFromEnemies();

    // Find my creeps that are hurt. If they're hurt, heal them.
    // If there aren't any hurt, we're going to try and get the healers
    // to tick near the guards, so that they're close by when the battle starts
    const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter(t) { return t.hits < t.hitsMax; },
    });

    if (target) {
      if (creep.isNearTo(target)) {
        creep.say('💉 Healing');
        creep.heal(target);
      } else {
        creep.moveTo(target);
      }
    } else {
      this.rest();
    }
  },
};
