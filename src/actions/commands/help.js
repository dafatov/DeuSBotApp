// import { SlashCommandBuilder } from '@discordjs/builders';

// export default {
//     data: new SlashCommandBuilder().
//         setName('help').
//         setDescription('Помощь нуждающимся'),
//     async execute({channel}) {
//         await help(channel);
//     }
// }

export const help = (channel) => {
    channel.send(`Существуют следующие команды:\t
    help - Собственно сюда Вы как-то попали же...\t
    ping - Можно попинать бота, чтобы проверить жив ли он хотя бы снаружи\t
    append - Можно добавить новые реакции на сообщения в текстовых чатах со следующим синтаксисом:\t\t
        regex - правило регялрных выражений для определения сообщения-триггера (кто ни*** не понял забейте и просто пишите текст)\t\t
        react - текст выводящийся ботом в качестве ответного сообщения`)
}