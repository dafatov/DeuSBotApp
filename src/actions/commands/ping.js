const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {notify, notifyError} = require('../commands');
const {logGuild} = require('../../utils/logger.js');
const config = require('../../configs/config.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Пинг и отпинг'),
  async execute(interaction) {
    await ping(interaction);
  },
  async listener(_interaction) {},
};

const ping = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PING)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"ping\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('ping', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде ping запрещен',
    });
    return;
  }

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle('Мое время обработки данных')
    .setTimestamp()
    .setDescription(`Решал на досуге задачи тысячелетия и решил за ${Math.round(interaction.client.ws.ping)}мс. Их все.`);

  try {
    await notify('ping', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[ping]: Список реакций успешно обновлен`);
  } catch (e) {
    await notifyError('ping', e, interaction);
  }
}
