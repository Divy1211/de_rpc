import fetch from "node-fetch";
import {coopMapNames, gameInfo} from "./find_match";
import {Match} from "./interfaces/match";
import {ensure} from "./utils/general";

export async function getLobby(steamId: string): Promise<Match | undefined> {
    let lobbies: Match[];
    try {
        lobbies = await (await fetch("https://aoe2.net/api/lobbies?game=aoe2de")).json();
    } catch (error) {
        console.log("Unable To Reach aoe2.net");
        return;
    }
    if (!lobbies)
        return;

    for (const lobby of lobbies) {
        for (const pSteamId of lobby.players.map((player: any) => player.steam_id)) {
            if (steamId === pSteamId)
                return lobby;
        }
    }
}

export function getLobbyDetails(lobby: Match): {name: string, mapOrCs: string, matchId: string} {
    const size = gameInfo.map_size[lobby.map_size].string;
    let cs: string | undefined;
    if (typeof lobby.scenario === "number")
        cs = coopMapNames[lobby.scenario];
    else if (typeof lobby.scenario === "string")
        cs = lobby.scenario.slice(0, -13);

    let map: string | undefined;

    if (lobby.map_type != 59) {
        for (const mapType of gameInfo.map_type) {
            if (mapType.id == lobby.map_type) {
                map = mapType.string;
                break;
            }
        }
    } else {
        map = ensure(lobby.rms).slice(0, -4);
    }

    if (map)
        map += ` ${size}`;

    if (cs)
        lobby.name = lobby.name.replace(` [${cs}]`, "");

    return {
        name: `[${lobby.match_id}] ${lobby.name} (${lobby.num_players}/${lobby.num_slots})`,
        mapOrCs: `${cs || map || "Unknown"}`,
        matchId: lobby.match_id,
    };
}