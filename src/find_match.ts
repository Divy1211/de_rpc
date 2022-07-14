import fetch from "node-fetch";
import {Match} from "./interfaces/match";
import {Strings} from "./interfaces/strings";
import {ensure} from "./utils/general";

export async function getMatch(steamId: string): Promise<Match | undefined> {
    let match: Match;
    try {
        match = (await (await fetch(
            `https://aoe2.net/api/player/lastmatch?game=aoe2de&steam_id=${steamId}`,
        )).json()).last_match;
    } catch (error) {
        console.log("Unable To Reach aoe2.net");
        return;
    }
    if (!match.finished)
        return match;
}

export let gameInfo: Strings;

export async function loadStrings(): Promise<void> {
    while (!gameInfo) {
        console.log("Loading Strings");
        try {
            gameInfo = await (await fetch("https://aoe2.net/api/strings?game=aoe2de&language=en")).json();
        } catch (error) {
            console.log("Unable To Reach aoe2.net");
        }
    }
}

export const gameTypeAcronyms = {
    0: "RM",
    1: "RG",
    2: "DM",
    3: "CS",
    6: "KotH",
    7: "WR",
    8: "DtW",
    9: "TRM",
    10: "CtR",
    11: "SD",
    12: "BR",
    13: "EW",
    15: "Co-Op",
};
export const coopMapNames = {
    35319: "HB: Tours (732)",
    35321: "HB: Hastings (1066)",
    35612: "HB: Honfoglalás (895)",
    35613: "HB: Kurikara (1183)",
    35615: "HB: Bapheus (1302)",
    34959: "S: An Arabian Knight",
    34960: "S: Lord of Arabia",
    34961: "S: The Horns of Hattin",
    34962: "S: The Siege of Jerusalem",
    34963: "S: Jihad!",
    34964: "S: The Lion and the Demon",
    35229: "AtH: The Scourge of God",
    35230: "AtH: The Great Ride",
    35231: "AtH: The Walls of Constantinople",
    35232: "AtH: A Barbarian Betrothal",
    35233: "AtH: The Catalaunian Fields",
    35234: "AtH: The Fall of Rome",
    35429: "A: The Battle of the Frigidus",
    35430: "A: Razing Hellas",
    35431: "A: The Belly of the Beast",
    35432: "A: The Giant Falls",
    35433: "A: A Kingdom of Our Own",
    35618: "TiZ: The Battle of Guadalete",
    35619: "TiZ: Consolidation and Subjugation",
    35620: "TiZ: Divide and Conquer",
    35621: "TiZ: Crossing the Pyrenees",
    35622: "TiZ: Razzia",
    73405: "SI: Usurpation",
    73406: "SI: Quelling the Rebellion",
    73407: "SI: A Dangerous Mission",
    73408: "SI: Challenging a Thalassocracy",
    73409: "SI: Nirvanapada",
    73421: "T: Amir of Transoxiana",
    73422: "T: Gurkhan of Persia",
    73423: "T: Harbinger of Destruction",
    73424: "T: Sultan of Hindustan",
    73425: "T: Scourge of the Levant",
    73426: "T: A Titan Amongst Mortals",
};
export const gameTypes = {
    0: `UR REPLACE_GAME_TYPE`,
    1: `DM`,
    2: `TDM`,
    3: `RM`,
    4: `TRM`,
    13: `EW`,
    14: `TEW`,
};

export function getMatchDetails(
    match: Match, steamId: string,
): {gameMode: string, mapCiv: string, startTimestamp: number, matchId: string} {
    const countNumTeams = [0, 0, 0, 0, 0];
    let civ = "Unknown";
    for (const player of match.players) {
        if (!player.team)
            throw new TypeError("Something went very wrong");

        if (player.team < 1 || player.team > 5)
            player.team = 0;

        ++countNumTeams[player.team];

        if (player.steam_id === steamId && player.civ !== null && player.civ < gameInfo.civ.length)
            civ = gameInfo.civ[player.civ - 1].string;
    }
    let vsType = "1v".repeat(ensure(countNumTeams.shift())).slice(0, -1);
    for (const numPlayers of countNumTeams) {
        if (numPlayers > 0)
            vsType += `v${numPlayers}`;
    }
    vsType = vsType.replace(/^v/, "");

    const size = gameInfo.map_size[match.map_size].string;
    const gameType = gameTypeAcronyms[match.game_type];
    let cs: string | undefined;
    if (typeof match.scenario === "number")
        cs = coopMapNames[match.scenario];
    else if (typeof match.scenario === "string")
        cs = match.scenario.slice(0, -13);

    let map: string | undefined;

    if (match.map_type != 59) {
        for (const mapType of gameInfo.map_type) {
            if (mapType.id == match.map_type) {
                map = mapType.string;
                break;
            }
        }
    } else {
        map = ensure(match.rms).slice(0, -4);
    }

    if (map)
        map += ` ${size}`;

    const type = gameTypes[match.leaderboard_id ?? 0].replace("REPLACE_GAME_TYPE", `${gameType}`);

    return {
        gameMode: `Playing ${type} ${vsType}`,
        mapCiv: `on ${cs || map || "Unknown"} as ${civ}`,
        startTimestamp: ensure(match.started),
        matchId: match.match_id,
    };
}