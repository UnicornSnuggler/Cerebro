exports.ChooseRandomElements = function(array, number) {
    let choices = [];
    let clonedArray = array.map(x => x);

    for (let i = 0; i < number; i++) {
        let randomIndex = Math.floor(Math.random() * clonedArray.length);

        choices.push(clonedArray[randomIndex]);
        clonedArray.splice(randomIndex, 1);
    }

    return choices;
}

exports.CreateString = function(array, wrapper = '', delimiter = ', ') {
    let output = null;

    switch(array.length) {
        case 0:
            break;
        case 1:
            output = `${wrapper}${array[0]}${wrapper}`;
            break;
        case 2:
            output = `${wrapper}${array[0]}${wrapper} and ${wrapper}${array[1]}${wrapper}`;
            break;
        default:
            output = array.map(x => array.indexOf(x) === array.length - 1 ? `and ${wrapper}${x}${wrapper}` : `${wrapper}${x}${wrapper}`).join(delimiter);
            break;
    }

    return output;
}