class BaseEntity
{
    constructor (document) {
        this.Deleted = document.Deleted;
        this.Id = document.Id;
    }
}

module.exports = { BaseEntity };