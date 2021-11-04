class PrintingEntity
{
    constructor (document) {
        this.ArtificialId = document.ArtificialId;
        this.PackId = document.PackId;
        this.PackNumber = document.PackNumber;
        this.SetId = document.SetId;
        this.SetNumber = document.SetNumber;
        this.UniqueArt = document.UniqueArt;
    }
};

module.exports = { PrintingEntity };