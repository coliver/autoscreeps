// TODO: Reconider this whole class. It's basically a unassigned miner_helper.
const transporter = {
  parts: [
    [CARRY, CARRY, WORK, MOVE],
  ],

  myColor: '#fa00ff',

  closestContainerWithEnergy() {
    // console.log('    closestContainerWithEnergy');
    const container = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
      && structure.isActive() && structure.store[RESOURCE_ENERGY] > 0,
    });
    // console.log(`      container: ${container}`);
    return container;
  },

  closestDroppedEnergy() {
    // console.log('    closestDroppedEnergy');
    const { creep } = this;
    const energy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);

    // console.log(`      energy: ${energy}`);
    return energy;
  },

  action() {
    const { creep } = this;
    // console.log(`${creep.name}`);

    // TODO: Rework this to be a ammo hauler / extension filler
    // Check if there is anything in storage and if there are any low checkExtensions
    // and then fill them up.
    // Same with towers.
    let target = null;

    if (_.sum(creep.carry) === 0) {
      // console.log('  find energy');
      // First try containers
      target = this.closestContainerWithEnergy();
      if (target) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        return;
      }

      // Then randomly dropped energy
      target = this.closestDroppedEnergy();
      if (target) {
        if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        return;
      }
      // Other
      const source = this.creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
      if (creep.pos.isNearTo(source)) {
        // console.log(`  harvesting ${source}`);
        creep.harvest(source);
        return;
      }

      // console.log(`  moving to ${source} to get NRG`);
      creep.moveTo(source, { visualizePathStyle: { stroke: this.myColor } });
      return;
    }

    // Transfer to builder
    // console.log('  find a builder');
    const builderToHelp = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: builder => (builder.memory.role === 'builder' || builder.memory.role === 'upgrader') && (_.sum(builder.carry) < (builder.carryCapacity)),
    });
    if (builderToHelp) {
      // console.log('    found a builder to help');
      target = builderToHelp;
    }

    if (!target) {
      // console.log('  use a spawn');
      target = this.creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    }

    // Go to target and give it energy
    if (creep.pos.isNearTo(target)) {
      if (_.sum(target.carry) < target.carryCapacity) {
        // console.log(`  transferring ${creep.carry.energy} energy to ${target.name}`);
        creep.say('⚡ transferring');
        creep.transfer(target, RESOURCE_ENERGY);
      }
    } else {
      // console.log(`  moving to ${target}`);
      creep.moveTo(target, { visualizePathStyle: { stroke: this.myColor } });
    }
  },
};

module.exports = transporter;
