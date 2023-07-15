const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {getAll, set} = require('../../db/repositories/variables');
const {EmbedBuilder} = require('discord.js');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getEvents} = require('../../api/external/github');
const {ifPromise} = require('../../utils/promises');
const last = require('lodash/last');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  content: client => getAll()
    .then(({lastIssueEvent}) => getEvents(lastIssueEvent))
    .then(data => client.guilds.fetch()
      .then(guilds => guilds.reduce((accPromise, guild) => guild.fetch()
        .then(guild => guild.members.fetch()
          .then(members => members.map(member => member.user))
          .then(users => data
            .filter(getFilterByUsers(users))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
          .then(events => ifPromise(events.length > 0, () => accPromise.then(acc => ({
            ...acc,
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
              lastIssueEvent: last(events)?.created_at,
            },
          }))))), Promise.resolve({}))))
    .catch(error => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.PUBLICIST,
      message: stringify(error),
    })),
  condition: now => Promise.resolve(now.getMinutes() % 5 === 0),
  onPublished: (_messages, variables) => ifPromise(variables?.lastIssueEvent, () => set('lastIssueEvent', variables.lastIssueEvent)),
};

const getFilterByUsers = users => event => users
  .map(user => user.id)
  .includes(event.issue.labels
    .find(label => label.name
      .startsWith('<@'))?.name
    .slice(2, -1));

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
