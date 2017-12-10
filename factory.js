var countType = require('countType');

module.exports = {
	// FIXME
	theRoom: Game.rooms['W32S12'],

	init: function()
	{
		if(Memory.factoryInit != undefined)
			return;

		Memory.factoryInit = true;
		this.memory();
	},

	run: function()
	{
		this.forceMiners();
		this.spawnRequiredScreeps();
	},

	// TODO: This is 1 room only.
	forceMiners: function () {
		// console.log(`factory.forceMiners`);
		// If nothing is in the queue, return
		let spawnQue = Memory.spawnQue;

		if (spawnQue === undefined || !spawnQue.length) {
			// console.log(`  Spawnque undefined!`);
			return;
		}

		// If there are no miners, move the miners to the top of the queue
		const minersInMap = countType('miner', false);
		// console.log(`  minersInMap: ${minersInMap}`);
		const minersAnywhere = countType('miner', true)

		if (minersInMap === 0) {
			// console.log("  No miners found on the map...");
			if (minersAnywhere === 0) {
				// There are no miners in que or the map.
				// console.log(`  miner not found anywhere! pushing to the top of the spawn que.`);
				Memory.spawnQue.unshift('miner');
				return;
			}
			else {
				// There are none on the map, but at least 1 in the queue.
				// move it to the top if it isnt.
				// console.log(`  ${minersAnywhere} either on the queue or spawning...`);
				this.moveRoleToTopOfQueue('miner');
			}
		} else {
			const totalRequiredMiners = this.getCounts(Memory.requiredScreeps)['miner'];
			if (totalRequiredMiners > minersInMap) {
				// TODO: If there is one miner and no helpers, prioritize the helpers

				// If there are miners on the map And they have helpers already
				if (countType('miner_helper', false) > 0) {
					this.moveRoleToTopOfQueue('miner');
				}
				else {
					// this.moveRoleToTopOfQueue('miner_helper');
				}
			}
		}
	},

	moveRoleToTopOfQueue: function(role) {
		let dex = Memory.spawnQue.indexOf(role);
		// console.log(dex)
		if (dex === -1) {
			Memory.spawnQue.unshift(role);
		} else if (dex === 0) {
			return; //console.log(`  Do nothing, a miner is next. yay.`);
		} else {
			// console.log("  Pushing a miner to the top with switcharoos")
			let elem = Memory.spawnQue[dex];
			Memory.spawnQue.splice(dex, 1)
			Memory.spawnQue.unshift(elem);
		}
	},

	getCounts: function(array) {
		let counts = {};
		for (let i = 0; i < array.length; i++) {
		  let thingy = array[i];
		  counts[thingy] = counts[thingy] ? counts[thingy] + 1 : 1;
		}

		return counts;
	},

	activeSources: function() {
		return this.theRoom.find(FIND_SOURCES_ACTIVE);
	},

	memory: function() {
		if(Memory.spawnQue == undefined) {
			Memory.spawnQue = [ ];
		}

		if(Memory.sources == undefined) {
			Memory.sources = { };
		}

		// TODO: Make this priority from the top down.
		if(Memory.requiredScreeps == undefined) {
			const requiredMinerCount = this.activeSources().length;

			// console.log(`this.activeSources().count: ${this.activeSources().length}`)
			let requiredScreeps = [
				'upgrader',
				'builder',
				'transporter',
				'archer',
				'upgrader',
				'upgrader'
			];

			for (i = 0; i < requiredMinerCount; i++) {
				// console.log("  Add a miner!")
				requiredScreeps.push('miner');
			}
			// console.log(`requiredScreeps: ${requiredScreeps}`);
			Memory.requiredScreeps = requiredScreeps;
		}
	},

	spawnRequiredScreeps: function() {
		// console.log("factory.spawnRequiredScreeps")
		// FIXME: We should not have to set this here.
		if(Memory.requiredScreeps == undefined) {
			this.memory();
		}

		const requiredScreeps = Memory.requiredScreeps;

		let requiredCounts = this.getCounts(requiredScreeps);
		// console.log('  ' + JSON.stringify(requiredCounts))

		for (let role in requiredCounts) {
			// console.log(`    role: ${role} ${requiredCounts[role]}`);
			let requiredCount = requiredCounts[role];
			let actualCount = countType(role, true);
			// console.log(`    actualCount: ${actualCount}`);

			if (actualCount > requiredCount) {
				// remove some shit from the queue.
				let datIndex = Memory.spawnQue.indexOf(role)
				if (datIndex !== -1) {
					// console.log(`  removing ${role} from spawnque`);
					Memory.spawnQue.splice(datIndex, 1);
					this.spawnRequiredScreeps();
				}
			} else if (actualCount < requiredCount) {
				// console.log(`  pushing ${role} to spawnque`);
				Memory.spawnQue.push(role);
			}
		}
	},

	buildArmyWhileIdle: function() {
		for(var i in Game.spawns) {
			var spawn = Game.spawns[i];
			if(!spawn.spawning && Memory.spawnQue.length == 0 && spawn.energy / spawn.energyCapacity >= .6) {
				var archers = countType('archer', true);
				var healers = countType('healer', true);

				if(archers === 0) {
					return require('spawner').spawn('archer', { }, spawn);
				}
				if(healers === 0) {
					return require('spawner').spawn('healer', { }, spawn);
				}

				if(healers / archers < .25) {
					require('spawner').spawn('healer', { }, spawn);
				} else {
					require('spawner').spawn('archer', { }, spawn);
				}
			}
		}
	}
};
