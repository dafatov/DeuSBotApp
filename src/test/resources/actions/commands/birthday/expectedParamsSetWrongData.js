const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'Ответы кроются в вещах, которые мы считаем естественными. Кто же ожидал, что, если соединить телефон и микроволновку, получится машина времени?',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Некорректная дата рождения. Попробуй еще разочек~',
      }),
    ],
  }
];
