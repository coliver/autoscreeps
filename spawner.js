const spawner = {
	initSpawnQue: function()
	{
		if(Memory.spawnQue == undefined)
			Memory.spawnQue = [ ];
	},

	addToQue: function(creep, unshift)
	{
		this.initSpawnQue();

		if(unshift != undefined && unshift === true)
			Memory.spawnQue.unshift(creep);
		else
			Memory.spawnQue.push(creep);
	},

	spawnNextInQue: function()
	{
		// console.log("spawner.spawnNextInQue");
		this.initSpawnQue();

		if(!Memory.spawnQue.length) { return; }

		// Get spawns that are ready
		const spawns = _.filter(Game.spawns, (spawn) =>  spawn.spawning === null || spawn.spawning === undefined);

		if(spawns.length === null || spawns.length === 0)
			return;

		var role = Memory.spawnQue[0];

		// console.log(JSON.stringify(role));

		if(typeof role == "string")
		{
			role = { type: role, memory: { role: role } };
		}

		// console.log("Precanspawn call")
		var me = this;
		var toSpawnAt = spawns.filter(function(spawn)	{
			return me.canSpawn(spawn, role.type);
		});

		if(! toSpawnAt.length)
			return;

		toSpawnAt = toSpawnAt[0];

		const retVal = this.spawn(role.type, role.memory, toSpawnAt);
		if (retVal === OK) {
			// Remove it from the queue
			Memory.spawnQue.shift();
		}
	},

	spawn: function(role, memory, spawnPoint)	{
		// console.log("Spawn time! role:" + JSON.stringify(role) + '  memory: ' + JSON.stringify(memory))
		if(!spawnPoint)
			spawnPoint = Game.spawns.Spawn1;

		var manager = require('roleManager');

		if(!manager.roleExists(role))	{
			return;
		}

		if(!this.canSpawn(spawnPoint, role)) {
			console.log(`${spawnPoint} can't spawn ${role}`)
			return;
		}

		if(memory == undefined)
			memory = { };

		memory['role'] = role;

		var nameCount = 0;
		var name = null;
		while(name == null)
		{
			nameCount++;
			var tryName = role + nameCount;
			if(Game.creeps[tryName] == undefined)
				name = tryName;
		}

		return spawnPoint.spawnCreep(manager.getRoleBodyParts(role), name, {memory: memory});
	},

	canSpawn: function(spawnPoint, role) {
		if(typeof spawnPoint == "string" && role == undefined) {
			console.log("?? Why are we in here???");
			role = spawnPoint;
			spawnPoint = Game.spawns.Spawn1;
		}
		console.log(`          Room capacity ${spawnPoint.room.energyAvailable} / ${spawnPoint.room.energyCapacityAvailable}`);
		console.log(`        this.spawnCost(${role}) ${this.spawnCost(role)}`);

		const cost = this.spawnCost(role)

		if (cost > spawnPoint.room.energyCapacityAvailable) {
			console.log(`  ${role} costs ${cost} which is too damn high!`)
			if (Memory.spawnQue.indexOf(role) > -1) {
				Memory.spawnQue.splice(Memory.spawnQue.indexOf(role), 1);
			}
			return false;
		}

		return spawnPoint.room.energyAvailable >= cost
			&& (spawnPoint.spawning == null
				|| spawnPoint.spawning == undefined);
	},

	spawnCost: function(role)	{
		var manager = require('roleManager');
		var parts = manager.getRoleBodyParts(role);
		// console.log(JSON.stringify(parts))
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

	killAll: function(role) {
		for(var i in Game.creeps) {
			if(role == undefined || Game.creeps[i].memory.role == role) {
				console.log(`killing: ${Game.creeps[i].name}`);
				Game.creeps[i].suicide();
			}
		}
	}
}

module.exports = spawner;
