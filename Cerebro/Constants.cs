using DSharpPlus.Entities;
using System;
using System.Collections.Generic;

namespace Cerebro
{
    public class Constants
    {
        // Configuration

        public const string CONFIG_STORAGE = "azure_connection_string";

        public const string CONFIG_TOKEN = "discord_token";

        // General

        public const string COMMAND_PREFIX = "/cerebro ";

        public const string BOT_MENTION = "<@!869071415322742835> ";

        public const string IMAGE_PREFIX = "https://loganstorage2020.blob.core.windows.net/cerebro-images/";

        public const int ID_LENGTH = 5;

        public const string TEST_USER = "132708937584607233";

        public const double TIMEOUT = 10;

        // Colors

        public static Dictionary<string, DiscordColor> COLORS = new Dictionary<string, DiscordColor>()
        {
            { "Aggression", new DiscordColor("FF3D3D") },
            { "Basic", new DiscordColor("DFDFDF") },
            { "Encounter", new DiscordColor("FF9100") },
            { "Hero", new DiscordColor("2337CF") },
            { "Justice", new DiscordColor("F9FC26") },
            { "Leadership", new DiscordColor("67CAFE") },
            { "Protection", new DiscordColor("6BEE5E") },
            { "Villain", new DiscordColor("BA00D6") }
        };

        // Emojis

        public const string AFFIRMATIVE_EMOJI = ":white_check_mark:";

        public const string ART_EMOJI = ":art:";

        public const string NEGATIVE_EMOJI = ":negative_squared_cross_mark:";

        public const string REPEAT_EMOJI = ":repeat:";

        public const string ONE_EMOJI = ":one:";

        public const string TWO_EMOJI = ":two:";

        public const string THREE_EMOJI = ":three:";

        public const string FOUR_EMOJI = ":four:";

        public const string FIVE_EMOJI = ":five:";

        public const string SIX_EMOJI = ":six:";

        public const string SEVEN_EMOJI = ":seven:";

        public const string EIGHT_EMOJI = ":eight:";

        public const string NINE_EMOJI = ":nine:";

        // Symbols

        public const string ACCELERATION_SYMBOL = "<:mc_acceleration:896032683266809876>";

        public const string BOOST_SYMBOL = "<:mc_boost:896031377701629953>";

        public const string CONSEQUENTIAL_SYMBOL = "<:mc_consequential:896032683266834432>";

        public const string CRISIS_SYMBOL = "<:mc_crisis:896032682901913621>";

        public const string ENERGY_SYMBOL = "<:mc_energy:896032683396837376>";

        public const string HAZARD_SYMBOL = "<:mc_hazard:896032683384266822>";

        public const string MENTAL_SYMBOL = "<:mc_mental:896032683384262706>";

        public const string PHYSICAL_SYMBOL = "<:mc_physical:896032683442995221>";

        public const string PLAYERS_SYMBOL = "<:mc_players:896032683476520980>";

        public const string STAR_SYMBOL = "<:mc_star:896032683480739860>";

        public const string UNIQUE_SYMBOL = "<:mc_unique:896031377919733760>";

        public const string WILD_SYMBOL = "<:mc_wild:896032683589779476>";

        // Card Text

