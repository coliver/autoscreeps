const constructionPlanner = {
  // TODO: Obviously make this dynamic.
  // let construction = require('constructionPlanner'); construction.buildRoadToAllSources();
  theRoom: null,

  // Determine what is possible to build
  // Game.glc.level
  // 0  —  Roads, 5 Containers
  // 1  200  Roads, 5 Containers, 1 Spawn
  //    Get containers under the miners.
  //    Get roads everywhere.
  // 2  45,000  Roads, 5 Containers, 1 Spawn, 5 Extensions (50 capacity), Ramparts (300K max hits), Walls
  //    Get extensions everywhere.
  //    TODO: Get ramparts up.
  // 3  135,000  Roads, 5 Containers, 1 Spawn, 10 Extensions (50 capacity), Ramparts (1M max hits), Walls, 1 Tower
  // 4  405,000  Roads, 5 Containers, 1 Spawn, 20 Extensions (50 capacity), Ramparts (3M max hits), Walls, 1 Tower, Storage
  // 5  1,215,000  Roads, 5 Containers, 1 Spawn, 30 Extensions (50 capacity), Ramparts (10M max hits), Walls, 2 Towers, Storage, 2 Links
  // 6  3,645,000  Roads, 5 Containers, 1 Spawn, 40 Extensions (50 capacity), Ramparts (30M max hits), Walls, 2 Towers, Storage, 3 Links, Extractor, 3 Labs, Terminal
  // 7  10,935,000  Roads, 5 Containers, 2 Spawns, 50 Extensions (100 capacity), Ramparts (100M max hits), Walls, 3 Towers, Storage, 4 Links, Extractor, 6 Labs, Terminal
  // 8  —  Roads, 5 Containers, 3 Spawns, 60 Extensions (200 capacity), Ramparts (300M max hits), Walls, 6 Towers, Storage, 6 Links, Extractor, 10 Labs, Terminal, Observer, Power Spawn

  // Proritize containers where miners are mining.
  // Then extensions
  // then basically everything else

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
