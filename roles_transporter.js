// TODO: Reconider this whole class. It's basically a unassigned miner_helper.
const transporter = {
  parts: [
    [CARRY, CARRY, WORK, MOVE],
    [CARRY, CARRY, WORK, WORK, MOVE, MOVE, MOVE, MOVE],
  ],

  myColor: '#fa00ff',

  onSpawn() {
    this.creep.memory.mode = 'pickup';
  },

  action() {
    const { creep } = this;
    // console.log(`${creep.name}`);
    if (creep.memory.mode === undefined) { creep.memory.mode = 'pickup'; }

    // TODO: Rework this to be a ammo hauler / extension filler
    // Check if there is anything in storage and if there are any low checkExtensions
    // and then fill them up.
    // Same with towers.
    let target = null;

    if (creep.memory.mode === 'pickup') {
      if (creep.memory.target && creep.memory.target.id) {
        target = Game.getObjectById(creep.memory.target.id);
      }

      // console.log(`  target to pickup from: ${target}`);
      if (target) {
        const ret = creep.withdraw(target, RESOURCE_ENERGY);
        switch (ret) {
          case ERR_NOT_IN_RANGE:
            this.travelTo(target);
            break;
          case ERR_FULL:
            creep.say('IM FULL');
            creep.memory.mode = 'dropoff';
            creep.memory.target = null;
            break;
          case OK:
            if (this.isFull()) {
              creep.say('IM FULL');
              creep.memory.mode = 'dropoff';
              creep.memory.target = null;
            }
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.target = null;
            break;
          case ERR_INVALID_TARGET:
            // FIXME: Dont use error handling as a logic gate
            if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
              this.travelTo(target);
            }
            break;
          case ERR_INVALID_ARGS:
            throw new Error(`Invalid args: ${target}`);
          default:
            throw new Error(`ret: ${ret}`);
        }
        if (!this.isFull()) {
          return;
        }
        creep.memory.mode = 'dropoff';
        creep.say('📦Dropoff');
        return;
      }

      // console.log('  find energy');
      // randomly dropped energy
      target = this.closestDroppedEnergy();
      if (target) {
        creep.memory.target = target;
        if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
          this.travelTo(target);
        }
        return;
      }
      // containers
      target = this.closestContainerWithEnergy();
      if (target) {
        creep.memory.target = target;
        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          this.travelTo(target);
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
      this.travelTo(source);
      return;
    }

    // PICKUP MODE DA GREATEST
    // Try finding a needful buddy
    target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: builder => (builder.memory.role === 'builder' || builder.memory.role === 'upgrader') && (_.sum(builder.carry) < (creep.carryCapacity)),
    }) || this.checkExtensions() || this.checkTowers();

    if (!target) {
      // console.log('  use a spawn');
      target = this.creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    }

    this.doTargetThings(target);
  },

  checkExtensions() {
    // console.log("  checkExtensions")
    const extensions = this.creep.room.find(FIND_MY_STRUCTURES, {
      filter: structure => (structure.structureType === STRUCTURE_EXTENSION) &&
                           (structure.energy < structure.energyCapacity),
    });
    if (!extensions) { return null; }
    return this.creep.pos.findClosestByRange(extensions);
  },

  checkTowers() {
    // console.log(`  checkTowers()`);
    const towers = this.creep.room.find(FIND_MY_STRUCTURES, {
      filter: tower => (tower.structureType === STRUCTURE_TOWER &&
        tower.isActive() &&
        tower.energy < tower.energyCapacity - 100),
    });
    if (!towers) { return null; }
    return this.creep.pos.findClosestByRange(towers);
  },

  doTargetThings(target) {
    const { creep } = this;
    // console.log(`  target to drop off to: ${target}`);
    // Go to target and give it energy
    if (creep.pos.isNearTo(target)) {
      // console.log(`  transferring ${creep.carry.energy} energy to ${target.name}`);
      creep.say('⚡ transferring');
      creep.transfer(target, RESOURCE_ENERGY);
    } else {
      // console.log(`  moving to ${target}`);
      this.travelTo(target);
    }

    if (_.sum(creep.carry) === 0) {
      creep.memory.mode = 'pickup';
      creep.say('💼 pickup');
    }
  },

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

    // // console.log(`      energy: ${energy}`);
    return energy;
  },

};

module.exports = transporter;
