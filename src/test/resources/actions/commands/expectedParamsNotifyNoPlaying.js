const {MessageEmbed} = require('discord.js');
const interaction = require('../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16746496,
        description: 'Может ли существовать мир без музыки? Каким бы он был...\nАх да! Таким, в котором сейчас живешь ты~~',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Мир музыки пуст',
      }),
    ],
  },
];
