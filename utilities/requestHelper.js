const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageButton, Formatters, Util, MessageEmbed } = require('discord.js');
const { RuleDao } = require('../dao/ruleDao');
const { LogCommand, LogRuleResult } = require('../utilities/logHelper');
const { BuildEmbed } = require('../utilities/ruleHelper');
const { INTERACT_TIMEOUT, INTERACT_APOLOGY, TIMEOUT_APOLOGY, COLORS, WIZARD } = require("../constants");
const { CreateEmbed, RemoveComponents } = require("./messageHelper");
const { RequestDao } = require('../dao/requestDao');
const { CapitalizedTitleElement, QuoteText } = require('./stringHelper');
const { ConfigurationDao } = require('../dao/configurationDao');
const { GetUser, DirectMessageUser } = require('./userHelper');

const STABILITY_TYPES = exports.STABILITY_TYPES = {
    stable: "Stable",
    councilSubmission: "Council Submission",
    officialContent: "Official FFG Content"
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

exports.DATA_QUESTIONS = {
    0: {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Is the content that you would like to have added to the database part of an official Fantasy Flight Games release?\n\n*(This includes leaked or spoiled content.)*',
        yes: 4,
        no: 1,
        fieldName: 'Stability',
        fieldValue: STABILITY_TYPES.officialContent
    },
    1: {
        type: QUESTION_TYPES.yesNoFailure,
        question: 'Are you the author of the content in question?\n\n*(Only the author of a given piece of custom content can request that it be added to the database.)*',
        desiredAnswer: 'yes',
        conclusion: 'Consider reaching out to the content\'s author and informing them that you would like for such a request to be made.'
    },
    2: {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Has the content in question been submitted for approval by the council?\n\n*(This implies that the content in question is not subject to change.)*',
        yes: 4,
        no: 3,
        fieldName: 'Stability',
        fieldValue: STABILITY_TYPES.councilSubmission
    },
    3: {
        type: QUESTION_TYPES.yesNoFailure,
        question: 'Is the content in question in a **stable** condition?\n\n*(The term **stable** implies that the content in question may be subject to further change only on an infrequent basis. Content is not considered **stable** if frequent changes are anticipated.)*',
        desiredAnswer: 'yes',
        conclusion: 'Only **stable** content will be considered for addition to the database. Frequent changes to imported data require additional effort to maintain.\n\nConsider making a request in the future when you\'re confident that the data has reached a **stable** condition.',
        fieldName: 'Stability',
        fieldValue: STABILITY_TYPES.stable
    },
    4: {
        type: QUESTION_TYPES.userInput,
        question: 'Please enter the title of the content being added.\n\n*(This is how your content request will be listed in the backlog. Inappropriate, improper, or otherwise unsavory submissions will be denied on principle, so please use good judgment.)*',
        fieldName: 'Title'
    },
    5: {
        type: QUESTION_TYPES.userInput,
        question: 'Please enter the URL you would like to use that best represents the content you would like added — in its entirety.\n\n*(This can be a link to Google Drive, DropBox, Imgur, etc.)*',
        fieldName: 'Link'
    },
    6: {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Are there any additional details you would like to provide regarding this content request?',
        yes: 7,
        no: 8
    },
    7: {
        type: QUESTION_TYPES.userInput,
        question: 'Please enter the additional details you would like to provide.',
        fieldName: 'Description'
    },
    8: {
        type: QUESTION_TYPES.completion
    }
};

exports.FEATURE_QUESTIONS = {
    0: {
        type: QUESTION_TYPES.userInput,
        question: 'In a few words, summarize what this feature entails. This can be something like "Add a setting to toggle art by default".\n\n*(This is how your feature request will be listed in the backlog. Inappropriate, improper, or otherwise unsavory submissions will be denied on principle, so please use good judgment.)*',
        fieldName: 'Title'
    },
    1: {
        type: QUESTION_TYPES.userInput,
        question: 'Please describe the new feature you would like added in as much detail as you feel is necessary.',
        fieldName: 'Description'
    },
    2: {
        type: QUESTION_TYPES.completion
    }
};

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

exports.BuildRequestListEmbed = function(results, type, scale) {
    let embed = new MessageEmbed()
        .setColor(COLORS["Basic"])
        .setTitle(`${CapitalizedTitleElement(scale)}${type !== 'all' ? ` ${CapitalizedTitleElement(type)}` : ''} Requests`);

    let resultEntries = [];

    if (results) {
        results.sort((a, b) => a.Timestamp - b.Timestamp);
    
        results.forEach(result => {
            let id = result.Id.substring(24);
            let flagKey = Object.keys(FLAG_TYPES).find(key => FLAG_TYPES[key] === result.Flag);
    
            resultEntries.push({
                description: `\`${id}\` — **${result.Title}** ${FLAG_EMOJIS[flagKey]} *(${result.Flag})*`,
                type: result.Type
            });
        });
    }

    embed.setDescription(DeriveEmbedDescription(resultEntries, type));

    return embed;
}

const DeleteRequest = async function(context, request) {
    await RequestDao.DeleteRequestById(request.Id);

    let id = request.Id.substring(24);

    let embed = CreateEmbed(`Request \`${id}\` has been deleted...`, COLORS.Basic);

    await context.followUp({
        embeds: [embed]
    });
}

const BanishRequest = async function(context, request) {
    await TrashRequest(context, request, FLAG_TYPES.banished);
}

const DenyRequest = async function(context, request) {
    await TrashRequest(context, request, FLAG_TYPES.denied);
}

const TrashRequest = async function(context, request, newFlag, inputConfirmation = null) {
    let buttonRow = new MessageActionRow();

    if (inputConfirmation) {
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

    let id = request.Id.substring(24);

    let prompt = inputConfirmation ? `Your reason is as follows:\n\n${QuoteText(inputConfirmation)}\n\nIs this what you want to submit?` : `Please enter the reason that request \`${id}\` is being marked as **${newFlag}**.`;

    let embed = CreateEmbed(prompt, COLORS.Basic);

    let messageOptions = {
        components: [buttonRow],
        embeds: [embed]
    };

    let promise = context.followUp(messageOptions);
        
    promise.then((message) => {
        let messageCollector = null;

        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: INTERACT_TIMEOUT * 1000 * 2 });

        if (!inputConfirmation) {
            messageCollector = context.channel.createMessageCollector({ time: INTERACT_TIMEOUT * 1000 * 2 });

            messageCollector.on('collect', i => {
                let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;

                if (i.author.id === userId) {
                    buttonCollector.stop(null);
                    TrashRequest(context, request, newFlag, i.content);
                }
            });
        }

        buttonCollector.on('collect', i => {
            i.deferUpdate()
            .then(async () => {
                let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;

                if (i.user.id === userId) {
                    switch (i.customId) {
                        case 'yes':
                        case 'no':
                            if (i.customId === 'no') {
                                buttonCollector.stop(null);
                                TrashRequest(context, request, newFlag);
                            }
                            else {
                                buttonCollector.stop(null);
                                UpdateRequestFlag(context, request, newFlag, inputConfirmation);
                            }
                            break;
                        case 'cancel':
                            buttonCollector.stop('The operation was canceled...');
                            break;
                        default:
                            break;
                    }
                }
                else {
                    i.followUp({
                        embeds: [CreateEmbed(INTERACT_APOLOGY, COLORS.Basic)],
                        ephemeral: true
                    });
                }
            });
        });

        buttonCollector.on('end', (i, notification) => {
            RemoveComponents(message, null);

            if (notification) {
                let prompt = notification === 'time' ? TIMEOUT_APOLOGY : notification;
                let embed = CreateEmbed(prompt, COLORS.Basic);

                context.followUp({
                    embeds: [embed]
                });
            }

            if (messageCollector) {
                messageCollector.stop();
            }
        });
    });
}

