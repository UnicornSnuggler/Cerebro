const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { COLORS, PRODUCTION_BOT, WIZARD, ACOLYTE } = require("../constants");
const { ConfigurationDao } = require("../dao/configurationDao");
const { ReportError } = require("./errorHelper");
const { GetUserIdFromContext } = require("./userHelper");

exports.Authorized = function(context, adminLocked = false) {
    try {
        let userId = GetUserIdFromContext(context);
    
        if (adminLocked && userId !== WIZARD) {
            SendContentAsEmbed(context, "Only the bot administrator can use this command!", null, true);
            return false;
        }
        
        if (context.client.user.id !== PRODUCTION_BOT && !ConfigurationDao.CONFIGURATION.Donors.concat([WIZARD, ACOLYTE]).includes(userId)) {
            SendContentAsEmbed(context, "You do not possess beta access!", null, true);
            return false;
        }
    
        if (context.guildId) {
            let guild = context.client.guilds.resolve(context.guildId);
            let permissions = guild.members.me.permissionsIn(context.channelId);

            if (permissions && (!permissions.has(PermissionsBitField.Flags.ViewChannel) || !permissions.has(PermissionsBitField.Flags.SendMessages) || !permissions.has(PermissionsBitField.Flags.ManageMessages))) {
                SendContentAsEmbed(context, "I don't have sufficient permissions here!", null, true);
                return false;
            }
        }
        
        return true;
    }
    catch (e) {
        ReportError(context, e);
    }
}

let CreateEmbed = exports.CreateEmbed = function(content, color = COLORS.Default, title = null) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(content);

    if (title != null) embed.setTitle(title);

    return embed;
}

exports.DirectMessageUser = async function(user, message) {            
    try {
        let embed = CreateEmbed(message, COLORS.Basic);

        await user.send({
            embeds: [embed]
        });
    }
    catch (e) {
        ReportError(context, e);
    }
}

exports.RemoveComponents = function(message, embedContent, removeFiles = true, removeContent = false) {
    try {
        let messageOptions = {
            components: []
        };
        
        if (removeFiles) {
            messageOptions.attachments = [];
            messageOptions.files = [];
        }

        if (removeContent) {
            messageOptions.content = null;
        }
        
        if (embedContent) messageOptions.embeds = [CreateEmbed(embedContent)];
        
        return message.edit(messageOptions);
    }
    catch(e) {
        ReportError(message, e);
    }
}

let SendContentAsEmbed = exports.SendContentAsEmbed = function(context, content, components = null, ephemeral = false) {
    try {
        let embed = CreateEmbed(content);

        return context.reply({
            allowedMentions: {
                repliedUser: false
            },
            components: components,
            embeds: [embed],
            ephemeral: ephemeral,
            fetchReply: true,
            failIfNotExists: false
        });
    }
    catch (e) {
        ReportError(context, e);
    }
}

exports.SendMessageWithOptions = function(context, options, ephemeral = false) {
    try {
        options.allowedMentions = {
            repliedUser: false,
            failIfNotExists: false
        };
        options.ephemeral = ephemeral;
        options.fetchReply = true;

        return context.reply(options);
    }
    catch (e) {
        ReportError(context, e);
    }
}