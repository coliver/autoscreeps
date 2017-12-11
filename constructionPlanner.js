const constructionPlanner = {
  // TODO: Obviously make this dynamic.
  // let construction = require('constructionPlanner'); construction.buildRoadToAllSources();
  theRoom: Game.rooms.W32S12,

  buildRoads(from, to) {
    // console.log(`buildRoads(${from}, ${to})`)
    const path = this.theRoom.findPath(from, to, { ignoreCreeps: true });
    // console.log(`    ${JSON.stringify(path)} = this.theRoom.findPath(from, to, { ignoreCreeps: true });`)
    for (const i in path) {
      const result = this.theRoom.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
      // console.log(`    ${result} = createConstructionSite(${path[i].x}, ${path[i].y})`);
    }
  },

  // let construction = require('constructionPlanner'); construction.buildRoadToAllSources();
  buildRoadToAllSources() {
    // console.log("buildRoadToAllSources!")
    const sources = this.theRoom.find(FIND_SOURCES_ACTIVE);

    for (const i in sources) {
      // TODO: Replace hard coded call
      this.buildRoads(Game.spawns.Spawn1.pos, sources[i].pos);
    }
  },

  // let construction = require('constructionPlanner'); construction.killAllNonStartedSites();
  killAllNonStartedSites() {
    const sites = this.theRoom.find(FIND_CONSTRUCTION_SITES);

    for (const i in sites) {
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
