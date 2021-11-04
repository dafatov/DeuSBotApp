export const log = (msg) => {
    let prefix = "[Log]";

    if (typeof(msg) === 'object') {
        console.log(`${prefix}:`);
        console.log(msg);
    } else {
        console.log(`${prefix}: ${msg}`);
    }
}

export const error = (channel, msg) => {
    let prefix = "[Err]";

    if (typeof(msg) === 'object') return;

    channel.send(`${prefix}: ${msg}`);
    console.error();(`${prefix}: ${msg}`);
}