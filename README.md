This is heavily modified version of https://github.com/Garethp/Screeps

This is always a work in progress.

# Overview

This library is the AI for my creeps in the game Screeps.

# Features

- Roles system
  - All creeps use the role_prototype.js
  - See role_*.js for full implementation
- Spawning creeps
  - Works off a list of 'required' creeps \([see factory.js](blob/master/factory.js)\)
    - Auto generates missing creeps
  - Creeps spawn with more parts if they can (explained below)
  - Spawns soldiers when required creeps are all spawned
- All Creeps are wise enough to run away from bad guys
- [Miner](blob/master/role_miner.js)
  - 1 Miner is assigned to 1 source
  - Miners only mine, they don't transport
  - Creates a container construction site after settling in to mine
  - [Miner helpers](blob/master/role_miner_helper.js) are spawned as needed to move energy
  - Miner helpers drop construction sites for roads
- [Builder](blob/master/role_builder.js)
  - Repairs anything
  - Can currently build:
    - Extensions
    - Containers
    - Towers
    - Walls
    - Storage
    - Roads
- [Upgrader](blob/master/role_upgrader.js)
  - Upgrades your controller
  - Gets its own energy if needed
- [Message Manager](blob/master/messageManager.js)
  - Shows what is spawning next / currently spawning
- [Construction Planner](blob/master/constructionPlanner.js)
  - Can map road networks to/from sources
  - Must be manually run

And lots of other things.

# TODO Features

- Auto creation of construction sites for buildings
- Auto determine what the 'requiredScreeps' list should be based on a number of factors
- Helpers for upgraders

# Spawner

The spawner module has 4 methods for use. These are

 - spawn(role, memory)
 - canSpawn(spawnPoint, role)
 - spawnCost(role)
 - killAll()

The **role** argument here refers to a human readable name for the list of body parts and AI for a creep. The role directly
relates to the AI for that role in the file roles_{roleName}. So if you spawn a creep with the role
of "miner" it's AI code will be located in roles_miner.js

# Roles

To make things simple, each role has its own file containing its list of parts (and sometimes an
array of these lists). This means that it should be relatively easy to simply add a new role without making your code for
running a turn any more complicated, as the rest of the code will simply take the new role into account.

Each role in this codebase extends from the role_prototype.js code, for some shared functionality. This functionality includes
some events which you can handle. So far the code supports handling the following events:

 - onSpawn() *This is called when the spawner has started spawning*
 - onSpawnStart() *This is called when the spawner has started spawning*
 - onSpawnEnd() *This is called when the creep has finished spawning*
 - beforeAge *This is called when the creep has one tick left*

And the main AI code should go the creep's

 - action(creep)

method.

# Levels

I believe one of the important features for late game screeps will be having different units depending on how much energy
and how many extensions you have. What units you can build with only 5 extensions won't really be all competitive when put
up against what you can do with, say, 12 extensions instead. For this reason, this framework supports the ability to have roles
automatically adjust their body parts to take in to account what you're able to build. At the moment, this is implemented
by creating an array of body parts. For example, a simple list of body parts for a simple worker creep might look like:

```javascript
[CARRY, CARRY, WORK, MOVE, MOVE]
```

It contains 5 parts totaling 300 energy; the maximum you can build without any extensions. However, if you wanted to
have your workers be better if you have the extensions, you might define your parts list as such:

```javascript
[
  [CARRY, CARRY, WORK, MOVE, MOVE],
  [CARRY, CARRY, WORK, WORK, MOVE, MOVE],
  [CARRY, CARRY, WORK, WORK, MOVE, MOVE, MOVE, MOVE],  
  [CARRY, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE],  
]
```

When the spawner attempts to spawn your creep, it will iterate over the parts until it finds the one it can spawn with your resources. This way, when a creep dies, they will be replaced with the definition that fits your needs without you having to add complex logic.

Further more, you can see what kind of creep will be spawned with your current capabilities manually in the console. It's as simple
as using the command

```javascript
require('roleManager').getRoleBodyParts('warrior');
```

And it will send you a list of body parts that suit the current situation. The logic for selecting what parts can also be
overridden by changing the .prototype.getParts() function for a role. For example, if you wanted to select a random definition
for a warrior, instead of scaling it normally, in your roles_warrior.js file you could define:

```javascript
warrior.prototype.getParts = () => {
  const key = Math.floor(Math.random() * this.parts.length);
  return this.parts[key];
}
```
