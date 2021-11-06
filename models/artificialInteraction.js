class ArtificialInteraction {
    constructor (subcommand, official, terms) {
        this.getString = function(_) {
            return terms;
        };
        
        this.getSubcommand = function(_) {
            return subcommand;
        };

        this.getSubcommandGroup = function(_) {
            return official ? 'official' : 'unofficial';
        };
    }
}

module.exports = { ArtificialInteraction }