        public static Dictionary<string, string> SYMBOLS = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "{a}", ACCELERATION_SYMBOL },
            { "{b}", BOOST_SYMBOL },
            { "{c}", CRISIS_SYMBOL },
            { "{d}", CONSEQUENTIAL_SYMBOL },
            { "{e}", ENERGY_SYMBOL },
            { "{h}", HAZARD_SYMBOL },
            { "{i}", PLAYERS_SYMBOL },
            { "{m}", MENTAL_SYMBOL },
            { "{p}", PHYSICAL_SYMBOL },
            { "{s}", STAR_SYMBOL },
            { "{u}", UNIQUE_SYMBOL },
            { "{w}", WILD_SYMBOL }
        };

        public static List<string> BOLDS = new List<string>()
        {
            "Give to the Carol Danvers player.",
            "Give to the Gamora player.",
            "Give to the Jennifer Walters player.",
            "Give to the Nebula player.",
            "Give to the Peter Parker player.",
            "Give to the Steve Rogers player.",
            "Give to the T'Challa player.",
            "Give to the Tony Stark player.",

            "If this stage is completed, the players lose the game.",

            "Action",
            "Alter-Ego",
            "Boost",
            "Contents",
            "First Player",
            "Forced",
            "Hero",
            "Interrupt",
            "Resource",
            "Response",
            "Setup",
            "Special",
            "When Defeated",
            "When Revealed",
        };

        public static List<string> ITALICS = new List<string>()
        {
            "\"Do You Even Lift?\"",
            "\"I Can Do This All Day!\"",
            "\"I Object!\"",
            "Combat Protocols",
            "Commander",
            "Cybernetic Upgrades",
            "Finesse",
            "Foresight",
            "Futurist",
            "Living Legend",
            "Precision",
            "Rechannel",
            "Scientist",
            "Shoot the Thrusters!",
            "Skilled Tactician",
            "Spider-Sense",

            "(Captain America's nemesis minion.)",
            "(Gamora's nemesis minion.)",
            "(Nebula's nemesis minion.)",

            "(Klaw (II) and Klaw (III) instead for expert mode.)",
            "(Nebula (II) and Nebula (III) instead for expert mode.)",
            "(Rhino (II) and Rhino (III) instead for expert mode.)",
            "(Ultron (II) and Ultron (III) instead for expert mode.)",

            "({b})",
            "({u})",
            "(Acceleration Icon: Place +1 threat on the main scheme at the start of the villain phase.)",
            "(After this card is revealed, reveal 1 additional encounter card.)",
            "(After this card resolves, reveal 1 additional encounter card.)",
            "(After this character is attacked, deal 1 damage to the attacking character.)",
            "(After this character is attacked, deal 2 damage to the attacking character.)",
            "(After this minion engages your hero, it attacks.)",
            "(as you choose)",
            "(ATK)",
            "(attack)",
            "(attack/defense/thwart)",
            "(attack/thwart)",
            "(blue)",
            "(Crisis Icon: While this scheme is in play, you cannot remove threat from the main scheme.)",
            "(DEF)",
            "(defense)",
            "(Discard any tough status cards from the target before dealing damage.)",
            "(Enters play with 3 counters. When those are gone, discard this card.)",
            "(Excess damage from this attack is dealt to the villain.)",
            "(Excess damage to an ally from this attack is dealt to that ally's controller.)",
            "(flip your identity card)",
            "(gray)",
            "(green)",
            "(Hazard Icon: Deal +1 encounter card during the villain phase.)",
            "(If the Gamora hero or ally is in play, she resolves her ATK against you without exhausting.)",
            "(in the order of your choice)",
            "(Max 2 restricted cards per player.)",
            "(paying his resource cost)",
            "(Play the \"Wakanda Forever!\" event to use this ability.)",
            "(Ranged attacks ignore retaliate.)",
            "(red)",
            "(Resolving each ability is a step in a sequence.)",
            "(Shuffle the encounter deck.)",
            "(the damage under THW or ATK)",
            "(This allows you to control more than 3 allies.)",
            "(This character enters play with a tough status card.)",
            "(THW)",
            "(thwart)",
            "(using your ATK)",
            "(using your DEF)",
            "(using your THW)",
            "(When this card is revealed, place 1 threat on the main scheme.)",
            "(When this scheme is defeated, Klaw loses these hit points.)",
            "(While this minion is engaged with you, you cannot attack the villain.)",
            "(yellow)",
        };

        public static List<string> EMPHASES = new List<string>()
        {
            "Aerial",
            "Android",
            "Armor",
            "Asgard",
            "Assassin",
            "Attack",
            "Attorney",
            "Avenger",
            "Black Panther",
            "Brute",
            "Champion",
            "Condition",
            "Cosmic Entity",
            "Criminal",
            "Cyborg",
            "Defender",
            "Defense",
            "Drone",
            "Elite",
            "Gamma",
            "Genius",
            "Giant",
            "Guardian",
            "Hero for Hire",
            "Hydra",
            "Inhuman",
            "Item",
            "King",
            "Kree",
            "Location",
            "Masters of Evil",
            "Mercenary",
            "Mystic",
            "Olympus",
            "Outlaw",
            "Persona",
            "Preparation",
            "Scoundrel",
            "S.H.I.E.L.D.",
            "Skill",
            "Soldier",
            "Spell",
            "Spy",
            "Superpower",
            "Tactic",
            "Team",
            "Technique",
            "Tech",
            "Thwart",
            "Title",
            "Trait",
            "Vampire",
            "Vehicle",
            "Wakanda",
            "Weapon",
        };

        public static Dictionary<string, string> OVERRIDES = new Dictionary<string, string>()
        {
            { "(except for Traits)", "*(except for **Traits**)*" },
            { "(recommended: Bomb Scare)", "*(recommended: Bomb Scare)*" },
            { "(recommended: Masters of Evil)", "*(recommended: Masters of Evil)*" },
            { "(Space Pirates)", "*(Space Pirates)*" },
            { "(recommended: Under Attack)", "*(recommended: Under Attack)*" },

            { "Skilled Tactician", "*Skilled Tactician*" },
            { "Technique", "***Technique***" },

            { "Defense Network", null },
            { "Hero form only.", null },
            { "Hydra Patrol", null },
            { "Experimental Weapons", null },
            { "Legions of Hydra", null },
            { "Madame Hydra", null },
            { "Team-Up", null },
            { "Ultron Drones environment", null },
            { "Weapon Master", null },
        };
    }
}