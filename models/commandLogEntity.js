const { BaseLogEntity } = require('./baseLogEntity');

class CommandLogEntity extends BaseLogEntity {
    static COLLECTION = 'commands';

    constructor (document) {
        super(document);

        this.Command = document.Command;
        this.Options = document.Options;
        this.Shorthand = document.Shorthand;
    }
}

module.exports = { CommandLogEntity }