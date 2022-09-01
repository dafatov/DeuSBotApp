const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const helps = require('../../configs/help.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');
const {version} = require('../../../package');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Детальное описание тонкостей работы некоторых команд')
    .addStringOption(s => s
      .setName('command')
      .setDescription('Наименование команды')
      .setRequired(false)
      .addChoices([...helps.keys()].map(k => [k, k]))),
    async execute(interaction) {
        await help(interaction);
    },
    async listener(_interaction) {},
}

const help = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_HELP)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"help\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('help', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде help запрещен',
    });
    return;
  }

  let command = interaction.options.getString('command');
  let helpDefault = `Данный бот (Deus v${version}) был разработан DemetriouS (aka dafatov) в рамках частного проекта специально для данного сервера на чистом энтузиазме, а, следовательно, все претензии, требования, жалобы и другие проявления человеческого социального одностроннего взаимодействия могут идти лесом, рощей и т.п.
    
        Для остальных - при нахождении бага, просьба точно определиться, что это баг, а не фича, для начала. Перейти на сайт <https://github.com/dafatov/DeusBot/issues> и оставить там **New issue**, в котором **описать ситуациию возникновения проблемы, ожидаемый результат и полученный результат**.
    
        Сайт бота: ${process.env.DEUS_BOT_WEB_URL}`;

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(`Информация по **${command ?? 'боту Deus'}**`)
    .setDescription(helps.get(command) ?? helpDefault)
    .setFooter(
      'Copyright (c) 2021 dafatov',
      'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
    );
  await notify('help', interaction, {embeds: [embed]});
  logGuild(interaction.guildId, `[help]: Помощь по \"${command ?? 'боту Deus'}\" выведена успешно`);
}
