var transporter = {
	parts: [
		[CARRY, CARRY, MOVE, MOVE]
	],

	myColor: '#fa00ff',

	action: function() {
		var creep = this.creep;
		// console.log(`${creep.name}`);

		//@TODO: Balance Spawns here

		// TODO: Rework this to be a ammo hauler / extension filler
		// Check if there is anything in storage and if there are any low checkExtensions
		// and then fill them up.
		// Same with towers.

		if(_.sum(creep.carry) == 0)	{
			var closestSpawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS, {
				filter: function(spawn) {
					return spawn.energy > 250; // Minimum to spawn a miner
				}
			});

			// BEGIN FIND ENERGY
			let target = null;

			// STRUCTURE_CONTAINERs
			if (target === null) {
				// console.log("  checking containers...");
				const containers = creep.room.find(FIND_STRUCTURES, {
												   filter: { structureType: STRUCTURE_CONTAINER }
  											 });

				// console.log(`    ${containers}`);

				for(let i in containers) {
					let container = containers[i];
					// console.log(`  container: ${container}`);
					if (container.isActive() && container.store[RESOURCE_ENERGY]  > 0) {
						target = container;
						break;
					}
				}
			}

			// If we didnt find any containers with nrg
			// pull from spawn
			if (target === null) {
				if(creep.pos.isNearTo(closestSpawn)) {
					// console.log(`  moving to ${closestSpawn} to get NRG`)
					creep.withdraw(closestSpawn, RESOURCE_ENERGY);
				} else {
					creep.moveTo(closestSpawn, {visualizePathStyle: {stroke: this.myColor}});
				}

				return;
			}

			return;

		} else {
			var target = null;

			//Transfer to builder
			if (!target) {
				var builderToHelp = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
					filter: function (builder) {
						return builder.memory.role == "builder" || builder.memory.role == "upgrader"
							&& _.sum(builder.carry) < ( builder.carryCapacity / 2);
					}
				});
				if (builderToHelp) {
					target = builderToHelp;
				}
			}

			// Alternatively, put it in an extension.
			if(!target) {
				var extension = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
					filter: function(structure)
					{
						return structure.structureType == STRUCTURE_EXTENSION &&
							structure.energy < structure.energyCapacity;
					}
				});

				if(extension) {
					target = extension;
				}
			}

			//Go to target and give it energy
	    // TODO: CGO this wont work on extensions right now.
			if (creep.pos.isNearTo(target)) {
				if (_.sum(target.carry) < target.carryCapacity) {
					// console.log(`  transferring ${creep.carry.energy} energy to ${target.name}`)
					creep.say("⚡ transferring")
					creep.transfer(target, RESOURCE_ENERGY);
				}
			}
			else {
	 			// console.log(`  moving to ${target.name}`)
				creep.moveTo(target, {visualizePathStyle: {stroke: this.myColor}});
			}
		}
	}
};

module.exports = transporter;
