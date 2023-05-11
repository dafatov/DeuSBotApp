const {ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const {loop} = require('../actions/commands/loop');
const {pause} = require('../actions/commands/pause');
const {skip} = require('../actions/commands/skip');
const {t} = require('i18next');

module.exports.Pagination = {
  getComponent: (start, count, dataLength) => new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('first')
        .setLabel(t('common:pagination.first'))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(start <= 0),
      new ButtonBuilder()
        .setCustomId('previous')
        .setLabel(t('common:pagination.previous'))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(start <= 0),
      new ButtonBuilder()
        .setCustomId('update')
        .setLabel(t('common:pagination.update'))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel(t('common:pagination.next'))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(start + count >= dataLength),
      new ButtonBuilder()
        .setCustomId('last')
        .setLabel(t('common:pagination.last'))
        .setStyle(ButtonStyle.Primary)
        .setDisabled(start + count >= dataLength),
    ),
  update: (interaction, {start, count}, dataLength) => {
    const pagination = ActionRowBuilder.from(interaction.message.components[0]);

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

    pagination.components.forEach(button => {
      if (button.data.custom_id === 'next') {
        button.setDisabled(start + count >= dataLength);
      }
      if (button.data.custom_id === 'previous') {
        button.setDisabled(start <= 0);
      }
      if (button.data.custom_id === 'first') {
        button.setDisabled(start <= 0);
      }
      if (button.data.custom_id === 'last') {
        button.setDisabled(start + count >= dataLength);
      }
    });

    return {start, pagination};
  },
  getFooter: (start, count, dataLength) => t('common:pagination.footer', {
    start: Math.min(start + 1, dataLength),
    finish: Math.min(start + count, dataLength),
    total: dataLength,
    step: count,
  }),
  getPages: embed => {
    const array = embed.data.footer.text.split(' ');

    return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
  },
};

module.exports.Control = {
  getComponent: nowPlaying => new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('pause')
        .setLabel(nowPlaying?.isPause
          ? t('common:player.toResume')
          : t('common:player.toPause'))
        .setStyle(nowPlaying?.isPause
          ? ButtonStyle.Success
          : ButtonStyle.Danger)
        .setDisabled(nowPlaying?.song.isLive),
      new ButtonBuilder()
        .setCustomId('skip')
        .setLabel(t('common:player.skip'))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('loop')
        .setLabel(nowPlaying?.isLoop
          ? t('common:player.toUnloop')
          : t('common:player.toLoop'))
        .setStyle(nowPlaying?.isLoop
          ? ButtonStyle.Danger
          : ButtonStyle.Success)
        .setDisabled(nowPlaying?.song.isLive),
    ),
  get update() {
    return async (interaction, nowPlaying) => {
      const control = nowPlaying?.song
        ? this.getComponent(nowPlaying)
        : ActionRowBuilder.from(interaction.message.components[1]);

      if (interaction.customId === 'pause') {
        await pause(interaction);
      }
      if (interaction.customId === 'skip') {
        await skip(interaction);
      }
      if (interaction.customId === 'loop') {
        await loop(interaction);
      }

      control.components.forEach(button => {
        if (button.data.custom_id === 'pause') {
          button.setLabel(nowPlaying?.isPause
            ? t('common:player.toResume')
            : t('common:player.toPause'));
          button.setStyle(nowPlaying?.isPause
            ? ButtonStyle.Success
            : ButtonStyle.Danger);
          button.setDisabled(nowPlaying?.song?.isLive ?? true);
        }
        if (button.data.custom_id === 'loop') {
          button.setLabel(nowPlaying?.isLoop
            ? t('common:player.toUnloop')
            : t('common:player.toLoop'));
          button.setStyle(nowPlaying?.isLoop
            ? ButtonStyle.Danger
            : ButtonStyle.Success);
          button.setDisabled(nowPlaying?.song?.isLive ?? true);
        }
      });

      return control;
    };
  },
};
