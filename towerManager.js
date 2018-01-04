const towerManager = {
  theRoom: null,

  manageTowers() {
    const towers = this.theRoom.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_TOWER },
    });

    _.forEach(towers, (tower) => {
      const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          switch (structure.structureType) {
            case STRUCTURE_WALL:
              return structure.hits < this.wallRepairMax();
            default:
              return structure.hits < structure.hitsMax;
          }
        },
      });
      if (closestDamagedStructure) {
        tower.repair(closestDamagedStructure);
      }

      const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        tower.attack(closestHostile);
      }
    });
  },

  wallRepairMax() {
    return Game.gcl.level * 10000;
  },
};

module.exports = towerManager;
