const archer = {
  parts: [
    [RANGED_ATTACK, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE],
    [TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
  ],

  myColor: '#ff0000',

  action() {
    const { creep } = this;
    // console.log(`${creep.name}`);

    const target = this.getRangedTarget();
    // console.log(`  target: ${target}`);
    if (target !== null) {
      creep.rangedAttack(target);
    }

    // If there's not a target near by, let's go search for a target if
    // need be
    if (target === null) {
      return this.rest();
    }

    this.kite(target);
    creep.rangedAttack(target);

    return null;
  },
};

module.exports = archer;
