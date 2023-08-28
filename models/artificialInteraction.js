class ArtificialInteraction {
    constructor (official, terms) {
        this.getString = function(_) {
            if (_ === 'origin') {
                return official ? 'official' : 'unofficial';
            }
            else if (_ === 'name' || _ === 'title') {
                return terms;
            }
            else {
                return null;
            }
        };

        this.getBoolean = function(_) {
            return null;
        }

        this.getMentionable = function(_) {
            return null;
        }
    }
}

module.exports = { ArtificialInteraction }