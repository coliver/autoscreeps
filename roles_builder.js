module.exports = {
  parts: [
    [WORK, CARRY, MOVE],
    [WORK, WORK, CARRY, CARRY, MOVE],
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE, CARRY],
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE, CARRY, MOVE],
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE, CARRY, MOVE, WORK],
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE, CARRY, MOVE, WORK, MOVE],
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE, CARRY, MOVE, WORK, MOVE, CARRY],
  ],

  myColor: '#00ff11',

  action() {
    const { creep } = this;
    // console.log(`this.creep: ${this.creep.name}`);
    // If out of energy, go to git sum and recharge
    if (creep.carry.energy === 0) {
      this.findEnergy();
      return null;
    }

    if (creep.memory.isRoadWorker) {
      this.findRoadSite();
      return null;
    }

    return this.checkRamparts() ||
      this.checkRepairs() ||
      this.checkConstructionSites() ||
      this.fixBrokenWalls() ||
      this.findRoadSite();
  },

  findRoadSite() {
    const sites = this.findConstructionSites(STRUCTURE_ROAD);
    const { creep } = this;

    if (!sites) {
      // No roads? No road workers.
      creep.memory.isRoadWorker = false;
      return false;
    }
    const target = this.sortByProgress(sites)[0];

    if (!creep.pos.isNearTo(target)) {
      creep.moveTo(target, { visualizePathStyle: { stroke: this.myColor } });
      return true;
    }
    creep.say(`⚒️ ${target.structureType}`);
    creep.build(target);
    return true;
  },

  closestThingWithEnergy() {
    // console.log('      closestThingWithEnergy');
    return this.closestContainerWithEnergy(); // ||
    // this.closestExtensionWithEnergy();
  },

  closestDroppedEnergy() {
    const { creep } = this;
    const energy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);

    return energy;
  },

  closestSourceWithEnergy() {
    // console.log('      closestSourceWithEnergy');
    return this.creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
  },

  closestContainerWithEnergy() {
    // console.log('        closestContainerWithEnergy');
    const container = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
      && structure.isActive() && structure.store[RESOURCE_ENERGY] > 0,
    });
    // console.log(`          container: ${container}`);
    return container;
  },

  closestExtensionWithEnergy() {
    // console.log('        closestExtensionWithEnergy');
    const extension = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_EXTENSION && structure.energy > 0,
    });
    // console.log(`          extension: ${extension}`);
    return extension;
  },

  findEnergy() {
    const { creep } = this;
    const target = this.findATarget();
    if (target) {
      if (creep.pos.isNearTo(target)) {
        creep.withdraw(target, RESOURCE_ENERGY);
      } else {
        creep.moveTo(target, { visualizePathStyle: { stroke: this.myColor } });
      }
      return;
    }

    const energy = this.closestDroppedEnergy();
    if (energy) {
      if (creep.pos.isNearTo(energy)) {
        // console.log(`  picking up ${energy}`);
        creep.pickup(energy);
        return;
      }
      creep.moveTo(energy, { visualizePathStyle: { stroke: this.myColor } });
      return;
    }

    const source = this.closestSourceWithEnergy();
    if (source != null) {
      if (creep.pos.isNearTo(source)) {
        creep.say('🔄 harvest');
        creep.harvest(source);
      } else {
        creep.moveTo(source, { visualizePathStyle: { stroke: this.myColor } });
      }
    }
  },

  findATarget() {
    const target = this.closestThingWithEnergy();

    if (target) {
      return target;
    }

    // const closestSpawn = this.creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    // if (closestSpawn.energy > 250) {
    //   target = closestSpawn;
    // }

    return target;
  },

  checkRamparts() {
    const { creep } = this;
    // First, we're going to check for damaged ramparts. We're using ramparts
    // as the first line of defense and we want them nicely maintained. This
    // is especially important when under attack. The builder will repair the
    // most damaged ramparts first
    const max = this.rampartRepairMax();
    const damagedRamparts = creep.room.find(FIND_MY_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_RAMPART &&
                           structure.hits < max,
    });

    damagedRamparts.sort((a, b) => (a.hits - b.hits));

    if (damagedRamparts.length) {
      if (damagedRamparts[0].pos.inRangeTo(creep.pos, 3)) {
        // creep.say('🛠️ rampart');
        creep.repair(damagedRamparts[0]);
        return true;
      }
      creep.moveTo(damagedRamparts[0], { visualizePathStyle: { stroke: this.myColor } });
      return true;
    }
    return false;
  },

  checkRepairs() {
    const { creep } = this;
    // console.log('  checkRepairs');
    // Next we're going to look for general buildings that have less than 50%
    // health, and we'll go to repair those. We set it at 50%, because we
    // don't want builders abandoning their duty every time a road gets walked on
    const toRepair = creep.room.find(FIND_MY_STRUCTURES, {
      filter: structure => (structure.hits / structure.hitsMax) < 0.5 && structure.structureType !== STRUCTURE_RAMPART,
    });

    if (toRepair.length === 0) { return false; }

    const structure = this.creep.pos.findClosestByPath(toRepair);

    if (structure.pos.inRangeTo(creep.pos, 3)) {
      // creep.say('🛠️ repair');
      creep.repair(structure);
      return true;
    }

    creep.moveTo(structure, { visualizePathStyle: { stroke: this.myColor } });
    return true;
  },

  checkConstructionSites() {
    // console.log('  checkConstructionSites');
    const { creep } = this;
    // If no repairs are needed, we're just going to go find some structures to build
    const target = this.findABuildSite();

    if (target) {
      if (!creep.pos.inRangeTo(target, 3)) {
        creep.moveTo(target, { visualizePathStyle: { stroke: this.myColor } });
        return true;
      }
      creep.say(`⚒️ ${target.structureType}`);
      creep.build(target);
      return true;
    }
    return false;
  },

  findABuildSite() {
    // console.log('    findABuildSite');
    const sites = this.findExtensionSites() ||
      this.findContainerSites() ||
      this.findStorageSites() ||
      this.findTowerSites() ||
      this.findRampartSites() ||
      this.findWallSites();

    if (sites) {
      return this.sortByProgress(sites)[0];
    }
    return null;
  },

  findWallSites() {
    return this.findConstructionSites(STRUCTURE_WALL);
  },

  findStorageSites() {
    return this.findConstructionSites(STRUCTURE_STORAGE);
  },

  findConstructionSites(type) {
    // console.log(`        findConstructionSites(${type})`);
    const sites = this.creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: site => site.structureType === type,
    });
    // console.log(`          sites: ${JSON.stringify(sites)}`);
    if (sites.length === 0) { return false; }
    return sites;
  },

  findContainerSites() {
    // console.log('      findContainerSites');
    return this.findConstructionSites(STRUCTURE_CONTAINER);
  },

  findExtensionSites() {
    // console.log('      findExtensionSites');
    return this.findConstructionSites(STRUCTURE_EXTENSION);
  },

  findRampartSites() {
    return this.findConstructionSites(STRUCTURE_RAMPART);
  },

  findTowerSites() {
    // console.log('      findExtensionSites');
    return this.findConstructionSites(STRUCTURE_TOWER);
  },

  fixBrokenWalls() {
    const { creep } = this;
    const max = this.wallRepairMax();
    const repairit = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter(structure) {
        return structure.structureType === STRUCTURE_WALL && structure.hits < max;
      },
    });

    if (repairit) {
      if (!creep.pos.inRangeTo(repairit, 3)) {
        creep.moveTo(repairit, { visualizePathStyle: { stroke: this.myColor } });
        return true;
      }
      // creep.say('🛠️ repair');
      creep.repair(repairit);
      return true;
    }
    return false;
  },

  sortByProgress(sites) {
    if (sites) {
      return sites.sort((a, b) => b.progress - a.progress);
    }
    return null;
  },

  wallRepairMax() {
    return (Game.gcl.level * 10000) || 0;
  },

  rampartRepairMax() {
    return 3000000 * (Game.gcl.level * 0.15);
  },
};
