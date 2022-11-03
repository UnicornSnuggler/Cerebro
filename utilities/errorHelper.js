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
            
            if (user) {
                let timestamp = context.createdTimestamp.toString().slice(0, 10);
                let content = context.content;
                let channel = context.channel;
                let guild = context.guild;
                let author = context.author;

                let errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.Default)
                    .setTitle('An Error Has Occurred...');

                errorEmbed.addFields([
                    { name: 'Triggering User', value: `${author}` },
                    { name: 'Source', value: guild ? `${guild.name} — ${channel}` : 'DM' },
                    { name: 'Timestamp', value: `<t:${timestamp}:f>` },
                    { name: 'Content', value: `\`${content}\`` },
                    { name: 'Error Type', value: `\`${error.name}\`` },
                    { name: 'Error Message', value: `\`\`\`${error.stack}\`\`\`` }
                ]);
                
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