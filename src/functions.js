import { Airgram, Auth } from 'airgram';
import prompt from "prompt-sync";
import dotenv from "dotenv";

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

function authUser(airgram){
    airgram.use(new Auth({
        phoneNumber: () => getLine(`Phone number: `),
        code: () => getLine(`Login code: `),
        password: () => getLine("Password: ",{echo:"*"})
    }))
}


export { getAirgram, authUser };