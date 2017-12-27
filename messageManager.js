const messageManager = {
  showMessages() {
    this.showThingsOnDeck();
    this.showSpawningThings();
  },

  showSpawningThings() {
    const spawns = _.filter(
      Game.spawns,
      spawn => spawn.spawning != null,
    );

    spawns.map((s) => {
      const text = `🛠️ ${s.spawning.name} in ${s.spawning.remainingTime}`;
      return s.room.visual.text(text, s.pos, { color: '#fefefe', font: 0.8 });
    });
  },

  showThingsOnDeck() {
    if (Memory.spawnQue[0] === undefined) {
      return;
    }

    const spawns = _.filter(
      Game.spawns,
      spawn => spawn.spawning == null,
    );

    spawns.map((s) => {
      const text = `${Memory.spawnQue[0]} up next`;
      return s.room.visual.text(text, s.pos.x, (s.pos.y - 1), { color: '#fefefe', font: 0.8 });
    });
  },
};

module.exports = messageManager;
