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

  // There should be at least 1 builder working on roads
  onSpawn() {
    // TODO: make the spawner or factory care about this
    const type = 'builder';
    const builders = _.filter(Game.creeps, { memory: { role: type } });
    if (builders.length < 2) {
      return;
    }

    const roadWorkers = _.filter(builders, { memory: { isRoadWorker: true } });

    if (roadWorkers.length > 0) {
      return;
    }

    this.creep.memory.isRoadWorker = true;
  },

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
      this.findRoadSite() ||
      this.fillExtensions();
  },

  // TODO: Thie is c+p'd everywhere. centralize it
  fillExtensions() {
    const { creep } = this;
    // console.log("  checkExtensions")
    const extensions = this.creep.room.find(FIND_MY_STRUCTURES, {
      filter: structure => (structure.structureType === STRUCTURE_EXTENSION) &&
                           (structure.energy < structure.energyCapacity),
    });
    if (!extensions) { return null; }
    const target = this.creep.pos.findClosestByRange(extensions);
    if (creep.pos.isNearTo(target)) {
      const ret = creep.transfer(target, RESOURCE_ENERGY);
      if (ret !== OK) {
        // console.log(`  dropping nrg`);
        return creep.drop(RESOURCE_ENERGY);
      }
      return ret;
    }
    return this.travelTo(target);
  },

  findRoadSite() {
    const sites = this.findConstructionSites(STRUCTURE_ROAD);
    const { creep } = this;

    if (!sites) {
      // check Memory for where roads should be

      // No roads? No road workers.
      creep.memory.isRoadWorker = false;
      return false;
    }
    const target = this.sortByProgress(sites)[0];

    if (!creep.pos.isNearTo(target)) {
      this.travelTo(target);
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
        this.travelTo(target);
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
      this.travelTo(energy);
      return;
    }

    const source = this.closestSourceWithEnergy();
    if (source != null) {
      if (creep.pos.isNearTo(source)) {
        creep.say('🔄 harvest');
        creep.harvest(source);
      } else {
        this.travelTo(source);
      }
    }
  },

  findATarget() {
    return this.closestThingWithEnergy();
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
      this.travelTo(damagedRamparts[0]);
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
      filter: structure =>
        ((structure.hits / structure.hitsMax) < 0.5) &&
        (structure.structureType !== STRUCTURE_RAMPART),
    });

    if (toRepair.length === 0) { return false; }

    const structure = this.creep.pos.findClosestByPath(toRepair);

    if (structure.pos.inRangeTo(creep.pos, 3)) {
      // creep.say('🛠️ repair');
      creep.repair(structure);
      return true;
    }
    this.travelTo(structure);
    return true;
  },

  checkConstructionSites() {
    // console.log('  checkConstructionSites');
    const { creep } = this;
    // If no repairs are needed, we're just going to go find some structures to build
    const target = this.findABuildSite();

    if (target) {
      if (!creep.pos.inRangeTo(target, 3)) {
        this.travelTo(target);
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
    // console.log('findWallSites()');
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
    // const repairit = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    //   filter(structure) {
    //     return structure.structureType === STRUCTURE_WALL && structure.hits < max;
    //   },
    // });

    const walls = creep.room.find(FIND_STRUCTURES, {
      filter(structure) {
        return structure.structureType === STRUCTURE_WALL && structure.hits < max;
      },
    });
    if (!walls) { return false; }

    const sortedWalls = walls.sort((a, b) => a.hits - b.hits);
    // console.log(JSON.stringify(sortedWalls[0]));
    const repairit = sortedWalls[0];

    if (creep.repair(repairit) === ERR_NOT_IN_RANGE) {
      this.travelTo(repairit);
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
    const { creep } = this;
    const controllerLevel = creep.room.controller.level;
    return (controllerLevel * 100000) || 0;
  },

  rampartRepairMax() {
    const { creep } = this;
    const controllerLevel = creep.room.controller.level;

    return 100000 * controllerLevel;
  },
};
