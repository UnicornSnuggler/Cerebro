class BaseMongoEntity {
    constructor (document) {
        if (document._id) this._id = document._id;
        if (document.created) this.created = document.created;
        if (document.updated) this.updated = document.updated;
    }
}

module.exports = { BaseMongoEntity }