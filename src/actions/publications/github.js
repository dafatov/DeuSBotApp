const {MessageEmbed} = require('discord.js');
const {Octokit} = require('@octokit/core');
const config = require('../../configs/config');
const {t} = require('i18next');
const variablesDb = require('../../db/repositories/variables');

const PER_PAGE = 30;
const EVENTS_LISTEN = ['closed', 'reopened'];

module.exports = {
  async content(client) {
    const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});
    const lastIssueEvent = (await variablesDb.getAll())?.lastIssueEvent;
    let data = [];

    let page = 0;
    // eslint-disable-next-line no-loops/no-loops
    do {
      data = [
        ...data,
        ...(await octokit.request('/repos/{owner}/{repo}/issues/events', {
          owner: process.env.GITHUB_LOGIN,
          repo: process.env.GITHUB_REPOSITORY,
          per_page: PER_PAGE,
          page: ++page,
        })).data
          .filter(event => EVENTS_LISTEN.includes(event.event))
          .filter(event => new Date(event.created_at).getTime() > new Date(lastIssueEvent ?? 0).getTime()),
      ];
    } while (data.length >= PER_PAGE * page);

    return (await ((await client.guilds.fetch()).reduce(async (accumulator, guild) => {
      const users = (await (await guild.fetch()).members.fetch()).map(m => m.user);
      const events = data
        .filter(event => users
          .map(user => user.id)
          .includes(event.issue.labels
            .find(label => label.name
              .startsWith('<@')).name
            .slice(2, -1)))
        .sort((a, b) => new Date(a.created_at).getTime() < new Date(b.created_at).getTime()
          ? -1
          : 1)
        .slice(0, 10);
      const notifyingUsers = events
        .map(event => event.issue.labels
          .map(label => label.name)
          .find(name => name
            .startsWith('<@')))
        .filter((name, index, array) => array
          .indexOf(name) === index);

      if (events.length <= 0) {
        return accumulator;
      }

      return {
        //Без await не работает, так как функция в которой все происходит async
        ...(await accumulator),
        [(await guild.fetch()).id]: {
          content: notifyingUsers.join(''),
          embeds: events.map(event =>
            new MessageEmbed()
              .setColor(config.colors.info)
              .setTitle(t('discord:embed.publicist.github.title', {state: getStateLocale(event)}))
              .setDescription(t('discord:embed.publicist.github.description', {
                issue: event.issue,
                author: event.issue.labels.find(label => label.name.startsWith('<@')).name,
              }))
              .setTimestamp(new Date(event.created_at)),
          ),
        },
        variables: {
          lastIssueEvent: events[events.length - 1]?.created_at,
        },
      };
    }, {})));
  },
  condition(now) {
    return now.getMinutes() % 5 === 0;
  },
  async onPublished(_messages, variables) {
    if (variables?.lastIssueEvent) {
      await variablesDb.set('lastIssueEvent', variables.lastIssueEvent);
    }
  },
};
const getStateLocale = event => {
  if (event.event === 'closed') {
    if (event.issue.state_reason === 'completed') {
      return t('discord:embed.publicist.github.states.completed');
    } else if (event.issue.state_reason === 'not_planned') {
      return t('discord:embed.publicist.github.states.notPlanned');
    } else {
      return t('discord:embed.publicist.github.states.undefined');
    }
  } else if (event.event === 'reopened') {
    return t('discord:embed.publicist.github.states.reopened');
  } else {
    return t('discord:embed.publicist.github.states.undefined');
  }
};
