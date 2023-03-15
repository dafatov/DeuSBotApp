const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {MessageAttachment, MessageEmbed} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getCommandName, stringify} = require('../../utils/string');
const {notify, updateCommands} = require('../commands.js');
const RandomOrg = require('random-org');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const axios = require('axios').default;
const config = require('../../configs/config.js');
const db = require('../../db/repositories/users.js');
const {escaping} = require('../../utils/string.js');
const {notifyForbidden} = require('../commands');
const {searchSongs} = require('./play.js');
const {t} = require('i18next');
const xml2js = require('xml2js');

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
          .setDescription(t('discord:command.shikimori.play.option.nickname.description'))
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
        .setDescription('esf')
        .addStringOption(s => s
          .setName('nickname')
          .setDescription(t('discord:command.shikimori.play.option.nickname.description'))
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

  if (count < 1 || count > MAX_COUNT) {
    if (isExecute) {
      const embed = new MessageEmbed()
        .setColor(config.colors.warning)
        .setTitle(t('discord:command.shikimori.play.unboundCount.title'))
        .setDescription(t('discord:command.shikimori.play.unboundCount.description', {max: MAX_COUNT}))
        .setTimestamp();
      await notify(getCommandName(__filename), interaction, {embeds: [embed]});
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
  await axios.get(`https://shikimori.one/${login}/list_export/animes.json`)
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
      await notify(getCommandName(__filename), interaction, {embeds: [embed]});
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
    await notify('shikimori', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shikimori.play.creating.success'),
  });
  await searchSongs(interaction, isExecute, audios, login);
  return {login, count: audios.length};
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHIKIMORI_SET)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const login = interaction.options.getString('login');

  try {
    await axios.get(`https://shikimori.one/${login}`);
  } catch (e) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.shikimori.set.nonExistLogin.title'))
      .setDescription(t('discord:command.shikimori.set.nonExistLogin.description', {login}))
      .setTimestamp();
    await notify(getCommandName(__filename), interaction, {embeds: [embed]});
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
  await notify(getCommandName(__filename), interaction, {embeds: [embed]});
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
  await notify(getCommandName(__filename), interaction, {embeds: [embed]});
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

  const attachment = await axios.get(`https://shikimori.one/${nickname}/list_export/animes.xml`)
    .then(response => xml2js.parseStringPromise(response.data))
    .then(animeList => ({
      myanimelist: {
        ...animeList.myanimelist,
        anime: animeList.myanimelist.anime.map(anime => ({
          my_start_date: ['0000-00-00'],
          my_finish_date: ['0000-00-00'],
          ...anime,
        })),
      },
    }))
    .then(animeList => new xml2js.Builder().buildObject(animeList))
    .then(xml => new MessageAttachment(Buffer.from(xml, 'utf8'), `${nickname}_animes.xml`));

  await notify(getCommandName(__filename), interaction, {files: [attachment]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shikimori.remove.completed'),
  });
};
