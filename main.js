const performRoles = require('performRoles');
const factory = require('factory');
const spawner = require('spawner');
const messageManager = require('messageManager');
const towerManager = require('towerManager');

// const profiler = require('screeps-profiler');
// // This line monkey patches the global prototypes.
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
    });
  }

  spawner.spawnNextInQue();
  performRoles(Game.creeps);
  factory.buildArmyWhileIdle();
  messageManager.showMessages();
  // });
};
