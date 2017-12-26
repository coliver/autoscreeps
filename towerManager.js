const towerManager = {
  theRoom: null,
  WALL_REPAIR_MAX: 10000,

  manageTowers() {
    const towers = this.theRoom.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_TOWER },
    });

    _.forEach(towers, (tower) => {
      const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          switch (structure.structureType) {
            case STRUCTURE_WALL:
              return structure.hits < this.WALL_REPAIR_MAX;
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
};

module.exports = towerManager;
