var proto = {
	/**
	 * The creep for this role
	 *
	 * @type creep
	 */
	creep: null,

	/**
	 * Set the creep for this role
	 *
	 * @param {Creep} creep
	 */
	setCreep: function(theCreep) {
		this.creep = theCreep;
		return this;
	},

	run: function() {
		if(this.creep.memory.onSpawned == undefined) {
			this.onSpawn();
			this.creep.memory.onSpawned = true;
		}

		this.action(this.creep);

		if(this.creep.ticksToLive == 1)
			this.beforeAge();
	},

	handleEvents: function() {
		if(this.creep.memory.onSpawned == undefined) {
			this.onSpawnStart();
			this.onSpawn();
			this.creep.memory.onSpawned = true;
		}

		if(this.creep.memory.onSpawnEnd == undefined && !this.creep.spawning) {
			this.onSpawnEnd();
			this.creep.memory.onSpawnEnd = true;
		}
	},

	// TODO: Make this work for more than one spawn
	getParts: function() {
		var _ = require('lodash');

		const potentialEnergy = Game.spawns.Spawn1.room.energyCapacityAvailable

		var parts = _.cloneDeep(this.parts);

		// If this isn't an array of arrays, return "level 1" parts
		if(typeof parts[0] != "object") {
			return this.parts;
		}

		parts.reverse();

		let chosenParts = null;

		for(var i in parts) {
			if(this.spawnCost(parts[i]) <= potentialEnergy) {
				chosenParts = parts[i];
				break;
			}
		}

		if(chosenParts === null) {
			throw `Couldn't find parts to work with!`
		}

		return chosenParts;
	},

	// getParts: function() {
	// 	var _ = require('lodash');
  //
	// 	const extensions = _.filter(Game.structures, (struct) =>
	// 										   struct.structureType == STRUCTURE_EXTENSION && struct.isActive()
	// 										 ).length;
  //
	// 	var parts = _.cloneDeep(this.parts);
	// 	if(typeof parts[0] != "object") {
	// 		return this.parts;
	// 	}
  //
	// 	parts.reverse();
  //
	// 	for(var i in parts) {
	// 		if((parts[i].length - 5) <= extensions) {
	// 			return parts[i];
	// 		}
	// 	}
	// },

	action: function() { },

	onSpawn: function() { },

	onSpawnStart: function() { },

	onSpawnEnd: function() { },

	beforeAge: function() { },

	/**
	 * All credit goes to Djinni
	 * @url https://bitbucket.org/Djinni/screeps/
	 */
	rest: function(civilian) {
		var creep = this.creep;

		var distance = 4;
		var restTarget = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

		if(!civilian) {
			var flags = Game.flags;
			for (var i in flags) {
				var flag = flags[i];
				if (creep.pos.inRangeTo(flag, distance) || creep.pos.findPathTo(flag).length > 0) {
					restTarget = flag;
					break;
				}
			}
		}

//		var flag = Game.flags['Flag1'];
//		if(flag !== undefined && civilian !== true)
//			restTarget = flag;
//
//		var flag2 = Game.flags['Flag2'];
//		if(flag !== undefined && civilian !== true && !creep.pos.inRangeTo(flag, distance) && !creep.pos.findPathTo(flag).length)
//			restTarget = flag2;

		if (creep.getActiveBodyparts(HEAL)) {
			distance = distance - 1;
		}
		else if (creep.getActiveBodyparts(RANGED_ATTACK)) {
			distance = distance - 1;
		}
		if (creep.pos.findPathTo(restTarget).length > distance) {
			// TODO: Use 'my color' here
			creep.moveTo(restTarget, {visualizePathStyle: {stroke: '#ffaa00'}});
		}
	},

	/**
	 * All credit goes to Djinni
	 * @url https://bitbucket.org/Djinni/screeps/
	 */
	rangedAttack: function(target) {
		var creep = this.creep;

		if(!target) {
			target = creep.pos.findClosestByRange(Game.HOSTILE_CREEPS);
		}

		if(target) {
			if (target.pos.inRangeTo(creep.pos, 3) ) {
				creep.rangedAttack(target);
				return target;
			}
		}
		return null;
	},

	keepAwayFromEnemies: function() {
		// console.log("this.keepAwayFromEnemies");
		var creep = this.creep;

		var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		// console.log(target);
		if(target !== null && target.pos.inRangeTo(creep.pos, 4)) {
			// console.log("RUN AWAY")
			creep.moveTo(creep.pos.x + creep.pos.x - target.pos.x, creep.pos.y + creep.pos.y - target.pos.y, {visualizePathStyle: {stroke: '#ffaa00'}});
		}
	},

	/**
	 * All credit goes to Djinni
	 * @url https://bitbucket.org/Djinni/screeps/
	 */
	kite: function(target) {
		var creep = this.creep;

		if (target.pos.inRangeTo(creep.pos, 2)) {
			creep.moveTo(creep.pos.x + creep.pos.x - target.pos.x, creep.pos.y + creep.pos.y - target.pos.y, {visualizePathStyle: {stroke: '#ffaa00'}} );
			return true;
		} else if (target.pos.inRangeTo(creep.pos, 3)) {
			return true;
		} else {
			creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
			return true;
		}

		return false;
	},

	getRangedTarget: function() {
		var creep = this.creep;

		var closeArchers = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
			filter: function(enemy)
			{
				return enemy.getActiveBodyparts(RANGED_ATTACK) > 0
					&& creep.pos.inRangeTo(enemy, 3);
			}
		});

		if(closeArchers != null)
			return closeArchers;

		var closeMobileMelee = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
			filter: function(enemy)
			{
				return enemy.getActiveBodyparts(ATTACK) > 0
					&& enemy.getActiveBodyparts(MOVE) > 0
					&& creep.pos.inRangeTo(enemy, 3);
			}
		});

		if(closeMobileMelee != null)
			return closeMobileMelee;

		var closeHealer = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
			filter: function(enemy)
			{
				return enemy.getActiveBodyparts(HEAL) > 0
					&& enemy.getActiveBodyparts(MOVE) > 0
					&& creep.pos.inRangeTo(enemy, 3);
			}
		});

		if(closeHealer != null)
			return closeHealer;

		return creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
	},

	spawnCost: function(parts)	{
		var total = 0;
		for(var index in parts) {
			var part = parts[index];
			switch(part) {
				case MOVE:
					total += 50
					break;

				case WORK:
					total += 100
					break;

				case CARRY:
					total += 50
					break;

				case ATTACK:
					total += 80
					break;

				case RANGED_ATTACK:
					total += 150
					break;

				case HEAL:
					total += 250
					break;

				case TOUGH:
					total += 10
					break;

				case CLAIM:
					total += 600
					break;
			}
		}

		return total;
	},
};

module.exports = proto;
