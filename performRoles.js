module.exports = (creeps) => {
  const roleManager = require('roleManager');

  // For each creep, check if they have a role. If they do, load and run it
  Object.keys(creeps).forEach((name) => {
  // for (const name in creeps) {
    // console.log(`  ${name}`)
    const creep = creeps[name];
    if (creep.spawning || creep.memory.role == null
      || (creep.memory.active !== undefined && !creep.memory.active)) {
      //   console.log(`  Skipping creep: ${creep.name}`)
      return;
    }

    const roleName = creep.memory.role;
    let role;

    if (roleManager.roleExists(roleName)) {
      // console.log(`Exists! ${roleName}`)
      role = roleManager.getRole(roleName);
    }

    // console.log(`role: ${roleName} : ${JSON.stringify(role)}`)
    role = Object.create(role);

    role.setCreep(creep);

    try {
      role.run();
    } catch (e) {
      console.log(e.message);
      console.log(e.stack);
    }
  });
};
