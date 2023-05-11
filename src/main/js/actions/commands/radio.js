const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {addAll, isConnected, isSameChannel, playPlayer} = require('../player');
const {escaping, getCommandName} = require('../../utils/string');
const {notify, notifyForbidden, notifyUnequalChannels} = require('../commands');
const {DISCORD_OPTIONS_MAX} = require('../../utils/constants');
const {TYPES: SONG_TYPES} = require('../../db/repositories/queue');
const {audit} = require('../auditor');
const chunk = require('lodash/chunk');
const config = require('../../configs/config');
const {getAddedDescription} = require('../../utils/player');
const {getRadios} = require('../radios');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.radio.description'))
    .addSubcommandGroup(g => {
      const radios = chunk([...getRadios().keys()].sort(), DISCORD_OPTIONS_MAX);

      radios.forEach((radiosChunk, index) => {
        const choices = radiosChunk
          .map(radio => ({name: radio.toString(), value: radio.toString()}));

        g.addSubcommand(s => s
          .setName((index + 1).toString())
          .setDescription(t('discord:command.radio.page.radioStation.description', {
            pageStart: choices[0].name[0],
            pageEnd: choices[choices.length - 1].name[0],
          }))
          .addStringOption(s => s
            .setName('station')
            .setDescription(t('discord:command.radio.page.radioStation.option.station.description'))
            .setRequired(true)
            .addChoices(...choices)));
      });

      g.setName('page')
        .setDescription(t('discord:command.radio.page.description'));

      return g;
    }),
  execute: interaction => module.exports.radio(interaction, true),
};

module.exports.radio = async (interaction, isExecute, stationKey = interaction.options.getString('station')) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RADIO)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: 'radio'})};
  }

  if (isConnected(interaction.guildId) && !isSameChannel(interaction.guildId, interaction.member.voice.channel?.id)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  const added = getStationAdded(interaction.user.id, stationKey);
  const description = await getAddedDescription(interaction.guildId, added.info);
  await addAll(interaction.guildId, added);
  await playPlayer(interaction);

  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(escaping(added.info.title))
      .setURL(added.info.url)
      .setDescription(description)
      .setThumbnail(added.info.preview)
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.radio'),
  });
  return {info: added.info};
};

const getStationAdded = (userId, stationKey) => {
  const station = getRadios().get(stationKey);

  return {
    info: {
      type: SONG_TYPES.RADIO,
      title: stationKey,
      duration: 0,
      url: station.channel.url,
      isLive: true,
      preview: station.channel.preview,
      userId,
    },
    get songs() {
      return [this.info];
    },
  };
};
