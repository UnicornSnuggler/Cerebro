const { COLORS } = require("../constants");
const { ReportError } = require("./errorHelper");
const { CreateEmbed } = require("./messageHelper");

exports.DirectMessageUser = async function(user, message) {            
    let embed = CreateEmbed(message, COLORS.Basic);

    try {
        await user.send({
            embeds: [embed]
        });
    }
    catch (e) {
        console.error(`An error occurred while attempting to direct message a user...\n\n${e}`);
    }
}

exports.GetUser = async function(context, userId) {
    try {
        let user = await context.client.users.fetch(userId);

        return user ? user : null;
    }
    catch (e) {
        console.error(`An error occurred while attempting to retrieve a user...\n\n${e}`);
    }
}