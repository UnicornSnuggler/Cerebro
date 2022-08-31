const { PackDao } = require('../dao/packDao');
const { CreateEmbed } = require('./messageHelper');
const { COLORS } = require('../constants')
const { CardDao } = require('../dao/cardDao');
const { BuildCardImagePath, GetPrintingByArtificialId } = require('./cardHelper');
const { LogDao } = require('../dao/logDao');
const { GetDateString } = require('./dateHelper');
const { ConfigurationDao } = require('../dao/configurationDao');
const { ReportError } = require('./errorHelper');

exports.triviaLoop = async function triviaLoop(client) {
    for (let [guildId, data] of Object.entries(ConfigurationDao.CONFIGURATION.Trivia)) {
        let guild = client.guilds.resolve(guildId);

        if (guild) {
            await trivia(guild, data.channels, data.role);
        }
    }
}

const trivia = exports.trivia = async function(guild, channels, role) {
    try {
        let card = await CardDao.RetrieveRandomCard();
        // let queryCount = await LogDao.RetrieveLogCountByCardId(card.Id);
        let firstPrinting = GetPrintingByArtificialId(card, card.Id);
        let pack = PackDao.PACKS.find(x => x.Id === firstPrinting.PackId);
        let reprints = card.Printings.length - 1;
        
        let baseEmbed = CreateEmbed(`The **Card of the Day** is [${card.Name}](${BuildCardImagePath(card)})!\n\n` +
            `This card first debuted in the **${pack.Name}${pack.Type !== 'Core Set' ? ` ${pack.Type}` : ''}**.\n` +
            `${reprints > 0 ? `It has since been reprinted ${reprints} time${reprints === 1 ? '' : 's'}.` : 'It has never been reprinted.'}\n\n` +
            `${queryCount > 0 ? `Cerebro users have collectively queried for this card ${queryCount} time${queryCount === 1 ? '' : 's'}.` : 'Cerebro users have never queried for this card.'}`,
            COLORS[card.Classification],
            `Card of the Day — ${GetDateString()}`
        );

        baseEmbed.setImage(BuildCardImagePath(card));

        channels.forEach(channelId => {
            let channel = guild.channels.resolve(channelId);

            if (channel) {
                let permissions = guild.me.permissionsIn(channelId);

                if (permissions.has('VIEW_CHANNEL') && permissions.has('SEND_MESSAGES') && permissions.has('MANAGE_MESSAGES')) {
                    let ping = `It's time for the **Card of the Day**!`;

                    if (role) {
                        ping = ping.replace('\*\*Card of the Day\*\*', `<@&${role}>`);
                    }

                    if (permissions.has('CREATE_PUBLIC_THREADS')) {
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
        ReportError(context, e);
    }
}