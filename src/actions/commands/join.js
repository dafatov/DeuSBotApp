const {logGuild} = require("../../utils/logger.js")
const {SlashCommandBuilder} = require("@discordjs/builders");
const {joinVoiceChannel, VoiceConnectionStatus} = require("@discordjs/voice");
const {MessageEmbed} = require("discord.js");
const {notify, notifyError} = require("../commands.js");
const config = require("../../configs/config.js");
const player = require("../player.js");

module.exports = {
    data: new SlashCommandBuilder()
      .setName('join')
      .setDescription('Пригласить бота к текущему голосовому каналу'),
    async execute(interaction) {
        await module.exports.join(interaction);
    },
    async listener(interaction) {}
}

module.exports.join = async (interaction) => {
    if (player.getQueue(interaction.guildId)?.connection && player.getQueue(interaction.guildId)?.connection?._state.status !==
      VoiceConnectionStatus.Destroyed) {
        return;
    }

    let voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        const embed = new MessageEmbed()
          .setColor(config.colors.warning)
          .setTitle('Канал не смог меня принять')
          .setDescription(`Ты хотел, чтобы я пришел? Мог бы и сам зайти для приличия.
                Я решил, что не стоит заходить в какой-то жалкий канал, когда никто не сможет осознать все мое величие`)
          .setTimestamp();
        await notify('join', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[join]: Пригласить бота можно только в свой голосовой канал`);
        return;
    }

    try {
        player.getQueue(interaction.guildId).connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        })
        player.getQueue(interaction.guildId).voiceChannel = voiceChannel;
        const embed = new MessageEmbed()
          .setColor(config.colors.info)
          .setTitle('Я зашел')
          .setDescription(`Зашел к тебе в войс. Теперь ты сможешь погреться во всем моем великолепии и послушать музыку для ушей.
            Канал же ${voiceChannel.name} называется? О нем теперь будут слагать легенды`);
        await notify('join', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[join]: Бот успешно приглашен в канал ${voiceChannel.name}`);
    } catch (e) {
        await notifyError('join', e, interaction);
    }
}

