const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');

exports.Summary = function(printing, spoilerFree = false) {
    let pack = printing.PackId ? PackDao.PACKS.find(x => x.Id === printing.PackId) : null;
    let set = SetDao.SETS.find(x => x.Id === printing.SetId);

    if (!spoilerFree && pack.Incomplete) return "[Redacted]";

    let summary = `${pack.Name} #${printing.PackNumber}`;

    if (set) {
        summary += `, ${set.Name}`;

        if (printing.SetNumber) summary += ` #${printing.SetNumber}`;
    }

    return summary;
}