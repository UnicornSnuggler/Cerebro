const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageButton, Formatters, Util, MessageEmbed } = require('discord.js');
const { RuleDao } = require('../dao/ruleDao');
const { LogCommand, LogRuleResult } = require('../utilities/logHelper');
const { BuildEmbed } = require('../utilities/ruleHelper');
const { INTERACT_TIMEOUT, INTERACT_APOLOGY, TIMEOUT_APOLOGY, COLORS, WIZARD } = require("../constants");
const { CreateEmbed, RemoveComponents } = require("./messageHelper");
const { RequestDao } = require('../dao/requestDao');
const { CapitalizedTitleElement } = require('./stringHelper');
const { ConfigurationDao } = require('../dao/configurationDao');

const STABILITY_TYPES = exports.STABILITY_TYPES = {
    stable: 0,
    councilSubmission: 1,
    officialContent: 2
}

const FLAG_TYPES = exports.FLAG_TYPES = {
    banished: "Banished",
    denied: "Denied",
    pendingReview: "Pending Review",
    approved: "Approved",
    inProgress: "In Progress",
    complete: "Complete"
}

const FLAG_EMOJIS = {
    banished: ":wastebasket:",
    denied: ":recycle:",
    pendingReview: ":mag:",
    approved: ":file_cabinet:",
    inProgress: ":memo:",
    complete: ":package:"
}

const QUESTION_TYPES = {
    yesNoFailure: 1,
    yesNoContinue: 2,
    userInput: 3,
    completion: 4
}

exports.DATA_QUESTIONS = [
    {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Is the content that you would like to have added to the database part of an official Fantasy Flight Games release?\n\n*(This includes leaked or spoiled content.)*',
        yes: 4,
        no: 1,
        fieldName: 'Stability',
        fieldValue: STABILITY_TYPES.officialContent
    },
    {
        type: QUESTION_TYPES.yesNoFailure,
        question: 'Are you the author of the content in question?\n\n*(Only the author of a given piece of custom content can request that it be added to the database.)*',
        desiredAnswer: 'yes',
        conclusion: 'Consider reaching out to the content\'s author and informing them that you would like for such a request to be made.'
    },
    {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Has the content in question been submitted for approval by the council?\n\n*(This implies that the content in question is not subject to change.)*',
        yes: 4,
        no: 3,
        fieldName: 'Stability',
        fieldValue: STABILITY_TYPES.councilSubmission
    },
    {
        type: QUESTION_TYPES.yesNoFailure,
        question: 'Is the content in question in a **stable** condition?\n\n*(The term **stable** implies that the content in question may be subject to further change only on an infrequent basis. Content is not considered **stable** if frequent changes are anticipated.)*',
        desiredAnswer: 'yes',
        conclusion: 'Only **stable** content will be considered for addition to the database. Frequent changes to imported data require additional effort to maintain.\n\nConsider making a request in the future when you\'re confident that the data has reached a **stable** condition.',
        fieldName: 'Stability',
        fieldValue: STABILITY_TYPES.stable
    },
    {
        type: QUESTION_TYPES.userInput,
        question: 'Please enter the title of the content being added.\n\n*(This is how your content request will be listed in the backlog. Inappropriate, improper, or otherwise unsavory submissions will be denied on principle, so please use good judgment.)*',
        fieldName: 'Title'
    },
    {
        type: QUESTION_TYPES.userInput,
        question: 'Please enter the URL you would like to use that best represents the content you would like added — in its entirety.\n\n*(This can be a link to Google Drive, DropBox, Imgur, etc.)*',
        fieldName: 'Link'
    },
    {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Are there any additional details you would like to provide regarding this content request?',
        yes: 7,
        no: 8
    },
    {
        type: QUESTION_TYPES.userInput,
        question: 'Please enter the additional details you would like to provide.',
        fieldName: 'Description'
    },
    {
        type: QUESTION_TYPES.completion,
        question: 'Thank you for your submission! You\'ll receive a notification when your request has been processed!'
    }
];

exports.FEATURE_QUESTIONS = [
    {
        type: QUESTION_TYPES.userInput,
        question: 'In a few words, summarize what this feature entails. This can be something like "Add a setting to toggle art by default".\n\n*(This is how your feature request will be listed in the backlog. Inappropriate, improper, or otherwise unsavory submissions will be denied on principle, so please use good judgment.)*',
        fieldName: 'Title'
    },
    {
        type: QUESTION_TYPES.userInput,
        question: 'Please describe the new feature you would like added in as much detail as you feel is necessary.',
        fieldName: 'Description'
    },
    {
        type: QUESTION_TYPES.completion,
        question: 'Thank you for your submission! You\'ll receive a notification when your request has been processed!'
    }
];

