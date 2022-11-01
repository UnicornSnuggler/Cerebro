const { PackDao } = require('../dao/packDao');
const { CreateEmbed } = require('./messageHelper');
const { COLORS } = require('../constants')
const { CardDao } = require('../dao/cardDao');
const { BuildCardImagePath, GetPrintingByArtificialId } = require('./cardHelper');
const { LogDao } = require('../dao/logDao');
const { GetDateString } = require('./dateHelper');
const { ConfigurationDao } = require('../dao/configurationDao');
const { ReportError } = require('./errorHelper');
const { PermissionsBitField } = require('discord.js');

exports.cardOfTheDayLoop = async function cardOfTheDayLoop(client) {
    for (let [guildId, data] of Object.entries(ConfigurationDao.CONFIGURATION.CardOfTheDay)) {
        let guild = client.guilds.resolve(guildId);

        if (guild) {
            await cardOfTheDay(guild, data.channels, data.role);
        }
    }
}

const cardOfTheDay = exports.cardOfTheDay = async function(guild, channels, role) {
    try {
        let now = new Date();
        let encounter = now.getMonth() === 9 && now.getDate() >= 18;

        let card = await CardDao.RetrieveRandomCard(encounter);
        let queryCount = await LogDao.RetrieveLogCountByCardId(card.Id);
        let firstPrinting = GetPrintingByArtificialId(card, card.Id);
        let pack = PackDao.PACKS.find(x => x.Id === firstPrinting.PackId);
        let reprints = card.Printings.length - 1;
        
        let baseEmbed = CreateEmbed(`The **${encounter ? 'Spooky ' : ''}Card of the Day** is [${card.Name}](${BuildCardImagePath(card)})!\n\n` +
            `This card first debuted in the **${pack.Name}${pack.Type !== 'Core Set' ? ` ${pack.Type}` : ''}**.\n` +
            `${reprints > 0 ? `It has since been reprinted ${reprints} time${reprints === 1 ? '' : 's'}.` : 'It has never been reprinted.'}\n\n` +
            `${queryCount > 0 ? `Cerebro users have collectively queried for this card ${queryCount} time${queryCount === 1 ? '' : 's'}.` : 'Cerebro users have never queried for this card.'}`,
            COLORS[card.Classification],
            `Card of the Day — ${GetDateString()}${encounter ? ' :ghost:' : ''}`
        );

        baseEmbed.setImage(BuildCardImagePath(card));

        channels.forEach(channelId => {
            let channel = guild.channels.resolve(channelId);

            if (channel) {
                let permissions = guild.members.me.permissionsIn(channelId);

                if (permissions.has(PermissionsBitField.Flags.ViewChannel) && permissions.has(PermissionsBitField.Flags.SendMessages) && permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    let ping = `It's time for the **Card of the Day**!`;

                    if (role) {
                        ping = ping.replace('\*\*Card of the Day\*\*', `<@&${role}>`);
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