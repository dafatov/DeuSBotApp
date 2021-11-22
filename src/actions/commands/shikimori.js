const { SlashCommandBuilder } = require("@discordjs/builders");
const axios = require('axios').default;
const { searchSongs } = require("../commands/play.js");
const { log, error } = require("../../utils/logger.js");
const { MessageEmbed } = require("discord.js");
const config = require("../../configs/config.js");
const { notify, notifyError, update } = require("../commands.js");
const db = require("../../repositories/users.js");
const { escaping } = require("../../utils/string.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shikimori')
        .setDescription('Команды взаимодействия с shikimori')
        .addSubcommand(s => s
            .setName('play')
            .setDescription('Проигрывает случайную композцицию случайного аниме из списка просмотрено и смотрю с шикимори')
            .addStringOption(s => s
                .setName('nickname')
                .setDescription('Имя пользователя в рамках системы DeuS')
                .setRequired(true))
            .addIntegerOption(i => i
                .setName('count')
                .setDescription('Количество композиций')
                .setRequired(false)))
        .addSubcommand(s => s
            .setName('set')
            .setDescription('Добавление или изменение аккаунтов shikimori')
            .addStringOption(o => o
                .setName('login')
                .setDescription('Логин с шикимори')
                .setRequired(true))
            .addStringOption(s => s
                .setName('nickname')
                .setDescription('Имя в рамках системы DeuS')
                .setRequired(true)))
        .addSubcommand(s => s
            .setName('remove')
            .setDescription('Удаление аккаунта shikimori по логину')
            .addStringOption(s => s
                .setName('login')
                .setDescription('Логин с шикимори')
                .setRequired(true))),
    async execute(interaction) {
        await shikimori(interaction);
    },
    async listener(interaction) {},
    async update(interaction) {
        await update(interaction);
    }
}


const shikimori = async (interaction) => {
    if (interaction.options.getSubcommand() === 'play') {
        await play(interaction);
    } else if (interaction.options.getSubcommand() === 'set') {
        await set(interaction);
    } else if (interaction.options.getSubcommand() === 'remove') {
        await remove(interaction);
    }
}

const play = async (interaction) => {
    let login = interaction.options.getString('nickname');
    let animes;

    try {
        response = await axios.get(`https://shikimori.one/${login}/list_export/animes.json`);
        animes = response.data.filter(a => 
            (a.status === 'completed' || a.status === 'watching') 
            && a.episodes > 1
        );
    } catch(e) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Такого профиля не существует')
            .setDescription(`Ну ты и клоун, конечно...`)
            .setTimestamp();
        await notify('shikimori', interaction, {embeds: [embed]});
        log(`[shikimori] Найти профиль shikimori не удалось`);
        return;
    }

    let count = interaction.options.getInteger('count') || 1;
    if (count <= 0) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Отрицательное или нулевое количество')
            .setDescription(`Ну ты и клоун, конечно...`)
            .setTimestamp();
        await notify('shikimori', interaction, {embeds: [embed]});
        log(`[shikimori] Отрицательное количество`);
        return;
    }
    
    let audios = [];
    while (audios.length < count) {
        let i = Math.floor(Math.random() * animes.length);
        let j = Math.ceil(Math.random() * (animes[i].episodes / 13));
        let isOp = Math.round(Math.random());

        let search = `${animes[i].target_title} ${isOp ? 'opening' : 'ending'} ${j} full`;
        log(search);
        audios.push(search);
    }
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle('Плейлист формируется')
        .setDescription(`Выбраны аниме, песни и формируется плейлист. **Слышь, подожди!**`)
        .setTimestamp();
    await notify('shikimori', interaction, {embeds: [embed]});
    log(`[shikimori] Профиль найден, аниме выбрано и формируется плейлист`);
    await searchSongs(interaction, audios, login);
}

const set = async (interaction) => {
    let {login, nickname} = {
        login: interaction.options.getString("login"),
        nickname: interaction.options.getString("nickname")
    }

    try {
        if (!login || !nickname) throw `Login or nickname is undefined: [login: "${login}", nickname: "${nickname}"]`

        try {
            await axios.get(`https://shikimori.one/${login}`);
        } catch (e) {
            throw `Логин не существует: ${login}`
        }

        await db.set({
            "login": login,
            "nickname": nickname
        });
        await update(interaction.client);

        const embed = new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle('Создан новый пользователь shikimori')
            .setTimestamp()
            .addField(escaping(login), escaping(nickname));

        await notify('shikimori', interaction, {embeds: [embed]});
        log(`[shikimori] Пользователь успешно добавлен`);
    } catch (e) {
        await notifyError('shikimori', e, interaction);
        error(e);
    }
}

const remove = async (interaction) => {
    let login = interaction.options.getString("login");

    try {
        if (!login) throw `Login is undefined: [login: "${login}"]`

        await db.deleteByLogin(login);
        await update(interaction.client);

        const embed = new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle('Удален пользователь shikimori')
            .setTimestamp()
            .setDescription(escaping(login));

        await notify('shikimori', interaction, {embeds: [embed]});
        log(`[shikimori] Пользователь успешно удален`);
    } catch (e) {
        notifyError('shikimori', e, interaction);
        error(e);
    }
}