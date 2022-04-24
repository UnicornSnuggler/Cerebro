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

exports.CreateStringFromArray = function(array, delimiter = ', ', fullWordAnd = true) {
    let output = null;

    switch(array.length) {
        case 0:
            break;
        case 1:
            output = array[0];
            break;
        case 2:
            output = `${array[0]} ${fullWordAnd ? 'and' : '&'} ${array[1]}`;
            break;
        default:
            output = array.map(x => array.indexOf(x) === array.length - 1 ? `${fullWordAnd ? 'and' : '&'} ${x}` : `${x}`).join(delimiter);
            break;
    }

    return output;
}