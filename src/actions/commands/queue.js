const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const {logGuild} = require("../../utils/logger");
const {timeFormatSeconds, timeFormatmSeconds} = require("../../utils/dateTime.js");
const {notify, notifyError} = require("../commands");
const config = require("../../configs/config.js");
const progressBar = require('string-progressbar');
const {escaping, parseAnisonResponseOnAir} = require("../../utils/string.js");
const {createStatus} = require("../../utils/attachments");
const {pause} = require("./pause");
const {skip} = require("./skip");
const {loop} = require("./loop");
const {getQueue} = require("../player");
const axios = require('axios').default;

let {start, count} = {start: 0, count: 5};

module.exports = {
    data: new SlashCommandBuilder()
      .setName('queue')
      .setDescription('Отображение очереди композиций на воспроизведение'),
    async execute(interaction) {
        await queue(interaction);
    },
    async listener(interaction) {
        await onQueue(interaction);
    }
}

const queue = async (interaction) => {
    const songs = getQueue(interaction.guildId).songs;

    if (songs.length === 0 && !getQueue(interaction.guildId).nowPlaying.song) {
        const embed = new MessageEmbed()
          .setColor(config.colors.warning)
          .setTitle('Мир музыки пуст')
          .setDescription(`Может ли существовать мир без музыки? Каким бы он был...
                Ах да! Таким, в котором сейчас живешь ты~~`)
          .setTimestamp();
        await notify('queue', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[queue]: Вывести очередь не вышло: плеер не играет и очередь пуста`);
        return;
    }

    if (songs.length !== 0 && !getQueue(interaction.guildId).nowPlaying.song) {
        const embed = new MessageEmbed()
          .setColor(config.colors.warning)
          .setTitle('Да, кто ты такой, чтобы вмешиваться в мою работу!!!')
          .setDescription(`Бот в процессе формирования плейлиста и может не отвечать на сообщения`)
          .setTimestamp();
        await notify('queue', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[queue]: Вывести очередь не вышло: плеер не играет, а очередь не пуста`);
        return;
    }

    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setFooter(`${Math.min(start + 1, songs.length)} - ${Math.min(start + count, songs.length)} из ${songs.length} по ${count}`);

    embed.setFields(songs
      .slice(start, count)
      .map((song, i) => ({
          name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
          value: `\`${song.isLive ? '<Стрим>' : timeFormatSeconds(song.length)}\`—_\`${song.author.username}\`_`
      })));

    embed.setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
      .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
      .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
      .setTimestamp();
    if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
        embed.setDescription(`<Стрим>
            \u200B\n`);
        if (getQueue(interaction.guildId).nowPlaying.song.type === 'radio') {
            let response = await axios.get('https://anison.fm/status.php?widget=true');
            let onAir = parseAnisonResponseOnAir(response.data.on_air);
            embed.setDescription(`Источник: **${escaping(onAir.source)}**
                Композиция: **${escaping(onAir.title)}**
                Осталось: **${timeFormatSeconds(response.data.duration)}**`)
        }
    } else {
        const barString = progressBar.filledBar(getQueue(interaction.guildId).nowPlaying.song.length * 1000,
          getQueue(interaction.guildId).nowPlaying.resource.playbackDuration);
        embed.setDescription(`\`${timeFormatmSeconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(
          getQueue(interaction.guildId).nowPlaying.song.length)}\`—_\`${getQueue(interaction.guildId).nowPlaying.song.author.username}\`_
            ${barString[0]} [${Math.round(barString[1])}%]\n`);
    }

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('first')
          .setLabel('|<')
          .setStyle('PRIMARY')
          .setDisabled(start <= 0),
        new MessageButton()
          .setCustomId('previous')
          .setLabel('<')
          .setStyle('PRIMARY')
          .setDisabled(start <= 0),
        new MessageButton()
          .setCustomId('update')
          .setLabel('Обновить')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('next')
          .setLabel('>')
          .setStyle('PRIMARY')
          .setDisabled(start + count >= songs.length),
        new MessageButton()
          .setCustomId('last')
          .setLabel('>|')
          .setStyle('PRIMARY')
          .setDisabled(start + count >= songs.length),
      );

    const control = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('pause')
          .setLabel(getQueue(interaction.guildId).nowPlaying?.isPause ? 'Возобновить' : 'Приостановить')
          .setStyle(getQueue(interaction.guildId).nowPlaying?.isPause ? 'SUCCESS' : 'DANGER')
          .setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive),
        new MessageButton()
          .setCustomId('skip')
          .setLabel('Пропустить')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('loop')
          .setLabel(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'Отциклить' : 'Зациклить')
          .setStyle(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'DANGER' : 'SUCCESS')
          .setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive),
      );

    const status = await createStatus(getQueue(interaction.guildId));
    try {
        await notify('queue', interaction, {files: [status], embeds: [embed], components: [row, control]});
        logGuild(interaction.guildId, `[queue]: Список композиций успешно выведен`);
    } catch (e) {
        await notifyError('queue', e, interaction);
    }
};

