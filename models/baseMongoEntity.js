class BaseMongoEntity {
    constructor (document) {
        if (document.hasOwnProperty('_id')) this._id = document._id;
        if (document.hasOwnProperty('created')) this.created = document.created;
        if (document.hasOwnProperty('updated')) this.updated = document.updated;
    }
}

module.exports = { BaseMongoEntity }