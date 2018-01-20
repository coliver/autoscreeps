const performRoles = require('performRoles');
const factory = require('factory');
const spawner = require('spawner');
const messageManager = require('messageManager');
const towerManager = require('towerManager');

// const profiler = require('screeps-profiler');
// profiler.enable();

module.exports.loop = () => {
  // profiler.wrap(() => {
  // Main.js logic should go here.
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

      towerManager.theRoom = Game.rooms[key];
      towerManager.manageTowers();

      // TODO: Find a place for this.
      // build roads maybe
      if (Memory.rooms[key].ticksToBuild === undefined) { Memory.rooms[key].ticksToBuild = 500; }

      if (Memory.rooms[key].ticksToBuild <= 0) {
        // console.log('BUILD ALL THE ROADS');
        const construction = require('constructionPlanner');
        construction.theRoom = Game.rooms[key];
        construction.buildRoadsToAllSources();
        Memory.rooms[key].ticksToBuild = 500;
      } else {
        Memory.rooms[key].ticksToBuild -= 1;
      }
    });
  }

  spawner.spawnNextInQue();
  performRoles(Game.creeps);
  factory.buildArmyWhileIdle();
  messageManager.showMessages();
  // });
};
