const warrior = {
  parts: [
    [TOUGH, TOUGH, MOVE, ATTACK, ATTACK],
  ],

  action() {
    const { creep } = this;

    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (target) {
      if (creep.attack(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }

    if (target === null) { return this.rest(); }
  },
};

module.exports = warrior;
