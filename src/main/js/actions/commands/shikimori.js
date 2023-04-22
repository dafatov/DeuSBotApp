const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {addAll, isConnected, isSameChannel, playPlayer} = require('../player');
const {escaping, getCommandName, stringify} = require('../../utils/string');
const {notify, notifyForbidden, notifyUnequalChannels, updateCommands} = require('../commands');
const {MessageEmbed} = require('discord.js');
const RandomOrg = require('random-org');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const axios = require('axios');
const config = require('../../configs/config');
const {createShikimoriXml} = require('../../utils/attachments');
const db = require('../../db/repositories/users');
const {getAddedDescription} = require('../../utils/player');
const {getSearch} = require('../../api/external/youtube');
const progressBar = require('string-progressbar');
const {t} = require('i18next');

const MAX_COUNT = 100;

module.exports = {
  data: () => db.getAll()
    .then(users => users.map(({login, nickname}) => ({name: nickname, value: login})))
    .then(nicknameChoices => new SlashCommandBuilder()
      .setName(getCommandName(__filename))
      .setDescription(t('discord:command.shikimori.description'))
      .addSubcommand(s => s
        .setName('play')
        .setDescription(t('discord:command.shikimori.play.description'))
        .addStringOption(s => s
          .setName('nickname')
          .setDescription(t('discord:command.shikimori.option.nickname.description'))
          .setRequired(true)
          .setChoices(...nicknameChoices))
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
          .setRequired(true)))
      .addSubcommand(s => s
        .setName('export')
        .setDescription(t('discord:command.shikimori.export.description'))
        .addStringOption(s => s
          .setName('nickname')
          .setDescription(t('discord:command.shikimori.option.nickname.description'))
          .setRequired(true)
          .setChoices(...nicknameChoices)))),
  execute: interaction => shikimori(interaction),
};

const shikimori = interaction => {
  switch (interaction.options.getSubcommand()) {
    case 'play':
      return module.exports.play(interaction, true);
    case 'set':
      return set(interaction);
    case 'remove':
      return remove(interaction);
    case 'export':
      return oExport(interaction);
  }
};

module.exports.play = async (interaction, isExecute,
  login = interaction.options.getString('nickname'),
  count = interaction.options.getInteger('count') ?? 1,
) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_PLAY)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: getCommandName(__filename)})};
  }

  if (isConnected(interaction.guildId) && !isSameChannel(interaction.guildId, interaction.member.voice.channel?.id)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  if (count < 1 || count > MAX_COUNT) {
    if (isExecute) {
      const embed = new MessageEmbed()
        .setColor(config.colors.warning)
        .setTitle(t('discord:command.shikimori.play.unboundCount.title'))
        .setDescription(t('discord:command.shikimori.play.unboundCount.description', {max: MAX_COUNT}))
        .setTimestamp();
      await notify(interaction, {embeds: [embed]});
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
  await axios.get(`${process.env.SHIKIMORI_URL}/${login}/list_export/animes.json`)
    .then(response => response.data
      .filter(anime => (anime.status === 'completed' || anime.status === 'watching') && anime.episodes > 1))
    .then(animes => animes.forEach(anime => {
      // eslint-disable-next-line no-loops/no-loops
      for (let j = 0; j < anime.episodes / 12; j++) {
        audios.push(`${anime.target_title} +opening ${j + 1} +full`);
        audios.push(`${anime.target_title} +ending ${j + 1} +full`);
      }
    }));

  const requestsLeft = await new RandomOrg({apiKey: process.env.RANDOM_ORG_TOKEN})
    .generateIntegers({
      n: count,
      min: 0,
      max: audios.length - 1,
      replacement: false,
    })
    .then(response => ({requestsLeft: response.requestsLeft, data: response.random.data}))
    .then(response => {
      audios = audios.filter((_, index) => response.data.includes(index));
      return response.requestsLeft;
    }).catch(async e => {
      await audit({
        guildId: interaction.guildId,
        type: TYPES.ERROR,
        category: CATEGORIES,
        message: stringify(e),
      });
    });

  if (requestsLeft <= 0) {
    if (isExecute) {
      const embed = new MessageEmbed()
        .setColor(config.colors.warning)
        .setTitle(t('discord:command.shikimori.play.noRandom.title'))
        .setDescription(t('discord:command.shikimori.play.noRandom.description'))
        .setTimestamp();
      await notify(interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.shikimori.play.creating.noRandom'),
    });
    return {result: t('web:info.noRandom')};
  }

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.shikimori.play.completed.title'))
      .setDescription(t('discord:command.shikimori.play.completed.description'))
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shikimori.play.creating.success'),
  });
  await search(interaction, audios, login, isExecute);
  return {login, count: audios.length};
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_SET)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const login = interaction.options.getString('login');

  try {
    await axios.get(`${process.env.SHIKIMORI_URL}/${login}`);
  } catch (e) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.shikimori.set.nonExistLogin.title'))
      .setDescription(t('discord:command.shikimori.set.nonExistLogin.description', {login}))
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.shikimori.set.nonExistLogin'),
    });
    return;
  }

  const nickname = interaction.options.getString('nickname');

  await db.set({login, nickname});
  await updateCommands(interaction.client);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.shikimori.set.completed.title'))
    .setTimestamp()
    .setFields({name: escaping(login), value: escaping(nickname)});
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shikimori.set.completed'),
  });
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_REMOVE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const login = interaction.options.getString('login');

  await db.removeByLogin(login);
  await updateCommands(interaction.client);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.shikimori.remove.completed.title'))
    .setTimestamp()
    .setDescription(escaping(login));
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shikimori.remove.completed'),
  });
};

const oExport = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_EXPORT)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const nickname = interaction.options.getString('nickname');
  const attachment = await createShikimoriXml(nickname);
  await notify(interaction, {files: [attachment]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shikimori.export.completed'),
  });
};

const search = async (interaction, audios, login, isExecute) => {
  let intervalId = null;
  let counter = 0;

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.play.searching.title'));
    intervalId = setInterval(async () => {
      const barString = progressBar.filledBar(audios.length, counter);

      embed.setDescription(`${barString[0]} [${Math.round(barString[1])}%]`);
      await interaction.editReply({embeds: [embed]});
    }, 1000);
  }

  const added = await audios.reduce((accPromise, audio) => getSearch(interaction, audio)
    .then(search => accPromise.then(acc => reduceInfo(acc, search.info)),
    ).then(info => {
      counter++;
      return info;
    }), initialInfo(interaction.user.id, audios));

  const description = await getAddedDescription(interaction.guildId, added.info);
  clearInterval(intervalId);
  await addAll(interaction.guildId, added);
  await playPlayer(interaction);

  if (isExecute) {
    const embed = new MessageEmbed()
      .setTitle(t('discord:command.play.shikimori.title', {login}))
      .setColor(config.colors.info)
      .setURL(`${process.env.SHIKIMORI_URL}/${login}/list/anime/mylist/completed,watching/order-by/ranked`)
      .setDescription(description)
      .setThumbnail('https://i.ibb.co/PGFbnkS/Afk-W8-Fi-E-400x400.png')
      .setTimestamp();
    await interaction.editReply({embeds: [embed]});
  }
};

const reduceInfo = (acc, info) => ({
  info: {
    ...acc.info,
    duration: acc.info.duration + parseInt(info.duration),
  },
  songs: [
    ...(acc.songs ?? []),
    info,
  ],
});

const initialInfo = (userId, audios) => Promise.resolve({
  info: {
    length: audios.length,
    duration: 0,
    userId,
  },
});
