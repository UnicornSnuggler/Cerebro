let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

exports.GetDateString = function(isChannelName = false) {
    let now = new Date();
    return isChannelName ? `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}` : `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}${GetOrdinal(now.getDate())}`;
}

const GetOrdinal = function(date) {
    if (date > 3 && date < 21) return 'th';
    switch (date % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
}