exports.BuildEntity = function(userId, type) {
    let entity = {
        Deleted: false,
        Description: null,
        Flag: FLAG_TYPES.pendingReview,
        Link: null,
        Reasoning: null,
        Stability: null,
        Timestamp: Date.now(),
        Title: null,
        Type: type,
        UserId: userId,
        '@metadata': {
            '@collection': `${type}requests`
        }
    };

    return entity;
}

exports.BuildRequestEmbed = function(request, moderator, owner) {
    let embed = new MessageEmbed()
        .setColor(COLORS["Basic"])
        .setTitle(`${CapitalizedTitleElement(scale)}${type !== 'all' ? ` ${CapitalizedTitleElement(type)}` : ''} Requests`);

    let resultEntries = [];

    results.sort((a, b) => a.Timestamp - b.Timestamp);

    results.forEach(result => {
        let id = result.Id.substring(24);
        let flagKey = Object.keys(FLAG_TYPES).find(key => FLAG_TYPES[key] === result.Flag);

        resultEntries.push({
            description: `\`${id}\` — **${result.Title}** ${FLAG_EMOJIS[flagKey]} *(${result.Flag})*`,
            type: result.Type
        });
    });

    embed.setDescription(DeriveEmbedDescription(resultEntries, type));

    return embed;
}

exports.BuildRequestListEmbed = function(results, type, scale) {
    let embed = new MessageEmbed()
        .setColor(COLORS["Basic"])
        .setTitle(`${CapitalizedTitleElement(scale)}${type !== 'all' ? ` ${CapitalizedTitleElement(type)}` : ''} Requests`);

    let resultEntries = [];

    results.sort((a, b) => a.Timestamp - b.Timestamp);

    results.forEach(result => {
        let id = result.Id.substring(24);
        let flagKey = Object.keys(FLAG_TYPES).find(key => FLAG_TYPES[key] === result.Flag);

        resultEntries.push({
            description: `\`${id}\` — **${result.Title}** ${FLAG_EMOJIS[flagKey]} *(${result.Flag})*`,
            type: result.Type
        });
    });

    embed.setDescription(DeriveEmbedDescription(resultEntries, type));

    return embed;
}

const DeriveEmbedDescription = function(resultEntries, type) {
    let output = [];
    
    if (['all', 'data'].includes(type)) {
        let dataArray = [];
        resultEntries.filter(x => x.type === 'data').forEach(entry => dataArray.push(entry.description));
        output.push(`**Data Requests**\n${dataArray.length > 0 ? dataArray.join('\n') : 'No requests to show...'}`);
    }
    
    if (['all', 'feature'].includes(type)) {
        let featureArray = [];
        resultEntries.filter(x => x.type === 'feature').forEach(entry => featureArray.push(entry.description));
        output.push(`**Feature Requests**\n${featureArray.length > 0 ? featureArray.join('\n') : 'No requests to show...'}`);
    }

    return output.join('\n\n');
}

const ProcessRequest = exports.ProcessRequest = function(context, requestEntity, dmChannel, user, questionSet, currentQuestionId = 0, inputConfirmation = null) {
    let currentQuestion = questionSet[currentQuestionId];
    let type = currentQuestion.type;
    let buttonRow = new MessageActionRow();

    if (type === QUESTION_TYPES.completion) {
        SubmitRequest(context, requestEntity);
        
        let embed = CreateEmbed(currentQuestion.question);

        dmChannel.send({
            embeds: [embed]
        });

        return;
    }

    if ([QUESTION_TYPES.yesNoContinue, QUESTION_TYPES.yesNoFailure].includes(type) || (type === QUESTION_TYPES.userInput && inputConfirmation)) {
        buttonRow.addComponents(new MessageButton()
            .setCustomId('yes')
            .setLabel(`Yes`)
            .setStyle('SUCCESS'));

        buttonRow.addComponents(new MessageButton()
            .setCustomId('no')
            .setLabel(`No`)
            .setStyle('SECONDARY'));
    }

    buttonRow.addComponents(new MessageButton()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle('DANGER'));

    let prompt = type === QUESTION_TYPES.userInput && inputConfirmation ? `Your input is **${Util.escapeMarkdown(inputConfirmation)}**. Is this what you want to submit?` : currentQuestion.question;

    let embed = CreateEmbed(prompt);

    let messageOptions = {
        components: [buttonRow],
        embeds: [embed]
    };

    let promise = dmChannel.send(messageOptions);
        
    promise.then((message) => {
        let messageCollector = null;

        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: INTERACT_TIMEOUT * 1000 * 2 });

        if (type === QUESTION_TYPES.userInput && !inputConfirmation) {
            messageCollector = dmChannel.createMessageCollector({ time: INTERACT_TIMEOUT * 1000 * 2 });

            messageCollector.on('collect', i => {

                ProcessRequest(context, requestEntity, dmChannel, user, questionSet, currentQuestionId, i.content);
                buttonCollector.stop(null);
            });
        }

        buttonCollector.on('collect', i => {
            i.deferUpdate()
            .then(async () => {
                switch (i.customId) {
                    case 'yes':
                    case 'no':
                        if (type === QUESTION_TYPES.yesNoFailure) {
                            if (currentQuestion.desiredAnswer === i.customId) {
                                if (currentQuestion.fieldName) {
                                    requestEntity[currentQuestion.fieldName] = currentQuestion.fieldValue;
                                }

                                ProcessRequest(context, requestEntity, dmChannel, user, questionSet, currentQuestionId + 1);
                                buttonCollector.stop(null);
                            }
                            else {
                                buttonCollector.stop(currentQuestion.conclusion);
                            }
                        }
                        else if (type === QUESTION_TYPES.yesNoContinue) {
                            if (currentQuestion.fieldName) {
                                requestEntity[currentQuestion.fieldName] = currentQuestion.fieldValue;
                            }

                            ProcessRequest(context, requestEntity, dmChannel, user, questionSet, currentQuestion[i.customId]);
                            buttonCollector.stop(null);
                        }
                        else {
                            if (i.customId === 'no') {
                                ProcessRequest(context, requestEntity, dmChannel, user, questionSet, currentQuestionId);
                                buttonCollector.stop(null);
                            }
                            else {
                                if (currentQuestion.fieldName) {
                                    requestEntity[currentQuestion.fieldName] = inputConfirmation;
                                }

                                ProcessRequest(context, requestEntity, dmChannel, user, questionSet, currentQuestionId + 1);
                                buttonCollector.stop(null);
                            }
                        }
                        break;
                    case 'cancel':
                        buttonCollector.stop('The request has been canceled!');
                        break;
                    default:
                        break;
                }
            });
        });

        buttonCollector.on('end', (i, notification) => {
            RemoveComponents(message, null);

            if (notification !== null) {
                let prompt = notification === 'time' ? TIMEOUT_APOLOGY : notification

                let embed = CreateEmbed(prompt);

                dmChannel.send({
                    embeds: [embed]
                });
            }

            if (messageCollector) {
                messageCollector.stop();
            }
        });
    });
}

