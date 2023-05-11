const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {getAll, set} = require('../../db/repositories/variables');
const {EmbedBuilder} = require('discord.js');
const {Octokit} = require('@octokit/core');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {ifPromise} = require('../../utils/promises');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');

const PER_PAGE = 30;
const EVENTS_LISTEN = ['closed', 'reopened'];

module.exports = {
  content: async client => {
    const lastIssueEvent = (await getAll())?.lastIssueEvent;
    const data = await getEventsData(lastIssueEvent);

    return client.guilds.fetch()
      .then(guilds => guilds.reduce((accPromise, guild) => guild.fetch()
        .then(guild => guild.members.fetch()
          .then(members => members.map(member => member.user))
          .then(users => getEvents(data, users))
          .then(events => ifPromise(events.length > 0,
            accPromise.then(acc => ({
              ...(acc ?? {}),
              [guild.id]: {
                content: getNotifyingUsers(events),
                embeds: events.map(event =>
                  new EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle(t('discord:embed.publicist.github.title', {state: getStateLocale(event)}))
                    .setDescription(t('discord:embed.publicist.github.description', {
                      issue: event.issue,
                      author: event.issue.labels
                        .find(label => label.name.startsWith('<@')).name,
                    }))
                    .setTimestamp(new Date(event.created_at)),
                ),
              },
              variables: {
                lastIssueEvent: events[events.length - 1]?.created_at,
              },
            })), accPromise,
          ))), Promise.resolve()))
      .catch(error => audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.PUBLICIST,
        message: stringify(error),
      }));
  },
  condition: now => now.getMinutes() % 5 === 0,
  onPublished: async (_messages, variables) => {
    if (variables?.lastIssueEvent) {
      await set('lastIssueEvent', variables.lastIssueEvent);
    }
  },
};

const getEventsData = async (afterTimestamp = 0) => {
  const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});
  let partialData;
  let data = [];
  let page = 0;

  try {
    // eslint-disable-next-line no-loops/no-loops
    do {
      partialData = (await octokit.request('/repos/{owner}/{repo}/issues/events', {
        owner: process.env.GITHUB_LOGIN,
        repo: process.env.GITHUB_REPOSITORY,
        per_page: PER_PAGE,
        page: ++page,
      })).data;

      data = [
        ...data,
        ...partialData
          .filter(event => EVENTS_LISTEN.includes(event.event))
          .filter(event => new Date(event.created_at).getTime() > new Date(afterTimestamp).getTime()),
      ];
    } while (partialData.length >= PER_PAGE);
  } catch (e) {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.PUBLICIST,
      message: stringify(e),
    });
  }

  return data;
};

const getEvents = (data, users) => data
  .filter(event => users
    .map(user => user.id)
    .includes(event.issue.labels
      .find(label => label.name
        .startsWith('<@'))?.name
      .slice(2, -1)))
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

const getNotifyingUsers = events => events
  .map(event => event.issue.labels
    .map(label => label.name)
    .find(name => name
      .startsWith('<@')))
  .filter((name, index, array) => array
    .indexOf(name) === index)
  .join('');

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
