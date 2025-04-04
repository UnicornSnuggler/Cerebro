const { CreateEmbed } = require('./messageHelper');
const { COLORS, OFFICIAL, IMAGE_WIDTH, IMAGE_HEIGHT } = require('../constants')
const { CardDao } = require('../dao/cardDao');
const { BuildCardImagePath } = require('./cardHelper');
const { GetDateString } = require('./dateHelper');
const { ConfigurationDao } = require('../dao/configurationDao');
const { ReportError } = require('./errorHelper');
const { GenerateHero } = require('./dangerRoomHelper');
const { CreateStringFromArray } = require('./arrayHelper');
const { AttachmentBuilder, PermissionsBitField } = require('discord.js');

exports.deckOfTheWeekLoop = async function deckOfTheWeekLoop(client) {
    for (let [guildId, data] of Object.entries(ConfigurationDao.CONFIGURATION.DeckOfTheWeek)) {
        let guild = client.guilds.resolve(guildId);

        if (guild) {
            await deckOfTheWeek(guild, data.channels, data.role);
        }
    }
}

const deckOfTheWeek = exports.deckOfTheWeek = async function(guild, channels, role) {
    try {
        let heroData = GenerateHero();
        
        let heroSet = await CardDao.RetrieveWithFilters(OFFICIAL, null, null, null, null, null, false, null, null, [heroData.hero.Id], null, null, null, false);
        let hero = heroSet.filter(x => x.Type == 'Hero')[0];
        let alterEgo = heroSet.filter(x => x.Type == 'Alter-Ego')[0];
        
        let card = await CardDao.RetrieveRandomCard(false, heroData.aspects, true);
        
        let baseEmbed = CreateEmbed(`The hero for the **Deck of the Week** is [${hero.Name}](${BuildCardImagePath(hero)}) ([${alterEgo.Name}](${BuildCardImagePath(alterEgo)})) and the chosen aspect${heroData.aspects.length > 1 ? 's are' : ' is'} ${CreateStringFromArray(heroData.aspects.map(x => `**${x}**`))}!\n\n` +
            `The extra credit card is the ${card.Classification} ${card.Type} [${card.Name}](${BuildCardImagePath(card)}). Try using it in your build!`,
            COLORS[card.Classification],
            `Deck of the Week — ${GetDateString()}`
        );

        let attachments = [
            BuildCardImagePath(hero),
            BuildCardImagePath(alterEgo),
            BuildCardImagePath(card)
        ];

        channels.forEach(channelId => {
            let channel = guild.channels.resolve(channelId);

            if (channel) {
                let permissions = guild.members.me.permissionsIn(channelId);

                if (permissions.has(PermissionsBitField.Flags.ViewChannel) && permissions.has(PermissionsBitField.Flags.SendMessages) && permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    let ping = `It's time for the **Deck of the Week**!`;

                    if (role) {
                        ping = ping.replace('\*\*Deck of the Week\*\*', `<@&${role}>`);
                    }

                    if (permissions.has(PermissionsBitField.Flags.CreatePublicThreads)) {
                        channel.send({
                            embeds: [baseEmbed]
                        })
                        .then(message => {
                            message.startThread({
                                name: GetDateString(true)
                            })
                            .then(thread => {
                                thread.send({
                                    content: ping,
                                    files: attachments,
                                    allowedMentions: {
                                        parse: ['roles']
                                    }
                                })
                            });
                        });
                    }
                    else {
                        channel.send({
                            content: ping,
                            files: attachments,
                            allowedMentions: {
                                parse: ['roles']
                            },
                            embeds: [baseEmbed]
                        });
                    }
                }
            }
        });
    }
    catch (e) {
        ReportError(null, e);
    }
}