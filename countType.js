// TODO: Make this room specific
module.exports = (type, qued) => {
  // console.log(`countType(${type}, ${qued})`);
  if (qued === undefined) { qued = false; }

  // Find all creeps in that room by their role
  let count = _.filter(Game.creeps, { memory: { role: type } }).length || 0;
  // console.log(`  count: ${count}`)

  // If qued was true, also check against the queue
  if (qued) {
    const { spawns } = Game;

    // Check against currently spawning creeps
    Object.keys(spawns).forEach((spawn) => {
      if (spawn.spawning !== null
        && spawn.spawning !== undefined
        && Game.creeps[spawn.spawning.name].role === type) {
        count += 1;
      }
    });

    if (Memory.spawnQue === undefined) { Memory.spawnQue = []; }

    // Check the spawnQue itself
    count += Memory.spawnQue.filter(qued => qued === type).length;
  }

  return count;
};
