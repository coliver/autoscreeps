module.exports = {
  roleExists(role) {
    // console.log("roleManager.roleExists")
    try {
      require("roles_" + role);
      return true;
    } catch (e) {
      console.log(role);
      console.log(e.message);
      console.log(e.stack);
      console.log(`${role} aint no role`);
      return false;
    }
  },

  getRole(role) {
    // console.log("roleManager.getRole")
    if (!this.roleExists(role)) {
      return false;
    }

    const proto = require('role_prototype');

    let roleObject = require("roles_" + role);
    roleObject = require('extend')(roleObject, proto);
    return roleObject;
  },

  getRoleBodyParts(role) {
    // console.log("roleManager.getRoleBodyParts")
    if (!this.roleExists(role)) {
      return false;
    }

    const theRole = this.getRole(role);

    if (theRole.getParts !== undefined) {
      return theRole.getParts.call(theRole);
    }
    return theRole.prototype.getParts.call(theRole);
  },
};
