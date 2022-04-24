const { WIZARD } = require("../constants");
const { CreateEmbed, DirectMessageUser } = require("./messageHelper");
const { GetUser } = require("./userHelper");

exports.ReportError = async function(context, error) {
    try {
        console.log(error);
        
        let replyEmbed = CreateEmbed('Something went wrong... The error is being investigated.');
        
        await context.channel.send({
            embeds: [replyEmbed]
        });
        
        let user = await GetUser(context, WIZARD);
        
        if (user && user !== context.user) {
            DirectMessageUser(user, `An error has occurred!\n\n\`${error.name}\``);
        }
    }
    catch (e) {
        console.error(`An error occurred while reporting an error...\n\n${e}`);
    }
}