const UpdateRequestFlag = async function(context, request, newFlag, reasoning = null) {
    try {
        await RequestDao.UpdateRequestFlagById(request.Id, newFlag, reasoning);
    
        let id = request.Id.substring(24);
    
        let embed = CreateEmbed(`Request \`${id}\` has been marked as **${newFlag}**!`, COLORS.Basic);
    
        context.followUp({
            embeds: [embed]
        });
    
        MessageModerators(context, `${context.user} has marked request \`${id}\` as **${newFlag}**!`);
    
        let user = await GetUser(context, request.UserId);
    
        if (user && user !== context.user) {
            DirectMessageUser(user, `Request \`${id}\` has been marked as **${newFlag}**!`);
        }
    }
    catch (e) {
        console.log(e);

        let replyEmbed = CreateEmbed('Something went wrong... Check the logs to find out more.');

        await context.channel.send({
            embeds: [replyEmbed]
        });
    }
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

const ProcessRequest = exports.ProcessRequest = async function(context, requestEntity, dmChannel, user, questionSet, currentQuestionId = 0, inputConfirmation = null) {
    let currentQuestion = questionSet[currentQuestionId];
    let type = currentQuestion.type;
    let buttonRow = new MessageActionRow();

    if (type === QUESTION_TYPES.completion) {
        try {
            let id = await SubmitRequest(context, requestEntity);
            
            let embed = CreateEmbed(`Thank you for your submission! Your request ID is \`${id.substring(24)}\`.\n\nYou'll receive a notification when the status of your request changes, but you can review the status of your request at any time using the command \`/request review id:${id.substring(24)}\`!`, COLORS.Basic);
    
            dmChannel.send({
                embeds: [embed]
            });
        }
        catch (e) {
            console.log(e);
    
            let replyEmbed = CreateEmbed('Something went wrong... Check the logs to find out more.');
    
            await context.channel.send({
                embeds: [replyEmbed]
            });
        }

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

    let prompt = type === QUESTION_TYPES.userInput && inputConfirmation ? `Your input is as follows:\n\n${QuoteText(inputConfirmation)}\n\nIs this what you want to submit?` : currentQuestion.question;

    let embed = CreateEmbed(prompt, COLORS.Basic);

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
                buttonCollector.stop(null);
                ProcessRequest(context, requestEntity, dmChannel, user, questionSet, currentQuestionId, i.content);
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
                        buttonCollector.stop('The request was canceled...');
                        break;
                    default:
                        break;
                }
            });
        });

        buttonCollector.on('end', (i, notification) => {
            RemoveComponents(message, null);

            if (notification) {
                let prompt = notification === 'time' ? TIMEOUT_APOLOGY : notification;
                let embed = CreateEmbed(prompt, COLORS.Basic);

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

const SendConfirmation = async function(context, request, prompt, operation) {
    let buttonRow = new MessageActionRow();

    buttonRow.addComponents(new MessageButton()
        .setCustomId('yes')
        .setLabel(`Yes`)
        .setStyle('SUCCESS'));

    buttonRow.addComponents(new MessageButton()
        .setCustomId('no')
        .setLabel(`No`)
        .setStyle('SECONDARY'));

    let embed = CreateEmbed(prompt, COLORS.Basic);

    let promise = context.followUp({
        components: [buttonRow],
        embeds: [embed],
        fetchReply: true
    });

    promise.then((message) => {
        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: INTERACT_TIMEOUT * 1000 * 2 });

        buttonCollector.on('collect', i => {
            i.deferUpdate()
            .then(async () => {
                let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;

                if (i.user.id === userId) {
                    if (i.customId === 'yes') {
                        buttonCollector.stop(null);
                        operation(context, request);
                    }
                    else {
                        buttonCollector.stop('The operation was canceled...');
                    }
                }
                else {
                    i.followUp({
                        embeds: [CreateEmbed(INTERACT_APOLOGY, COLORS.Basic)],
                        ephemeral: true
                    });
                }
            });
        });

        buttonCollector.on('end', (i, notification) => {
            RemoveComponents(message, null);

            if (notification) {
                let prompt = notification === 'time' ? TIMEOUT_APOLOGY : notification;
                let embed = CreateEmbed(prompt, COLORS.Basic);

                context.followUp({
                    embeds: [embed]
                });
            }
        });
    });
}

exports.SendRequestEmbed = async function(context, request, moderator, owner) {
    let adminRow = new MessageActionRow();
    let moderatorRow = new MessageActionRow();
    let defaultRow = new MessageActionRow();

    let components = [];

    let id = request.Id.substring(24);
    let flagKey = Object.keys(FLAG_TYPES).find(key => FLAG_TYPES[key] === request.Flag);

    let description = `**Author**: <@${request.UserId}>` +
        `\n**Type**: ${CapitalizedTitleElement(request.Type)} Request` +
        (request.Stability ? `\n**Stability**: ${request.Stability}` : '') +
        (request.Link ? `\n**Link**: ${request.Link}` : '') +
        (request.Description ? `\n\n**Description**:\n${QuoteText(request.Description)}` : '') +
        `\n\n**Status**: ${FLAG_EMOJIS[flagKey]} ${request.Flag}` +
        (request.Reasoning ? `\n**Reasoning**:\n> ${request.Reasoning}` : '');

    let embed = CreateEmbed(description, COLORS.Basic, `${id} — ${request.Title}`);

    if ((owner && [FLAG_TYPES.pendingReview, FLAG_TYPES.approved, FLAG_TYPES.complete].includes(request.Flag)) || context.user.id === WIZARD) {
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
            .setCustomId('approved')
            .setLabel(`Approve`)
            .setStyle('SUCCESS'));

        moderatorRow.addComponents(new MessageButton()
            .setCustomId('denied')
            .setLabel(`Deny`)
            .setStyle('SECONDARY'));

        moderatorRow.addComponents(new MessageButton()
            .setCustomId('banished')
            .setLabel('Banish')
            .setStyle('DANGER'));
    }

    if (adminRow.components.length > 0 || moderatorRow.components > 0) {
        defaultRow.addComponents(new MessageButton()
            .setCustomId('clearComponents')
            .setLabel('Clear Buttons')
            .setStyle('DANGER'));
    }

    [adminRow, moderatorRow, defaultRow].forEach(x => {
        if (x.components.length > 0) components.push(x);
    });

    let promise = context.reply({
        components: components,
        embeds: [embed],
        fetchReply: true
    });

    promise.then((message) => {
        if (components.length > 0) {
            const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: INTERACT_TIMEOUT * 1000 * 2 });
    
            buttonCollector.on('collect', i => {
                i.deferUpdate()
                .then(async () => {
                    let userId = context.user ? context.user.id : context.author ? context.author.id : context.member.id;
    
                    if (i.user.id === userId) {
                        switch (i.customId) {
                            case 'clearComponents':
                                buttonCollector.stop(null);
                                break;
                            case 'delete':
                                buttonCollector.stop(null);
                                SendConfirmation(context, request, 'Are you sure you want to delete this request?', DeleteRequest);
                                break;
                            case 'banished':
                                buttonCollector.stop(null);
                                SendConfirmation(context, request, `Are you sure you want to mark request \`${id}\` as **${FLAG_TYPES.banished}**?`, BanishRequest);
                                break;
                            case 'denied':
                                buttonCollector.stop(null);
                                SendConfirmation(context, request, `Are you sure you want to mark request \`${id}\` as **${FLAG_TYPES.denied}**?`, DenyRequest);
                                break;
                            case 'approved':
                            case 'complete':
                            case 'inProgress':
                                buttonCollector.stop(null);
                                await UpdateRequestFlag(context, request, FLAG_TYPES[i.customId]);
                                break;
                            default:
                                let embed = CreateEmbed('Not yet implemented!', COLORS.Basic);
                
                                i.followUp({
                                    embeds: [embed],
                                    ephemeral: true
                                });
                                break;
                        }
                    }
                    else {
                        i.followUp({
                            embeds: [CreateEmbed(INTERACT_APOLOGY, COLORS.Basic)],
                            ephemeral: true
                        });
                    }
                });
            });
    
            buttonCollector.on('end', (i, notification) => {
                RemoveComponents(message, null);
    
                if (notification && notification !== 'time') {
                    let embed = CreateEmbed(notification, COLORS.Basic);
    
                    context.followUp({
                        embeds: [embed]
                    });
                }
            });
        }
    });
}

const SubmitRequest = async function(context, requestEntity) {
    try {
        let id = await RequestDao.StoreRequestEntity(requestEntity);

        MessageModerators(context, `<@${requestEntity.UserId}> has submitted a new ${requestEntity.Type} request! The ID is \`${id.substring(24)}\`.`);
        
        return id;
    }
    catch (e) {
        throw(e);
    }
}

const MessageModerators = async function(context, message) {
    let moderators = ConfigurationDao.CONFIGURATION.Moderators;

    for (let moderator of moderators) {
        let user = await GetUser(context, moderator);

        if (user && user !== context.user) {
            DirectMessageUser(user, message);
        }
    }
}