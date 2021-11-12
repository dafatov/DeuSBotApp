const config = require("../configs/config.js")

const { appendFileSync, mkdirSync, accessSync, realpath, existsSync } = require("fs")

module.exports.log = (msg) => {
    consolePrint('[Log]', msg)
    filePrint('[Log]', msg)
}

module.exports.error = (msg) => {
    consolePrint('[Err]', msg)
    filePrint('[Err]', msg)
}

const consolePrint = (prefix, msg) => {
    if (typeof(msg) === 'object') {
        console.log(`${prefix}:`);
        console.log(msg);
    } else {
        console.log(`${prefix}: ${msg}`);
    }
}

const filePrint = (prefix, msg) => {
    let date = new Date();

    if (!existsSync(`${config.logesPath}`)) {
        mkdirSync(`${config.logesPath}`);
    }

    appendFileSync(`${config.logesPath}/${date.toLocaleDateString()}.log`,
        `[${date.toLocaleTimeString()}]${prefix}: ${typeof(msg) === 'object'
            ? `\n${JSON.stringify(msg, null, 2)}` 
            : msg}\n`);
}