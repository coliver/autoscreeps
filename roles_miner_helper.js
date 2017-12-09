/**
 * This guys does the other half of energy collection. The miner gets it from the source, and the helper does the
 * transportation. We don't want them just going for the nearest source, as that means that if we have more than one
 * miner, all the helpers will only go for the first miner. To counter this, we assign them to a miner the same way
 * we assign a miner to a source
 */

// var helper = {
module.exports = {
	parts: [
		[MOVE, CARRY, MOVE, CARRY],
		[MOVE, CARRY, MOVE, CARRY, MOVE, CARRY]
	],

	assignMiner: function () {
		// console.log(`  assigning a miner`);
		var creep = this.creep;

		var miner = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
			filter: function (miner) {
				if (miner.memory.role == 'miner' && miner.memory.helpers.length < miner.memory.helpersNeeded)
					return true;

				return false;
			}
		});

		if (miner == undefined)
			return;

		creep.memory.miner = miner.id;
		miner.memory.helpers.push(creep.id);
	},

	/**
	 * @TODO: Make helpers smarter about avoiding miners, instead of just waiting till they're 5 tiles away
	 * @TODO: When spawns are at .25, and extensions have >= 200, help builders before filling shit up
	 */
	action: function () {
		var creep = this.creep;
		// console.log(`${creep.name}`);

		if (creep.memory.courier !== undefined && creep.memory.courier == true) {
			creep.memory.courier = false;
			return;
		}

		//If this helper isn't assigned to a miner, find one and assign him to it. If it is assigned to a miner,
		//then find that miner by his id
		if (creep.memory.miner == undefined)
			this.assignMiner();

		var miner = Game.getObjectById(creep.memory.miner);
		// console.log`  miner: ${miner}`);
		if (miner == null) {
			creep.suicide();
			return;
		}

		//If we can still pick up energy, let's do that
		if (_.sum(creep.carry) < creep.carryCapacity) {
			if (creep.pos.isNearTo(miner)) {
				var energy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0];

				if (energy) {
					// console.log(`  picking up ${energy}`);
					creep.pickup(energy);
				}
			}
			else {
				if (miner.memory.isNearSource) {
					// console.log(`  moving to ${miner}`);
					creep.moveTo(miner, {visualizePathStyle: {stroke: '#ffaa00'}});
				}
			}
			return;
		}

		target = this.findATarget();
		//Okay, everything below is for dropping energy off

		// console.log(`  target: ${target}`)
		//Let's get the direction we want to go in
		const targetDirection = creep.pos.findPathTo(target, { ignoreCreeps: true })[0].direction;

		//Let's look for a courier in that direction. We'll check on making sure they're the right
		//role, if they can hold any energy, if they're in range and if they're in the same direction
		let leftDir = targetDirection - 1;
		let rightDir = targetDirection + 1;

		if (leftDir < 1)
			leftDir += 8;
		if (leftDir > 8)
			leftDir -= 8;

		if (rightDir < 1)
			rightDir += 8;
		if (rightDir > 8)
			rightDir -= 8;

		const courier = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
			filter: function (possibleTarget) {
				return (
					possibleTarget.memory.role == creep.memory.role
					&& possibleTarget.memory.miner == creep.memory.miner
					&& possibleTarget.carry.energy < possibleTarget.carryCapacity
					&& creep.pos.inRangeTo(possibleTarget, 1)
					&& (
					creep.pos.getDirectionTo(possibleTarget) == targetDirection
					|| creep.pos.getDirectionTo(possibleTarget) == leftDir
					|| creep.pos.getDirectionTo(possibleTarget) == rightDir
					)
					);
			}
		});

		//If we found a courier, make that courier our new target
		if (courier !== null && !creep.pos.isNearTo(target)) {
			// console.log`  found a courier! (${courier})`)
			target = courier;
			target.memory.courier = true;
		}

		//If we're near to the target, either give it our energy or drop it
		// At this point our target can be a spawn, extension, or a courier.
		if (creep.pos.isNearTo(target)) {
			let nrg;
			let caps;

			if(target instanceof Creep) {
			  nrg = target.carry.energy;
				caps = target.carryCapacity;
			}
			else if (target instanceof StructureContainer || target instanceof StructureStorage) {
				nrg = target.store[RESOURCE_ENERGY];
				caps = target.storeCapacity;
			}	else {
				nrg = target.energy;
				caps = target.energyCapacity;
			}

		  if (nrg < caps) {
				// console.log(`  transferring energy to ${target}`)
				creep.transfer(target, RESOURCE_ENERGY);
			}
			else {
				// console.log(`  dropping nrg`);
				creep.drop(RESOURCE_ENERGY);
			}
		}
		//Let's do the moving
		else {
			// console.log(`  moving to ${target.name}`);
			creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
		}
	},

	findATarget: function() {
		// console.log(`  findATarget`)
		const creep = this.creep;
		let target = null;

		const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

		target = this.checkExtensions(creep.room);
		if(target) {
			// console.log(`  extension wins: (${target})`)
			return target;
		}

		target = this.checkTowers(creep.room)
		if(target) {
			// console.log(`  tower wins: (${target})`)
			return target;
		}

		target = this.checkContainers(creep.room)
		// STRUCTURE_CONTAINERs
		if (target) {
			// console.log(`  container wins: (${target})`)
			return target;
		}

		target = this.checkStorage(creep.room)
		if(target) {
			// console.log(`  storage wins: (${target})`)
			return target;
		}

		// console.log(`No one wins :C target: ${spawn}`)
		return spawn;
	},

	checkExtensions: function(room) {
		// console.log(`    checkExtensions(${spawn})`)
		let target = null;
		if (room == null) {
			return;
		}

		// console.log("  checkig extensions...")
		let extensions = room.find(FIND_MY_STRUCTURES, {
											 filter: { structureType: STRUCTURE_EXTENSION }
										 });

		// console.log(`  ${spawn.name} has ${extensions.length} extensions available`);
		for(let i in extensions) {
			let ext = extensions[i];
			if(ext.isActive() && (ext.energy < ext.energyCapacity)) {
				// console.log(`  assigning ${ext} as target`)
				target = ext;
				break;
			}
		}

		return target;
	},

	checkContainers: function(room) {
		// console.log(`    checkContainers(${room})`);
		return this.checkStorageTypeThing(STRUCTURE_CONTAINER, room);
	},

	checkStorage: function(room) {
		// console.log(`    checkStorage(${room})`);
		return this.checkStorageTypeThing(STRUCTURE_STORAGE, room);
	},

	// Type can be STRUCTURE_CONTAINER or STRUCTURE_STORAGE
	checkStorageTypeThing: function(type, room) {
		// console.log(`      checkStorageTypeThing(${type})`)
		let target = null
		const thingies = room.find(FIND_STRUCTURES, {
											   filter: { structureType: type }
										 	 });

		for(let i in thingies) {
			let thing = thingies[i];
			// console.log(`  container: ${thing}`);
			if (thing.isActive() && thing.store[RESOURCE_ENERGY] < thing.storeCapacity) {
				target = thing;
				break;
			}
		}
		// console.log(`  ${target}`)
		return target;
	},

	// TODO: Check towers
	checkTowers: function(room) {
		// console.log(`  checkTowers(${room})`);
		const towers = room.find(FIND_MY_STRUCTURES, {
			filter: { structureType: STRUCTURE_TOWER }
		})
		let target = null
		for (let i in towers) {
			let tower = towers[i]
			if (tower.isActive() && tower.energy < tower.energyCapacity - 100) {
				target = tower;
				break;
			}
		}
		return target
	}
};

// module.exports = helper;
