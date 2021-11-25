const { createCanvas, loadImage } = require("canvas");
const { MessageAttachment } = require("discord.js");
const { getStatusIcon } = require("./resources");
const { timeFormatmSeconds } = require("./converter.js");
const config = require("../configs/config.js");
const { remained } = require("./calc");

module.exports.createStatus = async (queue) => {
    const canvas = createCanvas(510, 40);
    const context = canvas.getContext("2d");

    let remainedTmp = `-${timeFormatmSeconds(remained(queue))}`;
    context.font = '24px sans-serif';

    context.fillStyle = '#2F3136';
    context.fillRect(0, 0, 49 + context.measureText(remainedTmp).width, 40);

    context.fillStyle = config.colors.info;
    context.fillRect(0, 0, 5, 40);

    const status = await loadImage(`./res/icons/${getStatusIcon(queue.nowPlaying)}.png`);
    context.drawImage(status, 9, 4, 32, 32);

    context.fillStyle = config.colors.info;
    context.fillText(remainedTmp, 45, 28);

    const attachment = new MessageAttachment(canvas.toBuffer(), 'status.png');

    return attachment;
}
