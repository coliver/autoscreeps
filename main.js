const performRoles = require('performRoles');
const factory = require('factory');
const spawner = require('spawner');

const WALL_REPAIR_MAX = 10000

module.exports.loop = function () {
  //cleanup dead Screeps
  for(var i in Memory.creeps) {
    if(!Game.creeps[i]) {
        delete Memory.creeps[i];
    }
  }

  // MAIN
  factory.init();
  factory.run();

  spawner.spawnNextInQue();

  performRoles(Game.creeps);

  factory.buildArmyWhileIdle();
  /// END MAIN

  // TODO find a better spot for this
  // Show room messages
  // Say what is spawning:
  const spawns = _.filter(Game.spawns, (spawn) =>  spawn.spawning != null || spawn.spawning != undefined);
  for(let i in spawns) {
    const s = spawns[i];
    s.room.visual.text(`🛠️ ${s.spawning.name} ${s.spawning.remainingTime}`, s.pos, {color: '#fefefe', font: 0.8});
  }

  // FIXME: This only works in Spawn1
  const targets = Game.spawns.Spawn1.room.find(FIND_HOSTILE_CREEPS);
  if(targets.length > 0) {
    Game.spawns.Spawn1.room.controller.activateSafeMode();
  }

  // TODO: Move this out into its own file.
  // TOWERS
  const towers = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
                  filter: { structureType: STRUCTURE_TOWER }
                 })

  _.forEach(towers, function(tower) {
    let closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        switch (structure.structureType) {
          case STRUCTURE_WALL:
            return structure.hits < WALL_REPAIR_MAX;
          default:
            return structure.hits < structure.hitsMax;
        }
      }
    });
    if(closestDamagedStructure) {
      tower.repair(closestDamagedStructure);
    }

    let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
      tower.attack(closestHostile);
    }
  })
}
