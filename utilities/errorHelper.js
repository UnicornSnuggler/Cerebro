const { WIZARD, COLORS } = require("../constants");
const { GetUser } = require("./userHelper");
const { EmbedBuilder } = require("discord.js");

exports.ReportError = async function(context, error) {
    try {
        console.log(error);

        if (context != null) {
            let replyEmbed = new EmbedBuilder()
                .setColor(COLORS.Default)
                .setDescription('Something went wrong... The error is being investigated.');
    
            await context.channel.send({
                embeds: [replyEmbed]
            });
            
            let user = await GetUser(context, WIZARD);
            
            if (user && user !== context.user) {
                let errorEmbed = new EmbedBuilder()
                .setColor(COLORS.Default)
                .setDescription(`An error has occurred!\n\n\`${error.name}\``);
                
                await user.send({
                    embeds: [errorEmbed]
                });
            }
        }
    }
    catch (e) {
        console.error(`An error occurred while reporting an error...\n\n${e}`);
    }
}