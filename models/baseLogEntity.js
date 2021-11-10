const { BaseEntity } = require('./baseEntity');

class BaseLogEntity extends BaseEntity {
    static DATABASE_SUFFIX = 'logs';

    constructor (document) {
        super(document);

        this.GuildId = document.GuildId;
        this.Timestamp = document.Timestamp;
        this.UserId = document.UserId;
    }
}

module.exports = { BaseLogEntity }