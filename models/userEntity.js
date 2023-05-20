const { BaseMongoEntity } = require('./baseMongoEntity');

class UserEntity extends BaseMongoEntity {
    static DATABASE = 'cerebrousers';
    static COLLECTION = 'users';

    constructor (document) {
        super(document);

        if (document.hasOwnProperty('discordId')) this.discordId = document.discordId;
        if (document.hasOwnProperty('emailAddress')) this.emailAddress = document.emailAddress;
        if (document.hasOwnProperty('passwordHash')) this.passwordHash = document.passwordHash;
        if (document.hasOwnProperty('username')) this.username = document.username;
    }
}

module.exports = { UserEntity }