// TODO: Make this room specific
module.exports = function(type, qued) {
  // console.log(`countType(${type}, ${qued})`);
  if(qued == undefined)
    qued = false;

  // Find all creeps in that room by their role
  var count = _.filter(Game.creeps, { memory: { role: type }}).length || 0;
  // console.log(`  count: ${count}`)

  // If qued was true, also check against the queue
  if(qued)
  {
    var spawns = Game.spawns;

    // Check against currently spawning creeps
    for(var i in spawns)
    {
      var spawn = spawns[i];
      if(spawn.spawning !== null
        && spawn.spawning !== undefined
        && Game.creeps[spawn.spawning.name].role == type) {
        count++;
      }
    }

    if(Memory.spawnQue === undefined) { Memory.spawnQue = []; }

    // Check the spawnQue itself
    count += Memory.spawnQue.filter(function(qued)
    {
      return qued == type;
    }).length;
  }

  return count;
};
