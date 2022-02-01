const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, MessageButton, Formatters, Util } = require('discord.js');
const { RuleDao } = require('../dao/ruleDao');
const { LogCommand, LogRuleResult } = require('../utilities/logHelper');
const { BuildEmbed } = require('../utilities/ruleHelper');
const { INTERACT_TIMEOUT, INTERACT_APOLOGY, TIMEOUT_APOLOGY } = require("../constants");
const { CreateEmbed, RemoveComponents } = require("./messageHelper");
const { RequestDao } = require('../dao/requestDao');

const STABILITY_TYPES = exports.STABILITY_TYPES = {
    stable: 0,
    councilSubmission: 1
}

const FLAG_TYPES = exports.FLAG_TYPES = {
    disrespectfullyDenied: -2,
    respectfullyDenied: -1,
    pendingReview: 0,
    approved: 1,
    inProgress: 2,
    complete: 3
}

const QUESTION_TYPES = {
    yesNoFailure: 1,
    yesNoContinue: 2,
    userInput: 3,
    completion: 4
}

exports.DATA_QUESTIONS = [
    {
        type: QUESTION_TYPES.yesNoFailure,
        question: 'Are you the author of the content that you would like to have added to the database?\n\n*(Only the author of a given piece of custom content can request that it be added to the database.)*',
        desiredAnswer: 'yes',
        conclusion: 'Consider reaching out to the content\'s author and informing them that you would like for such a request to be made.'
    },
    {
        type: QUESTION_TYPES.yesNoContinue,
        question: 'Has the content in question been submitted for approval by the council?\n\n*(This implies that the content in question is not subject to change.)*',
        yes: 3,
        no: 2,
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
        yes: 6,
        no: 7
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

exports.FEATURE_QUESTIONS = [];

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

const ProcessRequest = exports.ProcessRequest = function(requestEntity, dmChannel, user, questionSet, currentQuestionId = 0, inputConfirmation = null) {
    let currentQuestion = questionSet[currentQuestionId];
    let type = currentQuestion.type;
    let buttonRow = new MessageActionRow();

    if (type === QUESTION_TYPES.completion) {
        RequestDao.StoreRequestEntity(requestEntity);
        
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

        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: INTERACT_TIMEOUT * 1000 });

        if (type === QUESTION_TYPES.userInput && !inputConfirmation) {
            messageCollector = dmChannel.createMessageCollector({ time: INTERACT_TIMEOUT * 1000 });

            messageCollector.on('collect', i => {

                ProcessRequest(requestEntity, dmChannel, user, questionSet, currentQuestionId, i.content);
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

                                ProcessRequest(requestEntity, dmChannel, user, questionSet, currentQuestionId + 1);
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

                            ProcessRequest(requestEntity, dmChannel, user, questionSet, currentQuestion[i.customId]);
                            buttonCollector.stop(null);
                        }
                        else {
                            if (i.customId === 'no') {
                                ProcessRequest(requestEntity, dmChannel, user, questionSet, currentQuestionId);
                                buttonCollector.stop(null);
                            }
                            else {
                                if (currentQuestion.fieldName) {
                                    requestEntity[currentQuestion.fieldName] = inputConfirmation;
                                }

                                ProcessRequest(requestEntity, dmChannel, user, questionSet, currentQuestionId + 1);
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