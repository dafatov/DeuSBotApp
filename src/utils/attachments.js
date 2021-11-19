const { createCanvas, loadImage } = require("canvas");
const { MessageAttachment } = require("discord.js");
const { getStatusIcon } = require("./resources");
const config = require("../configs/config.js");

module.exports.createStatus = async (nowPlaying) => {
    const canvas = createCanvas(510, 40);
    const context = canvas.getContext("2d");

    context.fillStyle = '#2F3136';
    context.fillRect(0, 0, 45, 40);

    context.fillStyle = config.colors.info;
    context.fillRect(0, 0, 5, 40);

    const status = await loadImage(`./res/icons/${getStatusIcon(nowPlaying)}.png`);
    context.drawImage(status, 9, 4, 32, 32);

    const attachment = new MessageAttachment(canvas.toBuffer(), 'status.png');

    return attachment;
}
