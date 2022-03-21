import { Airgram, Auth } from 'airgram';
import prompt from "prompt-sync";
import dotenv from "dotenv";
import { welcomeAtLoginText } from './variables.js';

const getLine = prompt();
dotenv.config();

function getAirgram(
    apiId = process.env.API_ID,
    apiHash = process.env.API_HASH,
    command = process.env.TDLIB_COMMAND,
    logVerbosityLevel = 0) {
    return new Airgram({
        // @ts-ignore
        apiId,
        apiHash,
        command,
        logVerbosityLevel,
    });
}

function authUser(airgram) {
    airgram.use(new Auth({
        phoneNumber: () => getLine(`Phone number: `),
        code: () => getLine(`Login code: `),
        password: () => getLine("Password: ", { echo: "*" })
    }))
}

async function welcomeAtLogin(airgram) {
    try {
        let me = await airgram.api.getMe();
        console.log(welcomeAtLoginText(me.response.firstName));
    } catch (error) {
        console.error("[Error while welcoming at login]");
        console.dir(error, { depth: null });
    }
}

export { getAirgram, authUser, welcomeAtLogin };