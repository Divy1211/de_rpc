import child_proc from "child_process";
import RPC from "discord-rpc";
import dotenv from "dotenv";
import {promisify} from "util";
import {getLobby, getLobbyDetails} from "./find_lobby";
import {getMatch, getMatchDetails, loadStrings} from "./find_match";
import {getSteamId} from "./steam_id";
import {ensure} from "./utils/general";

dotenv.config();

const exec = promisify(child_proc.exec);
const client = new RPC.Client({transport: "ipc"});

RPC.register(ensure(process.env.ID));

async function setActivity() {
    const test = await exec("tasklist");
    if (!test.stdout.includes(`AoE2DE_s.exe`))
        return;

    const steamId = await getSteamId();

    const match = await getMatch(steamId);
    if (match) {
        const {gameMode, mapCiv, startTimestamp, matchId} = getMatchDetails(match, steamId);
        await client.setActivity({
            details: gameMode,
            state: mapCiv,
            startTimestamp,
            instance: true,
            buttons: [
                {
                    label: "Spectate",
                    url: `aoe2de://1/${matchId}`,
                },
            ],
        });
        return;
    }

    const lobby = await getLobby(steamId);
    if(!lobby) {
        await client.setActivity({
            details: "In the main menu or",
            state: "maybe in the ranked queue",
            instance: false,
        });
        return;
    }

    const {name, mapOrCs, matchId} = getLobbyDetails(lobby);

    await client.setActivity({
        details: name,
        state: mapOrCs,
        instance: false,
        buttons: [
            {
                label: "Join",
                url: `aoe2de://0/${matchId}`,
            },
            {
                label: "Spectate",
                url: `aoe2de://1/${matchId}`,
            },
        ],
    });
}

client.on("ready", async () => {
    await loadStrings();
    await setActivity();
    console.log("Starting Loop");
    setInterval(setActivity, 15 * 1000);
});

client.login({clientId: ensure(process.env.ID)}).then();