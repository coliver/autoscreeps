/**
 * @TODO: Make it more carry heavy, make it have helpers
 * @type {{parts: *[], getParts: getParts, action: action}}
 */
 module.exports = {
	parts: [
    [WORK,CARRY,MOVE],
		[WORK,WORK,CARRY,CARRY,MOVE],
//		[WORK,WORK,CARRY,CARRY,MOVE, MOVE, CARRY],
//		[WORK,WORK,CARRY,CARRY,MOVE, MOVE, CARRY, MOVE],
//		[WORK,WORK,CARRY,CARRY,MOVE, MOVE, CARRY, MOVE, WORK],
//		[WORK,WORK,CARRY,CARRY,MOVE, MOVE, CARRY, MOVE, WORK, MOVE],
//		[WORK,WORK,CARRY,CARRY,MOVE, MOVE, CARRY, MOVE, WORK, MOVE, CARRY]
	],

  myColor: '#00ff11',

	action: function() {
		var creep = this.creep;
		// console.log(creep.name)

		//If out of energy, go to git sum and recharge
		if(creep.carry.energy == 0) {
			let target = null;

			const closestSpawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);

			// STRUCTURE_CONTAINERs
			if (target === null) {
				// console.log("  checking containers...");
				const containers = closestSpawn.room.find(FIND_STRUCTURES, {
												   filter: { structureType: STRUCTURE_CONTAINER }
  											 });

				// console.log(`    ${containers}`);

				for(let i in containers) {
					let container = containers[i];
					// console.log(`  container: ${container}`);

					if (container.isActive() && container.store[RESOURCE_ENERGY]  > 0) {
						target = container;
						break
					}
				}
			}

			if (closestSpawn) {
				// console.log("  checkig extensions...")

				let extensions = closestSpawn.room.find(FIND_MY_STRUCTURES, {
													 filter: { structureType: STRUCTURE_EXTENSION }
												 });

				// console.log(`  ${spawn.name} has ${extensions.length} extensions available`);

				for(let i in extensions) {
					let ext = extensions[i];
					if(ext.isActive() && (ext.energy > 0)) {
						target = ext;
						break;
					}
				}
			}

			if (target === null) {
				target = closestSpawn;
			}

			// console.log(`  target: ${target}`);

			if(creep.pos.isNearTo(target)) {// console.log(`  getting nrg from ${closestSpawn.name}`)
				creep.withdraw(target, RESOURCE_ENERGY);
			} else {// console.log(`  moving to ${closestSpawn.name}`);
				creep.moveTo(target, {visualizePathStyle: {stroke: this.myColor}});
			}
		}
		else {
			//First, we're going to check for damaged ramparts. We're using ramparts as the first line of defense
			//and we want them nicely maintained. This is especially important when under attack. The builder will
			//repair the most damaged ramparts first
			var structures = creep.room.find(FIND_MY_STRUCTURES);
			var damagedRamparts = [ ];

      for(let index in structures) {
				let structure = structures[index];
				if(structure.structureType == 'rampart' && structure.hits < (structure.hitsMax - 50)) {
					damagedRamparts.push(structure);
        }
			}

      damagedRamparts.sort(function(a, b)	{
				return(a.hits - b.hits);
			});

			if(damagedRamparts.length) {
        creep.moveTo(damagedRamparts[0], {visualizePathStyle: {stroke: this.myColor}});
				creep.repair(damagedRamparts[0]);
				return;
			}

			//Next we're going to look for general buildings that have less than 50% health, and we'll go to repair those.
			//We set it at 50%, because we don't want builders abandoning their duty every time a road gets walked on
			const halfBroken = creep.room.find(FIND_MY_STRUCTURES);
			let toRepair = [ ];

			for(var index in halfBroken) {
				if((halfBroken[index].hits / halfBroken[index].hitsMax) < 0.5) {

					toRepair.push(halfBroken[index]);
        }
      }

			if(toRepair.length)	{
				var structure = toRepair[0];
        if (structure.pos.inRangeTo(creep.pos, 3)) {
          target.pos.inRangeTo(creep.pos, 3)
        }
        else {
          creep.moveTo(structure, {visualizePathStyle: {stroke: this.myColor}});
        }

				return;
			}

			//If no repairs are needed, we're just going to go find some structures to build
			var targets = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
			if(targets) {
				if(!creep.pos.isNearTo(targets)) {
					creep.moveTo(targets, {visualizePathStyle: {stroke: this.myColor}});
          return;
        } else {
          creep.say('⚒️ buildin');
          creep.build(targets);
          return;
        }
			}

      // Nothing to build? fix some walls:
      const repairit = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: function(structure) {
          return structure.structureType === STRUCTURE_WALL && structure.hits < 100000
        }
      });

      if(repairit) {
        if(!creep.pos.isNearTo(repairit)) {
          creep.moveTo(repairit, {visualizePathStyle: {stroke: this.myColor}});
          return;
        } else {
          creep.say('🛠️ repair');
          creep.repair(repairit);
          return;
        }
      }


			this.rest(true);
		}
	}
}
