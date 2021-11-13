module.exports.escaping = (str) => {
    const symbols = ['\\', '_', '*', '~', '>', '<', '|'];

    symbols.forEach(s => {
        str = str.replaceAll(s, `\\${s}`);
    })

    return str;
}