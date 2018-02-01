const constructionPlanner = {
  // TODO: Obviously make this dynamic.
  // let construction = require('constructionPlanner'); construction.buildRoadToAllSources();
  theRoom: null,

  buildRoads(from, to) {
    const { theRoom } = this;
    console.log(`buildRoads(${from}, ${to})`);
    const path = theRoom.findPath(from, to, { ignoreCreeps: true });
    console.log(`${JSON.stringify(path)} = this.theRoom.findPath(from, to, { ignoreCreeps: true });`);
    for (let i = 0; i < path.length; i += 1) {
      Memory.rooms[theRoom.name].roadSites.push({ x: path[i].x, y: path[i].y });
      const result = theRoom.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
      console.log(`    ${result} = createConstructionSite(${path[i].x}, ${path[i].y})`);
    }
  },

  // let construction = require('constructionPlanner'); construction.buildRoadToAllSources();
  // Build roads from spawns to sources and the controller to sources.
  buildRoadsToAllSources() {
    console.log('buildRoadToAllSources!');
    const sources = this.theRoom.find(FIND_SOURCES_ACTIVE);
    const spawnsInRoom = this.theRoom.find(FIND_MY_SPAWNS);
    const extensions = this.theRoom.find(FIND_MY_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_EXTENSION,
    });

    for (let i = 0; i < sources.length; i += 1) {
      console.log(sources[i]);
      for (let j = 0; j < spawnsInRoom.length; j += 1) {
        console.log(spawnsInRoom[i]);
        this.buildRoads(spawnsInRoom[j].pos, sources[i].pos);
      }
      for (let k = 0; k < extensions.length; k += 1) {
        this.buildRoads(extensions[k].pos, sources[i].pos);
      }
      this.buildRoads(this.theRoom.controller.pos, sources[i].pos);
    }
  },

  // let construction = require('constructionPlanner'); construction.theRoom = Game.rooms['W42N85']; construction.killAllNonStartedSites();
  killAllNonStartedSites() {
    const sites = this.theRoom.find(FIND_CONSTRUCTION_SITES);

    for (let i = 0; i < sites.length; i += 1) {
      const site = sites[i];
      console.log(JSON.stringify(site));

      if (site && site.progress === 0) {
        console.log(`removing ${site}`);
        site.remove();
      }
    }
  },

  // TODO: Expand on this eventually
  // expandRampartsOutwards: function()
  // {
  //   var ramparts = theRoom.find(Game.MY_STRUCTURES, {
  //     filter: function(struct)
  //     {
  //       return struct.structureType == Game.STRUCTURE_RAMPART
  //     }
  //   });
  //
  //   for(var i in ramparts)
  //   {
  //     var rampart = ramparts[i];
  //
  //     var positions = [
  //       [rampart.pos.x - 1, rampart.pos.y],
  //       [rampart.pos.x, rampart.pos.y - 1],
  //       [rampart.pos.x, rampart.pos.y - 1],
  //       [rampart.pos.x, rampart.pos.y + 1],
  //       [rampart.pos.x - 1, rampart.pos.y - 1],
  //       [rampart.pos.x + 1, rampart.pos.y - 1],
  //       [rampart.pos.x - 1, rampart.pos.y + 1],
  //       [rampart.pos.x - 1, rampart.pos.y - 1]
  //     ];
  //
  //     for(var i in positions)
  //     {
  //       var pos = positions[i];
  //       var tile = theRoom.lookAt(pos[0], pos[1]);
  //       var build = true;
  //       for(var tilei in tile)
  //       {
  //         var thing = tile[tilei];
  //         if(thing.type == 'structure' && thing.structure.structureType == Game.STRUCTURE_RAMPART)
  //           build = false;
  //         if(thing.type == 'constructionSite')
  //           build = false;
  //       }
  //
  //       if(build)
  //         theRoom.createConstructionSite(pos[0], pos[1], Game.STRUCTURE_RAMPART);
  //     }
  //   }
  // }
};

module.exports = constructionPlanner;
