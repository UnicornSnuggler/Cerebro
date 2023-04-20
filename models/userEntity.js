const { BaseMongoEntity } = require('./baseMongoEntity');

class UserEntity extends BaseMongoEntity {
    static DATABASE = 'cerebrousers';
    static COLLECTION = 'users';

    constructor (document) {
        super(document);

        if (document.username) this.username = document.username;
        if (document.emailAddress) this.emailAddress = document.emailAddress;
        if (document.passwordHash) this.passwordHash = document.passwordHash;
        if (document.discordId) this.discordId = document.discordId;
    }
}

module.exports = { UserEntity }