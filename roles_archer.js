const proto = require('role_prototype');

const archer = {
  parts: [
    [RANGED_ATTACK, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE],
  ],

  myColor: '#ff0000',

  action() {
    const { creep } = this;

    const target = this.getRangedTarget();
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
  },
};

module.exports = archer;