const SendRequestEmbed = exports.SendRequestEmbed = async function(context, request, moderator, owner) {
    let adminRow = new MessageActionRow();
    let moderatorRow = new MessageActionRow();

    let components = [];

    let id = request.Id.substring(24);
    let flagKey = Object.keys(FLAG_TYPES).find(key => FLAG_TYPES[key] === request.Flag);

    let description = (!owner ? `\n**Author**: <@${request.UserId}>` : '') +
        `\n**Type**: ${CapitalizedTitleElement(request.Type)} Request` +
        `\n**Status**: ${FLAG_EMOJIS[flagKey]} ${request.Flag}` +
        (request.Link ? `\n**Link**: ${request.Link}` : '') +
        (request.Description ? `\n\n**Description**:\n> ${request.Description}` : '');

    let embed = CreateEmbed(description, COLORS.Basic, `${id} — ${request.Title}`);

    if (owner || context.user.id === WIZARD) {
        adminRow.addComponents(new MessageButton()
            .setCustomId('delete')
            .setLabel('Delete')
            .setStyle('DANGER'));
    }

    if (context.user.id === WIZARD) {
        adminRow.addComponents(new MessageButton()
            .setCustomId('inProgress')
            .setLabel('In Progress')
            .setStyle('PRIMARY'));

        adminRow.addComponents(new MessageButton()
            .setCustomId('complete')
            .setLabel('Complete')
            .setStyle('SUCCESS'));
    }

    if ((moderator && !owner) || context.user.id === WIZARD) {
        moderatorRow.addComponents(new MessageButton()
            .setCustomId('approve')
            .setLabel(`Approve`)
            .setStyle('SUCCESS'));

        moderatorRow.addComponents(new MessageButton()
            .setCustomId('deny')
            .setLabel(`Deny`)
            .setStyle('SECONDARY'));

        moderatorRow.addComponents(new MessageButton()
            .setCustomId('banish')
            .setLabel('Banish')
            .setStyle('DANGER'));
    }

    [adminRow, moderatorRow].forEach(x => {
        if (x.components.length > 0) components.push(x);
    });

    await context.reply({
        components: components,
        embeds: [embed]
    });
}

const SubmitRequest = async function(context, requestEntity) {
    await RequestDao.StoreRequestEntity(requestEntity);

    let username = context.client.users.resolve(requestEntity.UserId).username;
    let moderators = ConfigurationDao.CONFIGURATION.Moderators;

    for (let moderator of moderators) {
        let user = null;

        for (let guild of context.client.guilds._cache) {
            let guildMember = await guild[1].members.fetch(moderator);

            if (guildMember) {
                user = guildMember;
                break;
            }
        }

        if (user) {
            let dmChannel = await user.createDM();
            
            let embed = CreateEmbed(`**${username}** has submitted a new **${requestEntity.Type}** request!`);
    
            dmChannel.send({
                embeds: [embed]
            });
        }
    }
}