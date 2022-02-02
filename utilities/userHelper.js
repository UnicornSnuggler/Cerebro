const { COLORS } = require("../constants");
const { CreateEmbed } = require("./messageHelper");

exports.DirectMessageUser = async function(user, message) {            
    let embed = CreateEmbed(message, COLORS.Basic);

    try {
        await user.send({
            embeds: [embed]
        });
    }
    catch (exception) {
        console.log(`Could not send a direct message to '${user.username}' (${user.id})...`);
    }
}

exports.GetUser = async function(context, userId) {
    try {
        let user = await context.client.users.fetch(userId);

        return user ? user : null;
    }
    catch (exception) {
        console.log(`Could not find '${user.username}' (${user.id})...`);
    }
}