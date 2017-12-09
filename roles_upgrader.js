// var upgrader = {
module.exports = {
  parts: [
    [CARRY, WORK, MOVE, MOVE],
    [CARRY, CARRY, WORK, MOVE, MOVE],
  ],

  /** @param {Creep} creep **/
  run: function()  {
    var creep = this.creep;

    if(creep.memory.upgrading === undefined) { creep.memory.upgrading = false; }

    if (creep.memory.upgrading && creep.carry.energy == 0) {
      creep.memory.upgrading = false;
      creep.say('🔄 harvest');
    }

    if (!creep.memory.upgrading && (creep.carry.energy == creep.carryCapacity)) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      // console.log("I am upgrading..")

      if (creep.pos.isNearTo(creep.room.controller)) {
        // console.log(`upgrading ${creep.room.controller}`)
        creep.upgradeController(creep.room.controller);
      } else {
        // console.log(`moving to ${creep.room.controller}`)
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
      }
    }
    else {
      // console.log("I'm not upgrading...");
      const sources = creep.room.find(FIND_SOURCES_ACTIVE);

      // TODO: FINISH THIS
      // STRUCTURE_CONTAINERs
      let target = null
			// console.log("  checking containers...");

      // TODO: You can simplify the code below.
			const containers = creep.room.find(FIND_STRUCTURES, {
											   filter: { structureType: STRUCTURE_CONTAINER }
											 });

			// console.log(`${containers}`);

			for(let i in containers) {
				let container = containers[i];
				// console.log(`container: ${container}`);

				if (container.isActive() && container.store[RESOURCE_ENERGY]  > 0) {
          // console.log(`${container}`)
					target = container;
					break
				}
			}

      if (target) {
        if(creep.pos.isNearTo(target)) {
          // console.log(`getting nrg from ${target}`)
          creep.withdraw(target, RESOURCE_ENERGY);
          return;
        } else {
          // console.log(`moving to ${target}`);
          creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
          return;
        }
      }

      if (creep.pos.isNearTo(sources[0])) {
        // console.log(`harvesting ${sources[0]}`)
        creep.harvest(sources[0]);
      }
      else {
        // console.log(`moving to ${sources[0]}`)
        creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
      }
    }
    //console.groupEnd();
  }
};

// module.exports = upgrader;