const onQueue = async (interaction) => {
    const songs = getQueue(interaction.guildId).songs;

    let embed = interaction.message.embeds[0];
    let row = interaction.message.components[0];
    let control = interaction.message.components[1];
    let {start, count} = calcPages(embed.footer.text);

    if (interaction.customId === 'next') {
        start += count;
    }
    if (interaction.customId === 'previous') {
        start -= count;
    }
    if (interaction.customId === 'update') {
        start = Math.min(start, count * Math.floor((songs.length - 1) / count));
    }
    if (interaction.customId === 'first') {
        start = 0;
    }
    if (interaction.customId === 'last') {
        start = count * Math.floor((songs.length - 1) / count);
    }

    if (interaction.customId === 'pause') {
        await pause(interaction);
    }
    if (interaction.customId === 'skip') {
        await skip(interaction);
    }
    if (interaction.customId === 'loop') {
        await loop(interaction);
    }

    if (songs.length === 0 && !getQueue(interaction.guildId).nowPlaying.song) {
        const embed = new MessageEmbed()
          .setColor(config.colors.warning)
          .setTitle('Мир музыки пуст')
          .setDescription(`Может ли существовать мир без музыки? Каким бы он был...
                Ах да! Таким, в котором сейчас живешь ты~~`)
          .setTimestamp();
        await interaction.message.removeAttachments();
        await interaction.update({embeds: [embed], components: []});
        logGuild(interaction.guildId, `[queue]: Вывести очередь не вышло: плеер не играет и очередь пуста`);
        return;
    }

    row.components.forEach(b => {
        if (b.customId === 'next') {
            b.setDisabled(start + count >= songs.length);
        }
        if (b.customId === 'previous') {
            b.setDisabled(start <= 0);
        }
        if (b.customId === 'first') {
            b.setDisabled(start <= 0);
        }
        if (b.customId === 'last') {
            b.setDisabled(start + count >= songs.length);
        }
    });
    control.components.forEach(b => {
        if (b.customId === 'pause') {
            b.setLabel(getQueue(interaction.guildId).nowPlaying?.isPause ? 'Возобновить' : 'Приостановить');
            b.setStyle(getQueue(interaction.guildId).nowPlaying?.isPause ? 'SUCCESS' : 'DANGER');
            b.setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive);
        }
        if (b.customId === 'skip') {
        }
        if (b.customId === 'loop') {
            b.setLabel(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'Отциклить' : 'Зациклить');
            b.setStyle(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'DANGER' : 'SUCCESS');
            b.setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive);
        }
    });

    embed.setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
      .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
      .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
      .setTimestamp()
      .setFields(songs
        .slice(start, start + count)
        .map((song, i) => ({
            name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
            value: `\`${song.isLive ? '<Стрим>' : timeFormatSeconds(song.length)}\`—_\`${song.author.username}\`_`
        })))
      //Данные количества на странице (count) беруться из footer'а. Да, костыль
      .setFooter(`${start + 1} - ${Math.min(start + count, songs.length)} из ${songs.length} по ${count}`);
    if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
        embed.setDescription(`<Стрим>
                \u200B\n`);
        if (getQueue(interaction.guildId).nowPlaying.song.type === 'radio') {
            let response = await axios.get('https://anison.fm/status.php?widget=true');
            let onAir = parseAnisonResponseOnAir(response.data.on_air);
            embed.setDescription(`Источник: **${escaping(onAir.source)}**
                    Композиция: **${escaping(onAir.title)}**
                    Осталось: **${timeFormatSeconds(response.data.duration)}**`)
        }
    } else {
        const barString = progressBar.filledBar(getQueue(interaction.guildId).nowPlaying.song.length * 1000,
          getQueue(interaction.guildId).nowPlaying.resource.playbackDuration);
        embed.setDescription(`\`${timeFormatmSeconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(
          getQueue(interaction.guildId).nowPlaying.song.length)}\`—_\`${getQueue(interaction.guildId).nowPlaying.song.author.username}\`_
                ${barString[0]} [${Math.round(barString[1])}%]\n`);
    }

    const status = await createStatus(getQueue(interaction.guildId));
    try {
        await interaction.message.removeAttachments();
        await interaction.update({files: [status], embeds: [embed], components: [row, control]});
    } catch (e) {
        await notifyError('queue', e, interaction);
    }
}

function calcPages(footer) {
    let array = footer.split(' ');
    return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
}