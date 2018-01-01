const countType = require('countType');

module.exports = {
  theRoom: null,

  init() {
    if (Memory.factoryInit != null) {
      return;
    }

    Memory.factoryInit = true;
    this.memory();
  },

  run() {
    this.forceMiners();
    this.spawnRequiredScreeps();
  },

  forceMiners() {
    // console.log(`factory.forceMiners`);
    // If nothing is in the queue, return
    const { spawnQue } = Memory;

    if (spawnQue == null || !spawnQue.length) {
      // console.log(`  Spawnque undefined!`);
      return;
    }

    // If there are no miners, move the miners to the top of the queue
    const minersInMap = countType('miner', false);
    // console.log(`  minersInMap: ${minersInMap}`);
    const minersAnywhere = countType('miner', true);

    if (minersInMap === 0) {
      // console.log("  No miners found on the map...");
      if (minersAnywhere === 0) {
        // There are no miners in que or the map.
        // console.log(`  miner not found anywhere! pushing to the top of the spawn que.`);
        Memory.spawnQue.unshift('miner');
      } else {
        // There are none on the map, but at least 1 in the queue.
        // move it to the top if it isnt.
        // console.log(`  ${minersAnywhere} either on the queue or spawning...`);
        this.moveRoleToTopOfQueue('miner');
      }
    } else {
      const totalRequiredMiners = this.getCounts(Memory.requiredScreeps).miner;
      if (totalRequiredMiners > minersInMap) {
        // TODO: If there is one miner and no helpers, prioritize the helpers

        // If there are miners on the map And they have helpers already
        if (countType('miner_helper', false) > 0) {
          this.moveRoleToTopOfQueue('miner');
        } else {
          // this.moveRoleToTopOfQueue('miner_helper');
        }
      }
    }
  },

  moveRoleToTopOfQueue(role) {
    const dex = Memory.spawnQue.indexOf(role);
    // console.log(dex)
    if (dex === -1) {
      Memory.spawnQue.unshift(role);
    } else if (dex === 0) {
      // console.log(`  Do nothing, a miner is next. yay.`);
    } else {
      // console.log("  Pushing a miner to the top with switcharoos")
      const elem = Memory.spawnQue[dex];
      Memory.spawnQue.splice(dex, 1);
      Memory.spawnQue.unshift(elem);
    }
  },

  getCounts(array) {
    const counts = {};
    for (let i = 0; i < array.length; i += 1) {
      const thingy = array[i];
      counts[thingy] = counts[thingy] ? counts[thingy] + 1 : 1;
    }

    return counts;
  },

  activeSources() {
    return this.theRoom.find(FIND_SOURCES_ACTIVE);
  },

  memory() {
    if (Memory.spawnQue === undefined) {
      Memory.spawnQue = [];
    }

    if (Memory.sources === undefined) {
      Memory.sources = { };
    }

    // TODO: Make this priority from the top down.
    if (Memory.requiredScreeps === undefined) {
      const requiredMinerCount = this.activeSources().length;

      // console.log(`this.activeSources().count: ${this.activeSources().length}`)
      const requiredScreeps = [
        'upgrader',
        'builder',
        'transporter',
        'archer',
        'upgrader',
        'upgrader',
      ];

      for (let i = 0; i < requiredMinerCount; i += 1) {
        // console.log("  Add a miner!")
        requiredScreeps.push('miner');
      }
      // console.log(`requiredScreeps: ${requiredScreeps}`);
      Memory.requiredScreeps = requiredScreeps;
    }
  },

  spawnRequiredScreeps() {
    // console.log("factory.spawnRequiredScreeps")
    // FIXME: We should not have to set this here.
    if (Memory.requiredScreeps === undefined) {
      this.memory();
    }

    const { requiredScreeps } = Memory;

    const requiredCounts = this.getCounts(requiredScreeps);
    // console.log('  ' + JSON.stringify(requiredCounts))
    Object.keys(requiredCounts).forEach((role) => {
      // console.log(`    role: ${role} ${requiredCounts[role]}`);
      const requiredCount = requiredCounts[role];
      const actualCount = countType(role, true);
      // console.log(`    actualCount: ${actualCount}`);

      if (actualCount > requiredCount) {
        // remove some shit from the queue.
        const datIndex = Memory.spawnQue.indexOf(role);
        if (datIndex !== -1) {
          // console.log(`  removing ${role} from spawnque`);
          Memory.spawnQue.splice(datIndex, 1);
          this.spawnRequiredScreeps();
        }
      } else if (actualCount < requiredCount) {
        // console.log(`  pushing ${role} to spawnque`);
        Memory.spawnQue.push(role);
      }
    });
  },

  buildArmyWhileIdle() {
    if (Memory.spawnQue.length > 0) { return null; }
    const spawner = require('spawner');
    Object.keys(Game.spawns).forEach((name) => {
      const spawn = Game.spawns[name];
      const ratio = spawn.energy / spawn.energyCapacity;

      if (!spawn.spawning && (ratio >= 0.6)) {
        const archers = countType('archer', true);
        const healers = countType('healer', true);
        const warriors = countType('warrior', true);

        if (archers === 0) {
          return spawner.spawn('archer', { }, spawn);
        }
        if (healers === 0 || healers / archers < 0.25) {
          return spawner.spawn('healer', { }, spawn);
        }
        if (warriors === 0 || warriors / archers < 0.25) {
          return spawner.spawn('warrior', { }, spawn);
        }
        return spawner.spawn('archer', { }, spawn);
      }
      return null;
    });
    return null;
  },
};
