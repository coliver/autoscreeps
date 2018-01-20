const upgrader = {
  parts: [
    [CARRY, WORK, WORK, MOVE],
    [CARRY, WORK, WORK, WORK, MOVE],
    [CARRY, WORK, WORK, WORK, WORK, MOVE],
    [CARRY, WORK, WORK, WORK, WORK, WORK, MOVE],
  ],

  myColor: '#ff0011',

  /** @param {Creep} creep * */
  run() {
    const { creep } = this;

    if (creep.memory.upgrading === undefined) { creep.memory.upgrading = false; }

    if (creep.memory.upgrading && creep.carry.energy === 0) {
      creep.memory.upgrading = false;
      creep.say('🔄 harvest');
    }

    if (!creep.memory.upgrading && (creep.carry.energy === creep.carryCapacity)) {
      creep.memory.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.upgrading) {
      // console.log("I am upgrading..")
      if (creep.pos.inRangeTo(creep.room.controller.pos, 3)) {
        // console.log(`upgrading ${creep.room.controller}`)
        creep.upgradeController(creep.room.controller);
        return;
      }
      // console.log(`moving to ${creep.room.controller}`)
      this.travelTo(creep.room.controller);
      return;
    }

    // console.log("I'm not upgrading...");
    const sources = creep.room.find(FIND_SOURCES_ACTIVE);

    // TODO: FINISH THIS
    // STRUCTURE_CONTAINERs
    let target = null;
    // console.log("  checking containers...");

    // TODO: You can simplify the code below.
    const containers = creep.room.find(FIND_STRUCTURES, {
      filter: { structureType: STRUCTURE_CONTAINER },
    });

    // console.log(`${containers}`);
    for (let i = 0; i < containers.length; i += 1) {
      const container = containers[i];
      // console.log(`container: ${container}`);
      if (container.isActive() && container.store[RESOURCE_ENERGY] > 0) {
        // console.log(`${container}`)
        target = container;
        break;
      }
    }

    if (target) {
      if (creep.pos.isNearTo(target)) {
        // console.log(`getting nrg from ${target}`)
        creep.withdraw(target, RESOURCE_ENERGY);
        return;
      }
      // console.log(`moving to ${target}`);
      this.travelTo(target);

      return;
    }

    if (creep.pos.isNearTo(sources[0])) {
      // console.log(`harvesting ${sources[0]}`)
      creep.harvest(sources[0]);
    } else {
      // console.log(`moving to ${sources[0]}`)
      this.travelTo(sources[0]);
    }
  },
};

module.exports = upgrader;
