const proto = {
  /**
   * The creep for this role
   *
   * @type creep
   */
  creep: null,

  myColor: null,
  /**
   * Set the creep for this role
   *
   * @param {Creep} creep
   */
  setCreep(theCreep) {
    this.creep = theCreep;
    return this;
  },

  run() {
    // console.log(`role_prototype.run`);
    // console.log(`  ${this.creep.name}`);
    if (this.creep.memory.onSpawned == null) {
      this.onSpawn();
      this.creep.memory.onSpawned = true;
    }

    this.action(this.creep);

    if (this.creep.ticksToLive === 1) { this.beforeAge(); }
  },

  travelTo(target, options = {}) {
    const { creep } = this;

    const moveOptions = options;

    moveOptions.visualizePathStyle = moveOptions.visualizePathStyle || { stroke: this.myColor };
    if (moveOptions.ignoreCreeps === undefined) {
      moveOptions.ignoreCreeps = false;
    }
    if (creep.memory._move) {
      // console.log(`${creep} using noPathfinding!`);
      moveOptions.noPathFinding = true;
    }
    return creep.moveTo(target, moveOptions);
  },

  placeRoad() {
    const { creep } = this;

    creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_ROAD);
  },

  handleEvents() {
    if (this.creep.memory.onSpawned == null) {
      this.onSpawnStart();
      this.onSpawn();
      this.creep.memory.onSpawned = true;
    }

    if (this.creep.memory.onSpawnEnd == null && !this.creep.spawning) {
      this.onSpawnEnd();
      this.creep.memory.onSpawnEnd = true;
    }
  },

  // TODO: Make this work for more than one spawn
  getParts() {
    const _ = require('lodash');

    const parts = _.cloneDeep(this.parts);

    // If this isn't an array of arrays, return "level 1" parts
    if (typeof parts[0] !== 'object') {
      return this.parts;
    }

    let potentialEnergy;
    // Everyone is dead? Go off the energy we have.
    const creepCount = Object.keys(Game.creeps).length;
    if (creepCount === 1 || creepCount === 0) {
      potentialEnergy = Game.spawns.Spawn1.room.energyAvailable;
    } else {
      potentialEnergy = Game.spawns.Spawn1.room.energyCapacityAvailable;
    }

    parts.reverse();
    let chosenParts = null;
    for (let i = 0; i < parts.length; i += 1) {
      if (this.spawnCost(parts[i]) <= potentialEnergy) {
        chosenParts = parts[i];
        break;
      }
    }

    if (chosenParts === null) {
      // Return the lowest parts
      return parts.reverse()[0];
      // throw new Error('Couldn\'t find parts to work with!');
    }

    return chosenParts;
  },

  action() { },

  onSpawn() { },

  onSpawnStart() { },

  onSpawnEnd() { },

  beforeAge() { },

  isFull() {
    return _.sum(this.creep.carry) === this.creep.carryCapacity;
  },
  /**
   * All credit goes to Djinni
   * @url https://bitbucket.org/Djinni/screeps/
   */
  rest(civilian) {
    const { creep } = this;
    // console.log(`${creep.name}`);

    let distance = 4;
    let restTarget = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

    if (!civilian) {
      const { flags } = Game;
      for (let i = 0; i < flags.length; i += 1) {
        const flag = flags[i];
        if (creep.pos.inRangeTo(flag, distance) || creep.pos.findPathTo(flag).length > 0) {
          restTarget = flag;
          break;
        }
      }
    }

    const flag = Game.flags.Flag1;
    if (flag !== undefined && civilian !== true) { restTarget = flag; }

    const flag2 = Game.flags.Flag2;
    if (flag2 !== undefined && civilian !== true &&
      !creep.pos.inRangeTo(flag, distance) &&
      !creep.pos.findPathTo(flag).length) {
      restTarget = flag2;
    }

    if (creep.getActiveBodyparts(HEAL)) {
      distance -= 1;
    } else if (creep.getActiveBodyparts(RANGED_ATTACK)) {
      distance -= 1;
    }
    if (creep.pos.findPathTo(restTarget).length > distance) {
      this.travelTo(restTarget);
    }
  },

  /**
   * All credit goes to Djinni
   * @url https://bitbucket.org/Djinni/screeps/
   */
  rangedAttack(target) {
    console.log(`  rangedAttack(${target})`);
    const { creep } = this;

    if (!target) { return null; }

    if (target.pos.inRangeTo(creep.pos, 3)) {
      creep.rangedAttack(target);
      return target;
    }
    return null;
  },

  keepAwayFromEnemies() {
    // console.log("this.keepAwayFromEnemies");
    const { creep } = this;

    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    // console.log(target);
    if (target !== null && target.pos.inRangeTo(creep.pos, 4)) {
      // console.log("RUN AWAY")
      const moveToX = (creep.pos.x + creep.pos.x) - target.pos.x;
      const moveToY = (creep.pos.y + creep.pos.y) - target.pos.y;
      const pos = new RoomPosition(moveToX, moveToY, target.room.name);

      this.travelTo(pos);
    }
  },

  /**
   * All credit goes to Djinni
   * @url https://bitbucket.org/Djinni/screeps/
   */
  kite(target) {
    const { creep } = this;
    if (!target) { return null; }

    if (target.pos.inRangeTo(creep.pos, 2)) {
      const moveToX = (creep.pos.x + creep.pos.x) - target.pos.x;
      const moveToY = (creep.pos.y + creep.pos.y) - target.pos.y;
      const pos = new RoomPosition(moveToX, moveToY, target.room.name);
      return this.travelTo(pos);
    } else if (target.pos.inRangeTo(creep.pos, 3)) {
      return true;
    }
    return this.travelTo(target);
  },

  getRangedTarget() {
    const { creep } = this;
    // console.log('getRangedTarget()');

    const closeArchers = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter(enemy) {
        return enemy.getActiveBodyparts(RANGED_ATTACK) > 0
          && creep.pos.inRangeTo(enemy, 3);
      },
    });

    // console.log(`  closeArchers: ${closeArchers}`);
    if (closeArchers != null) {
      return closeArchers;
    }

    const closeMobileMelee = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter(enemy) {
        return enemy.getActiveBodyparts(ATTACK) > 0
          && enemy.getActiveBodyparts(MOVE) > 0
          && creep.pos.inRangeTo(enemy, 3);
      },
    });

    // console.log(`  closeMobileMelee: ${closeMobileMelee}`);
    if (closeMobileMelee != null) {
      return closeMobileMelee;
    }

    const closeHealer = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter(enemy) {
        return enemy.getActiveBodyparts(HEAL) > 0
          && enemy.getActiveBodyparts(MOVE) > 0
          && creep.pos.inRangeTo(enemy, 3);
      },
    });

    // console.log(`  closeHealer: ${closeHealer}`);
    if (closeHealer != null) {
      return closeHealer;
    }

    const closestByRange = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    // console.log(`  closestByRange: ${closestByRange}`);
    return closestByRange;
  },

  spawnCost(parts) {
    let total = 0;
    for (let index = 0; index < parts.length; index += 1) {
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

        default:
          throw new Error(`Unexpectecd Body Part: ${part}`);
      }
    }

    return total;
  },
};

module.exports = proto;
