const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageEmbed} = require("discord.js");
const {logGuild} = require("../../utils/logger");
const {notify} = require("../commands");
const config = require("../../configs/config.js");
const {timeFormatSeconds, timeFormatmSeconds} = require("../../utils/dateTime");
const progressBar = require('string-progressbar');
const {escaping} = require("../../utils/string.js");
const {createStatus} = require("../../utils/attachments");
const {getQueue} = require("../player");
const {getRadios} = require("../radios");

module.exports = {
    data: new SlashCommandBuilder()
      .setName('np')
      .setDescription('Отобразить текущую композицию'),
    async execute(interaction) {
        await np(interaction);
    },
    async listener(interaction) {}
}

const np = async (interaction) => {
    let info = getQueue(interaction.guildId).nowPlaying;

    if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player || !info.song) {
        const embed = new MessageEmbed()
          .setColor(config.colors.warning)
          .setTitle('Так ничего и не играло')
          .setDescription(`Как ты жалок... Это же уже было когда ты пытался пропустить, верно?~
                Теперь ты повторяешь это в при получении текущей композиции. Или это было в другом порядке?`)
          .setTimestamp();
        await notify('np', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[np]: Пропустить композицию не вышло: плеер не играет`);
        return;
    }

    if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
      && getQueue(interaction.guildId).connection.joinConfig.channelId !==
      interaction.member.voice.channel.id) {
        const embed = new MessageEmbed()
          .setColor(config.colors.warning)
          .setTitle('Канал не тот')
          .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь...
                Дежавю? Разве этого же не было в пропуске композиции? Или у этого времени другой порядок...`)
          .setTimestamp();
        await notify('np', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[np]: Пропустить композицию не вышло: не совпадают каналы`);
        return;
    }

    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(escaping(info.song.title))
      .setURL(info.song.url)
      .setThumbnail(info.song.preview)
      .setTimestamp()
      .setFooter(`Играет композиция от ${info.song.author.username}`, info.song.author.displayAvatarURL());
    if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
        embed.setDescription(`<Стрим>
                \u200B\n`);
        if (getQueue(interaction.guildId).nowPlaying.song.type === 'radio') {
            embed.setDescription(await getRadios().get(info.song.title).getInfo());
        }
    } else {
        const barString = progressBar.filledBar(getQueue(interaction.guildId).nowPlaying.song.length * 1000,
          getQueue(interaction.guildId).nowPlaying.resource.playbackDuration);
        embed.setDescription(`\`${timeFormatmSeconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(
          getQueue(interaction.guildId).nowPlaying.song.length)}\`—_\`${getQueue(interaction.guildId).nowPlaying.song.author.username}\`_
                ${barString[0]} [${Math.round(barString[1])}%]\n`);
    }
    const status = await createStatus(getQueue(interaction.guildId));
    await notify('np', interaction, {files: [status], embeds: [embed]});
    logGuild(interaction.guildId, `[np]: Успешно выведана текущая композиция`);
}