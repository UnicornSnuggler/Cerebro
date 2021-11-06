class ArtificialInteraction {
    constructor (subcommand, official, terms) {
        this.getBoolean = function(_) {
            return official;
        };

        this.getString = function(_) {
            return terms;
        };

        this.getSubcommand = function(_) {
            return subcommand;
        };
    }
}

module.exports = { ArtificialInteraction }