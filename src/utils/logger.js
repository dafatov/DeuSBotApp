module.exports.log = (msg) => {
    consolePrint('[Log]', msg)
}

module.exports.error = (msg) => {
    consolePrint('[Err]', msg)
}

const consolePrint = (prefix, msg) => {
    if (typeof(msg) === 'object') {
        console.log(`${prefix}:`);
        console.log(msg);
    } else {
        console.log(`${prefix}: ${msg}`);
    }
}