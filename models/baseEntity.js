class BaseEntity {
    constructor (document) {
        this.Deleted = document.Deleted;
        this.Id = document.id;
    }
}

module.exports = { BaseEntity }