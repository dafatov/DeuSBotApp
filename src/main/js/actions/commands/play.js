const {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {addAll, get, isConnected, isSameChannel, playPlayer} = require('../player');
const {escaping, getCommandName} = require('../../utils/string');
const {getPlaylist, getSearch, getSong} = require('../../api/external/youtube');
const {notify, notifyForbidden, notifyUnequalChannels} = require('../commands');
const {DISCORD_ROWS_MAX} = require('../../utils/constants');
const {TYPES: SONG_TYPES} = require('../../db/repositories/queue');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getAddedDescription} = require('../../utils/player');
const {getAudioDurationInSeconds} = require('get-audio-duration');
const isUrl = require('is-url');
const {isValidUrl: isYoutubeUrl} = require('is-youtube-url');
const {move} = require('./move');
const {promiseAllSequence} = require('../../utils/mapping');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.play.description'))
    .addStringOption(o => o
      .setName('string')
      .setDescription(t('discord:command.play.option.string.description')))
    .addAttachmentOption(o => o
      .setName('attachment')
      .setDescription(t('discord:command.play.option.file.description'))),
  isDeferReply: interaction => !!interaction.options.getString('string') || !!interaction.options.getAttachment('attachment'),
  execute: interaction => module.exports.play(interaction, true),
  onButton: interaction => onFirst(interaction),
  onModal: interaction => onModal(interaction),
};

module.exports.play = async (interaction, isExecute, audio = interaction.options.getString('string')) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PLAY)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: getCommandName(__filename)})};
  }

  const attachment = interaction.options?.getAttachment('attachment');

  if (audio && attachment) {
    return await illegalState(interaction);
  }

  if (!interaction.member.voice.channelId || isConnected(interaction.guildId) && !isSameChannel(interaction.guildId, interaction.member.voice.channelId)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  if (isExecute && !audio && !attachment) {
    return await showModal(interaction);
  }

  const added = await getAdded(interaction, audio, attachment);

  if (!added) {
    if (isExecute) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(t('discord:command.play.notFound.title'))
        .setDescription(t('discord:command.play.notFound.description'))
        .setTimestamp();
      await notify(interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.play.notFound'),
    });
    return {result: t('web:info.notFound')};
  }

  const description = await getAddedDescription(interaction.guildId, added.info);

  const addedIds = await addAll(interaction.guildId, added);
  await playPlayer(interaction);

  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(escaping(added.info.title))
      .setDescription(description)
      .setURL(added.info.url)
      .setThumbnail(added.info.preview)
      .setTimestamp();
    const control = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`first-${addedIds[0]}`)
          .setLabel(t('common:player.toFirst'))
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!!added.info.length),
      );
    await notify(interaction, {embeds: [embed], components: [control]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.play.song'),
  });
  return {added: added.info};
};

const illegalState = async interaction => {
  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle(t('discord:embed.illegalState.title', {command: getCommandName(__filename)}))
    .setDescription(t('discord:embed.illegalState.description'))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  return {result: t('web:info.illegalState', {command: getCommandName(__filename)})};
};

const showModal = async interaction => {
  const modal = new ModalBuilder()
    .setCustomId(getCommandName(__filename))
    .setTitle(t('discord:command.play.modal.title'))
    .setComponents(...Array(DISCORD_ROWS_MAX).fill()
      .map((textInput, index) => new TextInputBuilder()
        .setCustomId(`playTextInput${index}`)
        .setLabel(t('discord:command.play.modal.textInput.title', {number: index + 1}))
        .setPlaceholder(t('discord:command.play.option.string.description'))
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
};

const getAdded = (interaction, audio, attachment) => {
  if (audio) {
    if (isYoutubeUrl(audio) || !isUrl(audio)) {
      return getPlaylist(interaction, audio)
        .catch(() => getSong(interaction, audio))
        .catch(() => getSearch(interaction, audio));
    } else {
      attachment = {name: audio, url: audio};
    }
  }

  if (attachment) {
    return getAudioDurationInSeconds(attachment.url)
      .then(duration => ({
        info: {
          type: SONG_TYPES.FILE,
          title: attachment.name,
          duration: Math.ceil(duration ?? 0),
          url: attachment.url,
          isLive: false,
          preview: 'https://i.imgur.com/7SdVZxF.png',
          userId: interaction.user.id,
        },
        get songs() {
          return [this.info];
        },
      }));
  }
};

const onFirst = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_MOVE)) {
    await notifyForbidden('first', interaction);
    return;
  }

  const control = ActionRowBuilder.from(interaction.message.components[0]);
  const first = control.components[0];
  const song = await get(first.data.custom_id.split('-')[1]);

  if (!song) {
    first.setDisabled(true);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.play.noInQueue.title'))
      .setDescription(t('discord:command.play.noInQueue.description'))
      .setTimestamp();
    await interaction.update({components: [control]});
    await notify(interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.play.notInQueue'),
    });
    return;
  }

  await move(interaction, true, 0, song.index);
};

const onModal = async interaction => {
  await interaction.deferReply();
  await promiseAllSequence(interaction.fields.fields
    .map(field => field.value)
    .filter(audio => audio)
    .map(audio => () => module.exports.play(interaction, true, audio)));
};
