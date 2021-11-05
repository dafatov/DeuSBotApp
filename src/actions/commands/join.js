const {log, error} = require("../../utils/logger.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel } = require("@discordjs/voice");
const { MessageEmbed } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Пригласить бота к текущему голосовому каналу'),
    async execute(interaction) {
        await join(interaction);
    },
    async listener(interaction) {}
}

const join = async (interaction) => {
    let voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
        const embed = new MessageEmbed()
                    .setColor('#ffff00')
                    .setTitle('Бот не смог')
                    .setDescription('Пригласить бота можно только в свой голосовой канал')
                    .setTimestamp();

        await interaction.reply({embeds: [embed]});
        log(`[Join] Пригласить бота можно только в свой голосовой канал`);
        return;
    }

    try {
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        })
        const embed = new MessageEmbed()
                        .setColor('#ff0000')
                        .setTitle('Бот присоединился')
                        .setDescription(`Бот успешно приглашен в канал ${voiceChannel.name}`);

        await interaction.reply({embeds: [embed]});
        log(`[Join] Бот успешно приглашен в канал ${voiceChannel.name}`);
    } catch(e) {
        const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Ошибка')
            .setTimestamp()
            .setDescription(e);
        await interaction.reply({embeds: [embed]});
        log(`[Join]:\n${e}`);
        return;
    }
}