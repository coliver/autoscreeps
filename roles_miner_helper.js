// This guy does the other half of energy collection. The miner gets it from the source, and the
// helper does the transportation. We don't want them just going for the nearest source, as that
// means that if we have more than one miner, all the helpers will only go for the first miner. To
// counter this, we assign them to a miner the same way we assign a miner to a source

// const helper = {
module.exports = {
  parts: [
    [MOVE, CARRY, MOVE, CARRY],
    [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
    // [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
  ],

  myColor: '#ffaa00',

  onSpawn() {
    this.creep.memory.mode = 'pickup';
  },

  action() {
    const { creep } = this;
    // console.log(`${creep.name}`);

    if (this.courierCheck()) {
      return;
    }

    // If this helper isn't assigned to a miner, find one and assign him to it.
    // If it is assigned to a miner, then find that miner by his id
    if (creep.memory.miner === undefined) { this.assignMiner(); }
    const miner = Game.getObjectById(creep.memory.miner);
    if (miner == null) {
      creep.suicide();
      return;
    }

    // Grab dropped energy near me or move to the miner
    if (creep.memory.mode === 'pickup' && this.grabDroppedEnergy()) {
      return;
    }

    creep.memory.mode = 'dropoff';

    let target = this.findATarget();

    const courier = this.findACourier(target);
    // If we found a courier, make that courier our new target
    if (courier !== null && !creep.pos.isNearTo(target)) {
      // console.log`  found a courier! (${courier})`)
      target = courier;
      target.memory.courier = true;
    }

    // If we're near to the target, either give it our energy or drop it
    // At this point our target can be a spawn, extension, or a courier.
    if (creep.pos.isNearTo(target)) {
      // console.log(`  transferring energy to ${target}`)
      if (creep.transfer(target, RESOURCE_ENERGY) !== OK) {
        // console.log(`  dropping nrg`);
        creep.drop(RESOURCE_ENERGY);
      }
      if (_.sum(creep.carry) === 0) {
        creep.memory.mode = 'pickup';
        creep.say('Pickup');
      }
    } else {
      // console.log(`  moving to ${target.name}`);
      creep.moveTo(target, { visualizePathStyle: { stroke: this.myColor } });
    }
    this.placeRoad();
  },

  assignMiner() {
    // console.log(`  assigning a miner`);
    const { creep } = this;

    const miner = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter(dude) {
        if (dude.memory.role === 'miner' &&
        dude.memory.helpers.length < dude.memory.helpersNeeded) {
          return true;
        }
        return false;
      },
    });

    if (miner === undefined) { return; }

    creep.memory.miner = miner.id;
    miner.memory.helpers.push(creep.id);
  },

  courierCheck() {
    const { creep } = this;

    if (creep.memory.courier === true) {
      creep.memory.courier = false;
      return true;
    }
    return false;
  },

  findACourier(target) {
    const { creep } = this;
    // Let's get the direction we want to go in
    const targetDirection = creep.pos.findPathTo(target, { ignoreCreeps: true })[0].direction;

    // Let's look for a courier in that direction. We'll check on making sure they're the right
    // role, if they can hold any energy, if they're in range and if they're in the same direction
    let leftDir = targetDirection - 1;
    let rightDir = targetDirection + 1;

    if (leftDir < 1) { leftDir += 8; }
    if (leftDir > 8) { leftDir -= 8; }

    if (rightDir < 1) { rightDir += 8; }
    if (rightDir > 8) { rightDir -= 8; }

    const courier = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter(possibleTarget) {
        return (
          possibleTarget.memory.role === creep.memory.role
          && possibleTarget.memory.miner === creep.memory.miner
          && possibleTarget.carry.energy < possibleTarget.carryCapacity
          && creep.pos.inRangeTo(possibleTarget, 1)
          && (
            creep.pos.getDirectionTo(possibleTarget) === targetDirection
          || creep.pos.getDirectionTo(possibleTarget) === leftDir
          || creep.pos.getDirectionTo(possibleTarget) === rightDir
          )
        );
      },
    });

    return courier;
  },

  findATarget() {
    // console.log(`  findATarget`)
    return this.checkExtensions() ||
      this.checkTowers() ||
      this.checkContainers() ||
      this.checkStorage() ||
      this.creep.pos.findClosestByRange(FIND_MY_SPAWNS);
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

  checkContainers() {
    // console.log(`    checkContainers()`);
    return this.checkStorageTypeThing(STRUCTURE_CONTAINER);
  },

  checkStorage() {
    // console.log(`    checkStorage()`);
    return this.checkStorageTypeThing(STRUCTURE_STORAGE);
  },

  // Type can be STRUCTURE_CONTAINER or STRUCTURE_STORAGE
  checkStorageTypeThing(type) {
    // console.log(`      checkStorageTypeThing(${type})`)
    const thingies = this.creep.room.find(FIND_STRUCTURES, {
      filter: structure => (structure.structureType === type &&
        structure.isActive() &&
        structure.store[RESOURCE_ENERGY] < structure.storeCapacity),
    });

    if (!thingies) { return null; }
    return this.creep.pos.findClosestByRange(thingies);
  },

  grabDroppedEnergy() {
    const { creep } = this;
    const miner = Game.getObjectById(creep.memory.miner);

    // If we can still pick up energy, let's do that
    if (_.sum(creep.carry) < creep.carryCapacity) {
      if (creep.pos.isNearTo(miner)) {
        const energy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0];

        if (energy) {
          // console.log(`  picking up ${energy}`);
          creep.pickup(energy);
          return true;
        }
      } else if (miner.memory.isNearSource) {
        // console.log(`  moving to ${miner}`);
        creep.moveTo(miner, { visualizePathStyle: { stroke: this.myColor } });
        return true;
      }
    }
    creep.memory.mode = 'dropoff';
    creep.say('Dropoff');
    return false;
  },
};

// module.exports = helper;
