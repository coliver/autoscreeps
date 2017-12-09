module.exports = function(creeps) {
	var roleManager = require('roleManager');
	var roles = { };

	//For each creep, check if they have a role. If they do, load and run it
	for(var name in creeps)	{
 		// console.log(`  ${name}`)
    var creep = creeps[name];
		if(creep.spawning || creep.memory.role == undefined
			|| (creep.memory.active !== undefined && !creep.memory.active)) {
 		// 	console.log(`  Skipping creep: ${creep.name}`)
			continue;
    }

		const roleName = creep.memory.role;
		let role;

		if(roleManager.roleExists(roleName)) {
			// console.log(`Exists! ${roleName}`)
			role = roleManager.getRole(roleName);
		}

		// console.log(`role: ${roleName} : ${JSON.stringify(role)}`)
		role = Object.create(role);

		role.setCreep(creep);

		try {
      role.run();
    } catch(e) {
			console.log(e.message);
			console.log(e.stack);
    };
	}
};
