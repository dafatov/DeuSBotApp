const {SlashCommandBuilder} = require("@discordjs/builders");
const {move} = require("./move.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('first')
    .setDescription('Переместить композицию с места в очереди на первую')
    .addIntegerOption(o => o
      .setName('target')
      .setDescription('Номер в очереди целевой композиции')
      .setRequired(true)),
  async execute(interaction) {
    await first(interaction);
  },
  async listener(interaction) {}
}

const first = async (interaction) => {
  interaction.commandName = 'move'
  await move(interaction, 0);
}