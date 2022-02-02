const { COLORS } = require("../constants");
const { CreateEmbed } = require("./messageHelper");

exports.DirectMessageUser = async function(user, message) {            
    let embed = CreateEmbed(message, COLORS.Basic);

    await user.send({
        embeds: [embed]
    });
}

exports.GetUser = async function(context, userId) {
    let user = null;

    for (let guild of context.client.guilds._cache) {
        let guildMember = await guild[1].members.fetch(userId);

        if (guildMember) {
            user = guildMember.user;
            break;
        }
    }

    return user;
}