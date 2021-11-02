class PrintingEntity
{
    static INDEX_NAME = 'cerebroprintings-index';

    constructor (tableEntity) {
        this.AlternateArt = tableEntity.AlternateArt;
        this.ArtificialId = tableEntity.ArtificialId;
        this.CardId = tableEntity.RowKey;
        this.Pack = null;
        this.PackId = tableEntity.PackId ? tableEntity.PackId : null;
        this.PackNumber = tableEntity.PackNumber ? tableEntity.PackNumber : null;
        this.Set = null;
        this.SetName = tableEntity.PartitionKey;
        this.SetNumber = tableEntity.SetNumber;
    }
};

module.exports = { PrintingEntity };