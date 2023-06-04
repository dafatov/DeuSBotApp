const {ActionRowBuilder, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {addAll, isConnected, isSameChannel, playPlayer} = require('../player');
const {escaping, getCommandName} = require('../../utils/string');
const {getPlaylist, getSearch, getSong} = require('../../api/external/youtube');
const {notify, notifyForbidden, notifyUnequalChannels} = require('../commands');
const {DISCORD_ROWS_MAX} = require('../../utils/constants');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getAddedDescription} = require('../../utils/player');
const {promiseAllSequence} = require('../../utils/mapping');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.play.description'))
    .addStringOption(o => o
      .setName('audio')
      .setDescription(t('discord:command.play.option.audio.description'))),
  isDeferReply: interaction => !!interaction.options.getString('audio'),
  execute: interaction => module.exports.play(interaction, true),
  onModal: interaction => onModal(interaction),
};

module.exports.play = async (interaction, isExecute, audio = interaction.options.getString('audio')) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PLAY)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: 'play'})};
  }

  if (isConnected(interaction.guildId) && !isSameChannel(interaction.guildId, interaction.member.voice.channel?.id)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  if (isExecute && !audio) {
    const modal = new ModalBuilder()
      .setCustomId(getCommandName(__filename))
      .setTitle(t('discord:command.play.modal.title'))
      .setComponents(...Array(DISCORD_ROWS_MAX).fill()
        .map((textInput, index) => new TextInputBuilder()
          .setCustomId(`playTextInput${index}`)
          .setLabel(t('discord:command.play.modal.textInput.title', {number: index + 1}))
          .setPlaceholder(t('discord:command.play.option.audio.description'))
          .setStyle(TextInputStyle.Short)
          .setRequired(index === 0))
        .map(textInput => new ActionRowBuilder().setComponents(textInput)));

    await interaction.showModal(modal);
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.play.modal'),
    });
    return;
  }

  const added = await getPlaylist(interaction, audio)
    .catch(() => getSong(interaction, audio))
    .catch(() => getSearch(interaction, audio));
  const description = await getAddedDescription(interaction.guildId, added.info);

  await addAll(interaction.guildId, added);
  await playPlayer(interaction);

  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(escaping(added.info.title))
      .setDescription(description)
      .setURL(added.info.url)
      .setThumbnail(added.info.preview)
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.play.song'),
  });
  return {added: added.info};
};

const onModal = async interaction => {
  await interaction.deferReply();
  await promiseAllSequence(interaction.fields.fields
    .map(field => field.value)
    .filter(audio => audio)
    .map(audio => () => module.exports.play(interaction, true, audio)));
};
