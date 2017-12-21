const performRoles = require('performRoles');
const factory = require('factory');
const spawner = require('spawner');
const messageManager = require('messageManager');

const WALL_REPAIR_MAX = 10000;

module.exports.loop = () => {
  // cleanup dead Screeps
  if (Memory.creeps) {
    Object.keys(Memory.creeps).forEach((key) => {
      if (!Game.creeps[key]) {
        delete Memory.creeps[key];
      }
    });
  }

  // MAIN
  if (Game.rooms) {
    Object.keys(Game.rooms).forEach((key) => {
      factory.theRoom = Game.rooms[key];
      factory.init();
      factory.run();
    });
  }

  spawner.spawnNextInQue();

  performRoles(Game.creeps);

  factory.buildArmyWhileIdle();
  // / END MAIN

  messageManager.showSpawningThings();

  // FIXME: This only works in Spawn1
  const targets = Game.spawns.Spawn1.room.find(FIND_HOSTILE_CREEPS);
  if (targets.length > 0) {
    Game.spawns.Spawn1.room.controller.activateSafeMode();
  }

  // TODO: Move this out into its own file.
  // TOWERS
  const towers = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
    filter: { structureType: STRUCTURE_TOWER },
  });

  _.forEach(towers, (tower) => {
    const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        switch (structure.structureType) {
          case STRUCTURE_WALL:
            return structure.hits < WALL_REPAIR_MAX;
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
};
