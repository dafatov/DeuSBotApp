const {MessageActionRow, MessageButton} = require('discord.js');
const {t} = require('i18next');

module.exports.getPagination = (start, count, dataLength) => {
  return new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('first')
        .setLabel(t('common:player.first'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('previous')
        .setLabel(t('common:player.previous'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('update')
        .setLabel(t('common:player.update'))
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('next')
        .setLabel(t('common:player.next'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= dataLength),
      new MessageButton()
        .setCustomId('last')
        .setLabel(t('common:player.last'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= dataLength),
    );
};

module.exports.executePagination = (interaction, {start, count}, dataLength) => {
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
};

module.exports.getPaginationPages = footer => {
  const array = footer.split(' ');
  return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
};
