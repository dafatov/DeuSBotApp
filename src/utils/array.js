module.exports.shuffleArray = (array) => {
    let j, tmp;

    for (let i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random()*(i + 1));
        tmp = array[j];
        array[j] = array[i];
        array[i] = tmp;
    }
    return array;
}