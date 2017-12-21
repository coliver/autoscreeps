const messageManager = {
  showSpawningThings() {
    // TODO find a better spot for this
    // Show room messages
    // Say what is spawning:
    const spawns = _.filter(
      Game.spawns,
      spawn => spawn.spawning !== undefined && spawn.spawning !== null,
    );

    spawns.map((s) => {
      const text = `🛠️ ${s.spawning.name} in ${s.spawning.remainingTime}`;
      return s.room.visual.text(text, s.pos, { color: '#fefefe', font: 0.8 });
    });
  },
};

module.exports = messageManager;
