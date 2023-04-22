const {MessageActionRow, MessageButton} = require('discord.js');
const {loop} = require('../actions/commands/loop');
const {pause} = require('../actions/commands/pause');
const {skip} = require('../actions/commands/skip');
const {t} = require('i18next');

module.exports.Pagination = {
  getComponent: (start, count, dataLength) => new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('first')
        .setLabel(t('common:pagination.first'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('previous')
        .setLabel(t('common:pagination.previous'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('update')
        .setLabel(t('common:pagination.update'))
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('next')
        .setLabel(t('common:pagination.next'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= dataLength),
      new MessageButton()
        .setCustomId('last')
        .setLabel(t('common:pagination.last'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= dataLength),
    ),
  update: (interaction, {start, count}, dataLength) => {
    if (interaction.customId === 'next') {
      start += count;
    }
    if (interaction.customId === 'previous') {
      start -= count;
    }
    if (interaction.customId === 'update') {
      start = Math.min(start, count * Math.floor(Math.max(0, dataLength - 1) / count));
    }
    if (interaction.customId === 'first') {
      start = 0;
    }
    if (interaction.customId === 'last') {
      start = count * Math.floor((dataLength - 1) / count);
    }

    interaction.message.components[0].components.forEach(b => {
      if (b.customId === 'next') {
        b.setDisabled(start + count >= dataLength);
      }
      if (b.customId === 'previous') {
        b.setDisabled(start <= 0);
      }
      if (b.customId === 'first') {
        b.setDisabled(start <= 0);
      }
      if (b.customId === 'last') {
        b.setDisabled(start + count >= dataLength);
      }
    });

    return start;
  },
  getFooter: (start, count, dataLength) => t('common:pagination.footer', {
    start: Math.min(start + 1, dataLength),
    finish: Math.min(start + count, dataLength),
    total: dataLength,
    step: count,
  }),
  getPages: footer => {
    const array = footer.split(' ');

    return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
  },
};

module.exports.Control = {
  getComponent: (interaction, nowPlaying) => new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('pause')
        .setLabel(nowPlaying?.isPause
          ? t('common:player.toResume')
          : t('common:player.toPause'))
        .setStyle(nowPlaying?.isPause
          ? 'SUCCESS'
          : 'DANGER')
        .setDisabled(nowPlaying?.song.isLive),
      new MessageButton()
        .setCustomId('skip')
        .setLabel(t('common:player.skip'))
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('loop')
        .setLabel(nowPlaying?.isLoop
          ? t('common:player.toUnloop')
          : t('common:player.toLoop'))
        .setStyle(nowPlaying?.isLoop
          ? 'DANGER'
          : 'SUCCESS')
        .setDisabled(nowPlaying?.song.isLive),
    ),
  update: async (interaction, Control, nowPlaying) => {
    if (interaction.customId === 'pause') {
      await pause(interaction);
    }
    if (interaction.customId === 'skip') {
      await skip(interaction);
    }
    if (interaction.customId === 'loop') {
      await loop(interaction);
    }

    Control.components.forEach(b => {
      if (b.customId === 'pause') {
        b.setLabel(nowPlaying?.isPause
          ? t('common:player.toResume')
          : t('common:player.toPause'));
        b.setStyle(nowPlaying?.isPause
          ? 'SUCCESS'
          : 'DANGER');
        b.setDisabled(nowPlaying?.song?.isLive ?? true);
      }
      if (b.customId === 'loop') {
        b.setLabel(nowPlaying?.isLoop
          ? t('common:player.toUnloop')
          : t('common:player.toLoop'));
        b.setStyle(nowPlaying?.isLoop
          ? 'DANGER'
          : 'SUCCESS');
        b.setDisabled(nowPlaying?.song?.isLive ?? true);
      }
    });
  },
};
