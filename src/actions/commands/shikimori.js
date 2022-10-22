const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError, updateCommands} = require('../commands.js');
const {MessageEmbed} = require('discord.js');
const RandomOrg = require('random-org');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const axios = require('axios').default;
const config = require('../../configs/config.js');
const db = require('../../db/repositories/users.js');
const {escaping} = require('../../utils/string.js');
const {searchSongs} = require('../commands/play.js');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');

const MAX_COUNT = 100;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shikimori')
    .setDescription(t('discord:command.shikimori.description'))
    .addSubcommand(s => s
      .setName('play')
      .setDescription(t('discord:command.shikimori.play.description'))
      .addStringOption(s => s
        .setName('nickname')
        .setDescription(t('discord:command.shikimori.play.option.nickname.description'))
        .setRequired(true))
      .addIntegerOption(i => i
        .setName('count')
        .setDescription(t('discord:command.shikimori.play.option.count.description'))
        .setRequired(false)))
    .addSubcommand(s => s
      .setName('set')
      .setDescription(t('discord:command.shikimori.set.description'))
      .addStringOption(o => o
        .setName('login')
        .setDescription(t('discord:command.shikimori.set.option.login.description'))
        .setRequired(true))
      .addStringOption(s => s
        .setName('nickname')
        .setDescription(t('discord:command.shikimori.set.option.nickname.description'))
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription(t('discord:command.shikimori.remove.description'))
      .addStringOption(s => s
        .setName('login')
        .setDescription(t('discord:command.shikimori.remove.option.login.description'))
        .setRequired(true))),
  async execute(interaction) {
    await shikimori(interaction);
  },
};

module.exports.shikimoriPlay = async (interaction, login, count) => await play(interaction, false, login, count);

const shikimori = async interaction => {
  if (interaction.options.getSubcommand() === 'play') {
    await play(interaction, true);
  } else if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  }
};

const play = async (interaction, isExecute, login = interaction.options.getString('nickname'), count = interaction.options.getInteger('count') || 1) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_PLAY)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'shikimori play'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'shikimori.play'}),
    });
    return {result: t('web:info.forbidden', {command: 'shikimori.play'})};
  }

  let animes, response;

  try {
    response = await axios.get(`https://shikimori.one/${login}/list_export/animes.json`);
    animes = response.data.filter(a =>
      (a.status === 'completed' || a.status === 'watching')
      && a.episodes > 1,
    );
  } catch (e) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.shikimori.play.wrongShikimoriProfile.title'))
      .setDescription(t('discord:command.shikimori.play.wrongShikimoriProfile.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('shikimori', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.shikimori.play.wrongShikimoriProfile'),
    });
    return {result: t('web:info.wrongShikimoriProfile')};
  }

  if (count < 1 || count > MAX_COUNT) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.shikimori.play.unboundCount.title'))
      .setDescription(t('discord:command.shikimori.play.unboundCount.description', {max: MAX_COUNT}))
      .setTimestamp();
    if (isExecute) {
      await notify('shikimori', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.shikimori.unboundCount'),
    });
    return {result: t('web:info.unboundCount')};
  }

  let audios = [];
  animes.forEach(anime => {
    // eslint-disable-next-line no-loops/no-loops
    for (let j = 0; j < anime.episodes / 12; j++) {
      audios.push(`${anime.target_title} +opening ${j + 1} +full`);
      audios.push(`${anime.target_title} +ending ${j + 1} +full`);
    }
  });
  const random = new RandomOrg({apiKey: process.env.RANDOM_ORG_TOKEN});
  const requestsLeft = await random
    .generateIntegers({
      n: count,
      min: 0,
      max: audios.length - 1,
      replacement: false,
    })
    .then(response => ({requestsLeft: response.requestsLeft, data: response.random.data}))
    .then(response => {
      audios = audios.filter((_audio, index) => response.data.includes(index));
      return response.requestsLeft;
    }).catch(async e => {
      await audit({
        guildId: interaction.guildId,
        type: TYPES.ERROR,
        category: CATEGORIES,
        message: stringify(e),
      });
    });
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(requestsLeft >= 0
      ? t('discord:command.shikimori.play.creating.title.success')
      : t('discord:command.shikimori.play.creating.title.noRandom'))
    .setDescription(requestsLeft >= 0
      ? t('discord:command.shikimori.play.creating.description.success')
      : t('discord:command.shikimori.play.creating.description.noRandom'))
    .setTimestamp();
  if (isExecute) {
    await notify('shikimori', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: requestsLeft >= 0
      ? TYPES.INFO
      : TYPES.WARNING,
    category: CATEGORIES.COMMAND,
    message: requestsLeft >= 0
      ? t('inner:audit.command.shikimori.play.creating.success')
      : t('inner:audit.command.shikimori.play.creating.noRandom'),
  });
  if (requestsLeft >= 0) {
    await searchSongs(interaction, isExecute, audios, login);
  }
  return {login, count: audios.length};
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'shikimori set'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'shikimori.set'}),
    });
    return {result: t('web:info.forbidden', {command: 'shikimori.set'})};
  }

  const {login, nickname} = {
    login: interaction.options.getString('login'),
    nickname: interaction.options.getString('nickname'),
  };

  try {
    if (!login || !nickname) {
      await notifyError('shikimori', t('discord:command.shikimori.set.emptyProfile', {login, nickname}), interaction);
    }

    try {
      await axios.get(`https://shikimori.one/${login}`);
    } catch (e) {
      await notifyError('shikimori', t('discord:command.shikimori.set.nonExistLogin', {login}), interaction);
    }

    await db.set({
      'login': login,
      'nickname': nickname,
    });

    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.shikimori.set.completed.title'))
      .setTimestamp()
      .addField(escaping(login), escaping(nickname));
    await updateCommands(interaction.client);
    await notify('shikimori', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.shikimori.set.completed'),
    });
  } catch (e) {
    await notifyError('shikimori', e, interaction);
  }
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'shikimori remove'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'shikimori.remove'}),
    });
    return {result: t('web:info.forbidden', {command: 'shikimori.remove'})};
  }

  const login = interaction.options.getString('login');

  try {
    if (!login) {
      await notifyError('shikimori', t('discord:command.shikimori.remove.emptyLogin', {login}), interaction);
    }

    await db.removeByLogin(login);

    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.shikimori.remove.completed.title'))
      .setTimestamp()
      .setDescription(escaping(login));
    await updateCommands(interaction.client);
    await notify('shikimori', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.shikimori.remove.completed'),
    });
  } catch (e) {
    await notifyError('shikimori', e, interaction);
  }
};
