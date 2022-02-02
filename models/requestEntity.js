const { BaseEntity } = require('./baseEntity');

class RequestEntity extends BaseEntity {
    static DATABASE_SUFFIX = 'requests';

    constructor (document) {
        super(document);

        this.Description = document.Description;
        this.Flag = document.Flag;
        this.Link = document.Link;
        this.Reasoning = document.Reasoning;
        this.Stability = document.Stability;
        this.Timestamp = document.Timestamp;
        this.Title = document.Title;
        this.Type = document.Type;
        this.UserId = document.UserId;
    }
}

module.exports = { RequestEntity }