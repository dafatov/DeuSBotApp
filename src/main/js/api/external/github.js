const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {Octokit} = require('@octokit/core');
const {audit} = require('../../actions/auditor');
const {stringify} = require('../../utils/string');

const PER_PAGE = 30;
const EVENTS_LISTEN = ['closed', 'reopened'];

module.exports.createIssue = (user, {type, title, details: body}) =>
  new Octokit({auth: process.env.GITHUB_TOKEN})
    .request('POST /repos/{owner}/{repo}/issues', {
      owner: process.env.GITHUB_LOGIN,
      repo: process.env.GITHUB_REPOSITORY,
      title,
      body,
      labels: [user.toString(), type, 'discord-auto'],
    }).then(response => response.data);

module.exports.getEvents = async (afterTimestamp = 0) => {
  const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});
  let partialData;
  let data = [];
  let page = 0;

  try {
    // eslint-disable-next-line no-loops/no-loops
    do {
      partialData = await octokit.request('GET /repos/{owner}/{repo}/issues/events', {
        owner: process.env.GITHUB_LOGIN,
        repo: process.env.GITHUB_REPOSITORY,
        per_page: PER_PAGE,
        page: ++page,
      }).then(partial => partial.data);

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
      category: CATEGORIES.API,
      message: stringify(e),
    });
  }

  return data;
};
