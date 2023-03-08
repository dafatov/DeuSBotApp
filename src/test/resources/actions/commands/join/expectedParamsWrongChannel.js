const {MessageEmbed} = require('discord.js');

module.exports = interaction => [
  'join', interaction, {
    embeds: [
      new MessageEmbed({
        color: 16746496,
        description: 'Ты хотел, чтобы я пришел? Мог бы и сам зайти для приличия.\nЯ решил, что не стоит заходить в какой-то жалкий канал, когда никто не сможет осознать все мое величие',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Канал не смог меня принять',
      }),
    ],
  }
];
