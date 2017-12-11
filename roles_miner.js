/**
 * This guy just finds a source, and stays near it. His job is just to mine away and let the energy fall on the ground
 *
 * @TODO: See if we can't implement preffered spawn spots close to their source
 * @param creep
 */
var miner = {
  parts: [
    [MOVE, WORK, WORK],
    // [MOVE, WORK, WORK, WORK, WORK],
    // [MOVE, WORK, WORK, WORK, WORK, WORK]
  ],

  beforeAge: function() {
    const creep = this.creep;

    // Cleanup memory
    if(Memory.sources[creep.memory.source].miner == creep.id) {
      delete Memory.sources[creep.memory.source].miner
    }
  },

  getOpenSource: function() {
    // console.log("creep.getOpenSource")
    var creep = this.creep;

    var source = creep.pos.findClosestByRange(FIND_SOURCES, {
      filter: function(source) {
        if(Memory.sources[source.id] == undefined || Memory.sources[source.id].miner == undefined || Memory.sources[source.id].miner == creep.id)
          return true;

        if(Game.getObjectById(Memory.sources[source.id].miner) == null)
          return true;

        return false;
      }
    });
    // console.log`  source: ${source}`)
    return source;
  },

  setSourceToMine: function(source) {
    // console.log(`  setSourceToMine(${source})`)
    var creep = this.creep;

    if(!source)
      return;

    if(Memory.sources[source.id] == undefined)
      Memory.sources[source.id] = { id: source.id };

    Memory.sources[source.id].miner = creep.id;
    creep.memory.source = source.id;
  },

  createHelpers(source) {
    var creep = this.creep
    var helperSpawn = source.pos.findClosestByRange(FIND_MY_SPAWNS);

    var steps = helperSpawn.pos.findPathTo(source).length * 2;
    var creepsNeeded = Math.round((steps * 8) / 100);

    if(creepsNeeded > 5)
      creepsNeeded = 5;

    for(var i = 0; i < creepsNeeded; i++) {
      Memory.spawnQue.unshift({ type: 'miner_helper', memory: {
        miner: creep.id
      }});
    }

    creep.memory.helpersNeeded = creepsNeeded;
  },

  onSpawn: function() {
// console.log"creep.onSpawn")
    var creep = this.creep;

    creep.memory.isNearSource = false;
    creep.memory.helpers = [];

    var source = this.getOpenSource();
    this.setSourceToMine(source);
    this.createHelpers(source);

    creep.memory.onSpawned = true;
  },

  action: function() {
    // console.log`${this.creep.name} action`)
    var creep = this.creep;

    //Basically, each miner can empty a whole source by themselves. Also, since they're slow, we don't have them
    //moving away from the source when it's empty, it'd regenerate before they got to another one.
    //For this, we assign one miner to one source, and they stay with it
    var source = Game.getObjectById(creep.memory.source);

    if(source == null) {
      var source = this.getOpenSource();

      if(!source)
        return;

      this.setSourceToMine(source);
    }

    if(creep.pos.inRangeTo(source, 5))
      creep.memory.isNearSource = true;
    else
      creep.memory.isNearSource = false;

    if(Memory.sources[source.id] == undefined)
      Memory.sources[source.id] = { id: source.id };

    Memory.sources[source.id].miner = creep.id;
// console.log`${this.creep.name} action Moving to ${source}!`)
    if (creep.pos.isNearTo(source)) {
      creep.harvest(source);
    } else {
      creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

    this.keepAwayFromEnemies();
  }
};

module.exports = miner;
