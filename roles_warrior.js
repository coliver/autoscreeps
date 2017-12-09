var proto = require('role_prototype');

var warrior = {
	parts: [
		[TOUGH, TOUGH, MOVE, ATTACK, ATTACK]
	],

	/**
	 * @TODO: We need to get archers to prioritise their targets better
	 */
	action: function()
	{
		var creep = this.creep;

    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(target) {
      if(creep.attack(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }

		//If there's not a target near by, let's go search for a target if need be
		if(target === null)
			return this.rest();
	}
};

module.exports = warrior;
