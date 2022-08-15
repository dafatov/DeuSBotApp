const {createCanvas, loadImage} = require('canvas');
const {MessageAttachment} = require('discord.js');
const {getStatusIcon} = require('./resources');
const {timeFormatMilliseconds} = require('./dateTime.js');
const config = require('../configs/config.js');
const {remained} = require('./calc');
const {hasLive} = require('../actions/player');
const {localeMonth} = require('./dateTime');

module.exports.createStatus = async (queue) => {
  const canvas = createCanvas(510, 40);
  const context = canvas.getContext('2d');

  let remainedTmp = `-${hasLive(queue)
    ? '<Никогда>'
    : timeFormatMilliseconds(remained(queue))}`;
  context.font = '24px sans-serif';

  context.fillStyle = '#2F3136';
  context.fillRect(0, 0, 49 + context.measureText(remainedTmp).width, 40);

  context.fillStyle = config.colors.info;
  context.fillRect(0, 0, 5, 40);

  const status = await loadImage(`./res/icons/${getStatusIcon(queue.nowPlaying)}.png`);
  context.drawImage(status, 9, 4, 32, 32);

  context.fillStyle = config.colors.info;
  context.fillText(remainedTmp, 45, 28);

  return new MessageAttachment(canvas.toBuffer(), 'status.png');
}

module.exports.createCalendar = async (guild, birthdays, monthDate, {month, year}) => {
  const {w, h} = {w: 1920, h: 1080};
  const canvas = createCanvas(w, h);
  const context = canvas.getContext("2d");

  const background = await loadImage('./res/backgrounds/cosmos.jpg');
  context.drawImage(background, 0, 0, w, h);

  context.fillStyle = config.colors.info;
  context.font = '72px sans-serif';
  const title = `${localeMonth(month)} ${year}`;
  context.fillText(title, (w - context.measureText(title).width) / 2, 23 * h / 160 - 40);

  for (let j = 0; j < 6; j++) {
    for (let i = 0; i < 7; i++) {
      const {x, y} = {x: (24 * i + 31) * w / 224, y: (24 * j + 27) * h / 192};

      if (monthDate.getMonth() === month) {
        context.globalAlpha = 0.25;

        const {wCard, hCard, r} = {wCard: (9 * w / 112), hCard: (9 * h / 80), r: 16};
        context.beginPath();
        context.moveTo(x + (wCard / 2), y);
        context.arcTo(x + wCard, y, x + wCard, y + (hCard / 2), r);
        context.arcTo(x + wCard, y + hCard, x + (wCard / 2), y + hCard, r);
        context.arcTo(x, y + hCard, x, y + (hCard / 2), r);
        context.arcTo(x, y, x + (wCard / 2), y, r);
        context.closePath();
        context.fill();
        context.fillText(monthDate.getDate().toString(), x + wCard - 4 - context.measureText(monthDate.getDate().toString()).width, y + hCard - 8);

        context.globalAlpha = 1;
        const users = birthdays.map(b => ({u: b.user_id, d: new Date(b.date)}))
          .filter(b => b.d.getDate() === monthDate.getDate()
            && b.d.getMonth() === monthDate.getMonth())
          .map(b => b.u)
        for (let k = 0; k < users.length; k++) {
          const avatar = await loadImage((await guild.members.fetch())
            .map(m => m.user)
            .find(u => u.id === users[k])
            .displayAvatarURL({format: 'jpg'}));

          context.save();
          context.beginPath();
          context.arc(x + 29, y + 54 * k + 29, 25, 0, Math.PI * 2, true);
          context.closePath();
          context.clip();
          context.drawImage(avatar, x + 4, y + 54 * k + 4, 50, 50);
          context.restore();
        }
      }
      monthDate.setDate(monthDate.getDate() + 1);
    }
  }
  return new MessageAttachment(canvas.toBuffer(), 'calendar.png');
}
