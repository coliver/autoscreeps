// Finds a source, and stays near it.
// His job is just to mine away and let the energy fall on the ground
const miner = {
  parts: [
    [MOVE, WORK, WORK],
    [MOVE, WORK, WORK, WORK, WORK],
    [MOVE, WORK, WORK, WORK, WORK, WORK],
  ],

  beforeAge() {
    const { creep } = this;

    // Cleanup memory
    if (Memory.sources[creep.memory.source].miner === creep.id) {
      delete Memory.sources[creep.memory.source].miner;
    }
  },

  getOpenSource() {
    // console.log("creep.getOpenSource")
    const { creep } = this;

    return creep.pos.findClosestByRange(FIND_SOURCES, {
      filter(source) {
        const memorySource = Memory.sources[source.id];

        if (memorySource == null || memorySource.miner == null || memorySource.miner === creep.id) {
          return true;
        }

        if (Game.getObjectById(memorySource.miner) == null) {
          return true;
        }

        return false;
      },
    });
  },

  setSourceToMine(source) {
    // console.log(`  setSourceToMine(${source})`)
    const { creep } = this;
    const memorySources = Memory.sources;
    const sourceId = source.id;

    if (!source) {
      return;
    }

    if (memorySources[sourceId] == null) {
      memorySources[sourceId] = { id: sourceId };
    }

    memorySources[sourceId].miner = creep.id;
    creep.memory.source = sourceId;
  },

  createHelpers(source) {
    const { creep } = this;
    const helperSpawn = source.pos.findClosestByRange(FIND_MY_SPAWNS);

    const steps = helperSpawn.pos.findPathTo(source).length * 2;
    let creepsNeeded = Math.round((steps * 8) / 100);

    if (creepsNeeded > 5) {
      creepsNeeded = 5;
    }

    for (let i = 0; i < creepsNeeded; i += 1) {
      Memory.spawnQue.unshift({
        type: 'miner_helper',
        memory: { miner: creep.id },
      });
    }
    creep.memory.helpersNeeded = creepsNeeded;
  },

  onSpawn() {
    // console.log"creep.onSpawn");
    const { creep } = this;

    creep.memory.isNearSource = false;
    creep.memory.helpers = [];

    const source = this.getOpenSource();
    this.setSourceToMine(source);
    this.createHelpers(source);

    creep.memory.onSpawned = true;
  },

  action() {
    // console.log`${this.creep.name} action`)
    const { creep } = this;

    // Basically, each miner can empty a whole source by themselves.
    // Since they're slow, we don't have them moving away from the source when
    // it's empty, it'd regenerate before they got to another one. For this, we
    // assign one miner to one source, and they stay with it
    let source = Game.getObjectById(creep.memory.source);

    if (source == null) {
      source = this.getOpenSource();

      if (!source) {
        return;
      }

      this.setSourceToMine(source);
    }

    if (creep.pos.inRangeTo(source, 5)) {
      creep.memory.isNearSource = true;
    } else {
      creep.memory.isNearSource = false;
    }

    if (Memory.sources[source.id] == null) {
      Memory.sources[source.id] = { id: source.id };
    }
    Memory.sources[source.id].miner = creep.id;
    // console.log`${this.creep.name} action Moving to ${source}!`)
    if (creep.pos.isNearTo(source)) {
      creep.harvest(source);
    } else {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }

    this.keepAwayFromEnemies();
  },
};

module.exports = miner;
