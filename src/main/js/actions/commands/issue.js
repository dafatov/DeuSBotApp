const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {Octokit} = require('@octokit/core');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setDescription(t('discord:command.issue.description'))
    .addStringOption(o => o
      .setName('type')
      .setDescription(t('discord:command.issue.option.type.description'))
      .setRequired(true)
      .addChoices(
        {name: t('discord:command.issue.option.type.choice.bug'), value: 'bug'},
        {name: t('discord:command.issue.option.type.choice.enhancement'), value: 'enhancement'},
        {name: t('discord:command.issue.option.type.choice.documentation'), value: 'documentation'},
      ))
    .addStringOption(o => o
      .setName('title')
      .setDescription(t('discord:command.issue.option.title'))
      .setRequired(true))
    .addStringOption(o => o
      .setName('details')
      .setDescription(t('discord:command.issue.option.details'))
      .setRequired(true)),
  async execute(interaction) {
    await issue(interaction);
  },
};

const issue = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_ISSUE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'issue'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('issue', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'issue'}),
    });
    return;
  }

  const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});
  const data = {
    type: interaction.options.getString('type'),
    title: interaction.options.getString('title'),
    details: interaction.options.getString('details'),
  };

  try {
    octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: process.env.GITHUB_LOGIN,
      repo: process.env.GITHUB_REPOSITORY,
      title: data.title,
      body: data.details,
      labels: [`<@${interaction.user.id}>`, data.type, 'discord-auto'],
    }).then(async response => {
      if (response.status === 201) {
        const embed = new MessageEmbed()
          .setColor(config.colors.info)
          .setTitle(t('discord:command.issue.completed.title', {title: data.title}))
          .setDescription(data.details)
          .setURL(response.data.html_url)
          .setTimestamp();
        await notify('issue', interaction, {embeds: [embed]});
        await audit({
          guildId: interaction.guildId,
          type: TYPES.INFO,
          category: CATEGORIES.COMMAND,
          message: t('inner:audit.command.issue'),
        });
      } else {
        throw t('inner:error.githubApi');
      }
    }).catch(e => {
      throw e;
    });
  } catch (e) {
    await notifyError('issue', e, interaction);
  }
};
