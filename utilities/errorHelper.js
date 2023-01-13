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
            
            let wizard = await GetUser(context, WIZARD);
            
            if (wizard) {
                let timestamp = context.createdTimestamp.toString().slice(0, 10);
                let content = context.content ?? `/${context.commandName}`;
                let channel = context.channel;
                let guild = context.guild;
                let user = context.author ?? context.user;

                let errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.Default)
                    .setTitle('An Error Has Occurred...')
                    .setDescription(`\`\`\`${error.stack}\`\`\``);

                errorEmbed.addFields([
                    { name: 'Triggering User', value: `<@${user.id}>` },
                    { name: 'Source', value: guild ? `${guild.name} — ${channel}` : 'DM Channel' },
                    { name: 'Initial Interaction', value: `\`${content}\`` },
                    { name: 'Timestamp', value: `<t:${timestamp}:f>` }
                ]);
                
                await wizard.send({
                    embeds: [errorEmbed]
                });
            }
        }
    }
    catch (e) {
        console.error(`An error occurred while reporting an error...\n\n${e.stack}`);
    }
}