using DSharpPlus.Entities;
using System;
using System.Collections.Generic;

namespace Cerebro
{
    public class Constants
    {
        public const string CONFIG_TOKEN = "discord_token";

        // General

        public const string BOT_MENTION = "<@!869071415322742835> ";

        public const string COMMAND_PREFIX = "/cerebro ";

        public const int ID_LENGTH = 5;

        public const string IMAGE_PREFIX = "https://cerebrodatastorage.blob.core.windows.net/cerebro-images/";

        public const string OWNER_MENTION = "<@!132708937584607233>";

        public const double TIMEOUT = 15;

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

        public const string ARROW_LEFT_EMOJI = ":arrow_left:";

        public const string ARROW_RIGHT_EMOJI = ":arrow_right:";

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

        public const string AMPLIFY_SYMBOL = "<:mc_amplify:898957049000505354>";

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
            { "{w}", WILD_SYMBOL },
            { "{y}", AMPLIFY_SYMBOL }
        };
    }
}