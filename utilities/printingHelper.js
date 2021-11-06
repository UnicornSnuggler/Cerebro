const { PackDao } = require('../dao/packDao');
const { SetDao } = require('../dao/setDao');

exports.Summary = function(printing) {
    let pack = printing.PackId ? PackDao.PACKS.find(x => x.Id === printing.PackId) : null;
    let set = SetDao.SETS.find(x => x.Id === printing.SetId);

    if (set.Incomplete) return "[Redacted]";

    let summary = `${set.Name} #${printing.SetNumber}`;

    if (pack) {
        summary += `, ${pack.Name}`;

        if (printing.PackNumber) summary += ` #${printing.PackNumber}`;
    }

    return summary;
}