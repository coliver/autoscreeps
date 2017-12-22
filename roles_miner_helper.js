// This guy does the other half of energy collection. The miner gets it from the source, and the
// helper does the transportation. We don't want them just going for the nearest source, as that
// means that if we have more than one miner, all the helpers will only go for the first miner. To
// counter this, we assign them to a miner the same way we assign a miner to a source

// const helper = {
module.exports = {
  parts: [
    [MOVE, CARRY, MOVE, CARRY],
    [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
  ],

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
    if (this.grabDroppedEnergy()) {
      return;
    }

    let target = this.findATarget();

    const courier = this.findACourier();
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
    } else {
      // console.log(`  moving to ${target.name}`);
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
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

  // TODO: Refactor this to be more DRY
  findATarget() {
    // console.log(`  findATarget`)
    const { creep } = this;
    let target = null;

    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

    target = this.checkExtensions(creep.room);
    if (target) {
      // console.log(`  extension wins: (${target})`)
      return target;
    }

    target = this.checkTowers(creep.room);
    if (target) {
      // console.log(`  tower wins: (${target})`)
      return target;
    }

    target = this.checkContainers(creep.room);
    // STRUCTURE_CONTAINERs
    if (target) {
      // console.log(`  container wins: (${target})`)
      return target;
    }

    target = this.checkStorage(creep.room);
    if (target) {
      // console.log(`  storage wins: (${target})`)
      return target;
    }

    // console.log(`No one wins :C target: ${spawn}`)
    return spawn;
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
        creep.moveTo(miner, { visualizePathStyle: { stroke: '#ffaa00' } });
        return true;
      }
    }
    return false;
  },

  checkExtensions(room) {
    // console.log(`    checkExtensions(${spawn})`)
    let target = null;
    if (room == null) {
      return null;
    }

    // console.log("  checkig extensions...")
    const extensions = room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_EXTENSION },
    });

    for (let i = 0; i < extensions.length; i += 1) {
      const ext = extensions[i];
      if (ext.isActive() && (ext.energy < ext.energyCapacity)) {
        // console.log(`  assigning ${ext} as target`)
        target = ext;
        break;
      }
    }
    return target;
  },

  checkContainers(room) {
    // console.log(`    checkContainers(${room})`);
    return this.checkStorageTypeThing(STRUCTURE_CONTAINER, room);
  },

  checkStorage(room) {
    // console.log(`    checkStorage(${room})`);
    return this.checkStorageTypeThing(STRUCTURE_STORAGE, room);
  },

  // Type can be STRUCTURE_CONTAINER or STRUCTURE_STORAGE
  checkStorageTypeThing(type, room) {
    // console.log(`      checkStorageTypeThing(${type})`)
    let target = null;
    const thingies = room.find(FIND_STRUCTURES, {
      filter: { structureType: type },
    });

    for (let i = 0; i < thingies.length; i += 1) {
      const thing = thingies[i];
      // console.log(`  container: ${thing}`);
      if (thing.isActive() && thing.store[RESOURCE_ENERGY] < thing.storeCapacity) {
        target = thing;
        break;
      }
    }
    // console.log(`  ${target}`)
    return target;
  },

  checkTowers(room) {
    // console.log(`  checkTowers(${room})`);
    const towers = room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_TOWER },
    });
    let target = null;
    for (let i = 0; i < towers.length; i += 1) {
      const tower = towers[i];
      if (tower.isActive() && tower.energy < tower.energyCapacity - 100) {
        target = tower;
        break;
      }
    }
    return target;
  },
};

// module.exports = helper;
