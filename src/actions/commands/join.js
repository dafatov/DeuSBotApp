const { log } = require("../../utils/logger.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel } = require("@discordjs/voice");
const { MessageEmbed } = require("discord.js");
const { notify, notifyError } = require("../commands.js");

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
    let voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
        const embed = new MessageEmbed()
            .setColor('#ffff00')
            .setTitle('Канал не смог меня принять')
            .setDescription(`Ты хотел, чтобы я пришел? Мог бы и сам зайти для приличия.
                Я решил, что не стоит заходить в какой-то жалкий канал, когда никто не сможет осознать все мое величие`)
            .setTimestamp();
        await notify('join', interaction, {embeds: [embed]});
        log(`[join] Пригласить бота можно только в свой голосовой канал`);
        return;
    }

    if (interaction.client.queue.connection) return;

    try {
        interaction.client.queue.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            debug: true
        })
        interaction.client.queue.voiceChannel = voiceChannel;
        const embed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle('Я зашел')
            .setDescription(`Зашел к тебе в войс. Теперь ты сможешь погреться во всем моем великолепии и послушать музыку для ушей.
            Канал же ${voiceChannel.name} называется? О нем теперь будут слагать легенды`);
        await notify('join', interaction, {embeds: [embed]});
        log(`[Join] Бот успешно приглашен в канал ${voiceChannel.name}`);
    } catch(e) {
        notifyError('join', e, interaction);
    }
}

