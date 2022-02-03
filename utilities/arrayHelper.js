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