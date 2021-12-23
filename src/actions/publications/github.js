const {Octokit} = require("@octokit/core");
const config = require("../../configs/config");
const variablesDb = require("../../repositories/variables");
const {MessageEmbed} = require("discord.js");

const PER_PAGE = 30;
const EVENTS_LISTEN = ['closed', 'reopened'];
const LABELS_REJECT = ['duplicate', 'invalid', 'wontfix'];

module.exports = {
  async content(client) {
    const octokit = new Octokit({auth: config.githubToken});
    const lastIssueEvent = (await variablesDb.getAll())?.lastIssueEvent
    let data = [];

    let page = 0;
    do {
      data = [
        ...data,
        ...(await octokit.request('/repos/{owner}/{repo}/issues/events', {
          owner: config.githubLogin,
          repo: config.githubRepository,
          per_page: PER_PAGE,
          page: ++page,
        })).data
          .filter(event => EVENTS_LISTEN.includes(event.event))
          .filter(event => new Date(event.created_at).getTime() > new Date(lastIssueEvent ?? 0).getTime())
      ]
    } while (data.length >= PER_PAGE * page)

    return (await ((await client.guilds.fetch()).reduce(async (accumulator, guild) => {
      const users = (await (await guild.fetch()).members.fetch()).map(m => m.user);
      const events = data
        .filter(event => users
          .map(user => user.id)
          .includes(event.issue.labels
            .find(label => label.name
              .startsWith('<@')).name
            .slice(2, -1)))
        .sort((a, b) => new Date(a.created_at).getTime() < new Date(b.created_at).getTime() ? -1 : 1)
        .slice(0, 10)
      const notifyingUsers = events
        .map(event => event.issue.labels
          .map(label => label.name)
          .find(name => name
            .startsWith('<@')))
        .filter((name, index, array) => array
          .indexOf(name) === index)

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
              .setTitle(`Заявка ${getStateLocale(event)}`)
              .setDescription(`
                  **Наименование:** [${event.issue.title}](${event.issue.html_url})
                  **Описание:** ${event.issue.body}
                  **Автор:** ${event.issue.labels.find(label => label.name.startsWith('<@')).name}
              `)
              .setTimestamp(new Date(event.created_at))
          )
        },
        variables: {
          lastIssueEvent: events[events.length - 1]?.created_at
        }
      }
    }, {})))
  },
  async condition(now) {
    return now.getMinutes() % 5 === 0;
  },
  async onPublished(_messages, variables) {
    if (variables?.lastIssueEvent) {
      await variablesDb.set('lastIssueEvent', variables.lastIssueEvent);
    }
  }
}
const getStateLocale = (event) => {
  if (event.event === 'closed') {
    return event.issue.labels.map(label => label.name).some(name => LABELS_REJECT.includes(name)) ? 'отвергнута' : 'выполнена'
  } else if (event.event === 'reopened') {
    return 'переоткрыта';
  } else {
    return 'undefined'
  }
}