const spawner = {
  initSpawnQue() {
    if (Memory.spawnQue === undefined) { Memory.spawnQue = []; }
  },

  addToQue(creep, unshift) {
    this.initSpawnQue();

    if (unshift !== undefined && unshift === true) {
      Memory.spawnQue.unshift(creep);
    } else {
      Memory.spawnQue.push(creep);
    }
  },

  spawnNextInQue() {
    // console.log("spawner.spawnNextInQue");
    this.initSpawnQue();

    if (!Memory.spawnQue.length) { return; }

    // Get spawns that are ready
    const spawns = _.filter(Game.spawns, spawn => spawn.spawning == null);

    if (spawns.length === null || spawns.length === 0) { return; }

    let role = Memory.spawnQue[0];

    // console.log(JSON.stringify(role));

    if (typeof role === 'string') {
      role = { type: role, memory: { role } };
    }

    // console.log("Precanspawn call")
    const me = this;
    const toSpawnAt = spawns.filter(spawn => me.canSpawn(spawn, role.type));

    if (!toSpawnAt.length) { return; }

    const retVal = this.spawn(role.type, role.memory, toSpawnAt[0]);
    if (retVal === OK) {
      // Remove it from the queue
      Memory.spawnQue.shift();
    }
  },

  spawn(role, memory, spawnPoint) {
    if (!spawnPoint) { spawnPoint = Game.spawns.Spawn1; }

    const manager = require('roleManager');

    if (!manager.roleExists(role)) {
      return;
    }

    if (!this.canSpawn(spawnPoint, role)) {
      console.log(`${spawnPoint} can't spawn ${role}`);
      return;
    }

    if (memory == null) { memory = { }; }

    memory.role = role;

    let nameCount = 0;
    let name = null;
    while (name == null) {
      nameCount += 1;
      const tryName = role + nameCount;
      if (Game.creeps[tryName] == null) { name = tryName; }
    }

    return spawnPoint.spawnCreep(manager.getRoleBodyParts(role), name, { memory });
  },

  canSpawn(spawnPoint, role) {
    console.log(`          Room capacity ${spawnPoint.room.energyAvailable} / ${spawnPoint.room.energyCapacityAvailable}`);
    console.log(`        this.spawnCost(${role}) ${this.spawnCost(role)}`);

    const cost = this.spawnCost(role);

    if (cost > spawnPoint.room.energyCapacityAvailable) {
      console.log(`  ${role} costs ${cost} which is too damn high!`);
      if (Memory.spawnQue.indexOf(role) > -1) {
        Memory.spawnQue.splice(Memory.spawnQue.indexOf(role), 1);
      }
      return false;
    }

    return spawnPoint.room.energyAvailable >= cost
      && (spawnPoint.spawning == null
        || spawnPoint.spawning == undefined);
  },

  spawnCost(role) {
    const manager = require('roleManager');
    const parts = manager.getRoleBodyParts(role);
    // console.log(JSON.stringify(parts))
    let total = 0;
    for (const index in parts) {
      const part = parts[index];
      switch (part) {
        case MOVE:
          total += 50;
          break;

        case WORK:
          total += 100;
          break;

        case CARRY:
          total += 50;
          break;

        case ATTACK:
          total += 80;
          break;

        case RANGED_ATTACK:
          total += 150;
          break;

        case HEAL:
          total += 250;
          break;

        case TOUGH:
          total += 10;
          break;

        case CLAIM:
          total += 600;
          break;
      }
    }

    return total;
  },

  killAll(role) {
    for (const i in Game.creeps) {
      if (role == undefined || Game.creeps[i].memory.role == role) {
        console.log(`killing: ${Game.creeps[i].name}`);
        Game.creeps[i].suicide();
      }
    }
  },
};

module.exports = spawner;
