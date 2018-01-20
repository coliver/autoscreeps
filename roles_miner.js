// Finds a source, and stays near it.
// His job is just to mine away and let the energy fall on the ground
const miner = {
  MAX_HELPERS: 5,

  myColor: '#ffaa00',

  parts: [
    [MOVE, MOVE, WORK, WORK],
    // [MOVE, WORK, WORK, WORK],
    // [MOVE, WORK, WORK, WORK, WORK, WORK],
  ],

  action() {
    // console.log`${this.creep.name} action`)
    const { creep } = this;

    this.setSource();

    // Basically, each miner can empty a whole source by themselves.
    // Since they're slow, we don't have them moving away from the source when
    // it's empty, it'd regenerate before they got to another one. For this, we
    // assign one miner to one source, and they stay with it
    const source = Game.getObjectById(creep.memory.source);

    if (source == null) {
      return;
    }

    if (!creep.memory.isNearSource) {
      creep.memory.isNearSource = creep.pos.inRangeTo(source, 5);
    }

    if (Memory.sources[source.id] == null) {
      Memory.sources[source.id] = { id: source.id };
    }
    Memory.sources[source.id].miner = creep.id;

    if (!creep.memory.isNextToSource && !creep.pos.isNearTo(source)) {
      creep.memory.isNextToSource = false;
      this.travelTo(source);
      this.keepAwayFromEnemies();
      return;
    }

    creep.memory.isNextToSource = true;

    // If we are near a source, make a container.
    if (!creep.memory.containerSiteBuilt) {
      const ret = creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);

      switch (ret) {
        case OK:
        case ERR_INVALID_TARGET:
          creep.memory.containerSiteBuilt = true;
          break;
        case ERR_FULL:
          // TODO: Kill a road or something and build this instead.
          break;
        case ERR_INVALID_ARGS:
          throw new Error(`Invalid args: creep.room.createConstructionSite(${creep.pos}, STRUCTURE_CONTAINER);`);
        case ERR_RCL_NOT_ENOUGH:
          throw new Error(`RCL not high enough: creep.room.createConstructionSite(${creep.pos}, STRUCTURE_CONTAINER);`);
        default:
          throw new Error(`Unexpected return value from: createConstructionSite(${creep.pos}, STRUCTURE_CONTAINER); Return value: ${ret}`);
      }
    }
    if (creep.harvest(source) === OK) {
      creep.memory.isNextToSource = true;
      if (creep.memory._move) {
        // We are here, no need to move.
        console.log('deleting!');
        delete creep.memory._move;
      }
    }
  },

  beforeAge() {
    const { creep } = this;

    // Cleanup memory
    if (Memory.sources[creep.memory.source].miner === creep.id) {
      delete Memory.sources[creep.memory.source].miner;
    }
  },

  getOpenSource() {
    const { creep } = this;

    return creep.pos.findClosestByRange(FIND_SOURCES, {
      filter: (source) => {
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

  createHelpers(sourceName) {
    const { creep } = this;
    const source = Game.getObjectById(sourceName);
    const helperSpawn = source.pos.findClosestByRange(FIND_MY_SPAWNS);

    const steps = helperSpawn.pos.findPathTo(source).length * 2;
    let creepsNeeded = Math.round((steps * 8) / 100);
    console.log(`creepsNeeded: ${creepsNeeded}`);
    if (creepsNeeded <= 1) {
      creepsNeeded = 1;
    }

    if (creepsNeeded > this.MAX_HELPERS) {
      creepsNeeded = this.MAX_HELPERS;
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
    const { creep } = this;
    creep.memory.isNearSource = false;
    creep.memory.helpers = [];

    this.setSource();
    this.createHelpers(creep.memory.source);
  },

  setSource() {
    const { creep } = this;

    if (creep.memory.source == null) {
      this.setSourceToMine(this.getOpenSource());
    }
  },
};

module.exports = miner;
