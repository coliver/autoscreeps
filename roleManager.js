module.exports = {
	roleExists: function(role){
		// console.log("roleManager.roleExists")
		try {
			require("roles_" + role);
			return true;
		}
		catch(e) {
			let msg = `
			There is a problem with one of the roles: ${role}

			Message: ${e.message}

			Stack: ${e.stack}`;

			Game.notify(msg)
			console.log(role)
			console.log(e.message)
			console.log(e.stack)
			console.log(`${role} aint no role`)
			return false;
		}
	},

	getRole: function(role) {
		// console.log("roleManager.getRole")
		if(!this.roleExists(role))
			return false;

    var proto = require('role_prototype');

		var roleObject = require("roles_" + role);
        roleObject = require('extend')(roleObject, proto);
		return roleObject;
	},

	getRoleBodyParts: function(role) {
		// console.log("roleManager.getRoleBodyParts")
		if(!this.roleExists(role))
			return false;

		var role = this.getRole(role);

		if(role.getParts !== undefined)
			return role.getParts.call(role);
		else
			return role.prototype.getParts.call(role);
	}
};
