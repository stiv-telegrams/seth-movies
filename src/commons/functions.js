import { Airgram, Auth } from 'airgram';
import prompt from "prompt-sync";
import color from "cli-color";
import dotenv from "dotenv";
import { welcomeAtLoginText } from './variables.js';

const getLine = prompt();
dotenv.config();

/**
 * returns the current time formatted for logging
 */
function getLogTime() {
    let now = new Date().toISOString();
    now = now.replace("Z", "").replace(/\-/g, ":").replace("T", " | ");
    now = now.split(".")[0];
    now = now.substring(now.indexOf(":") + 1, now.lastIndexOf(":"))
    return color.blue("[" + now + "]");
}

/**
 * returns an airgram object
 */
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

async function sendMessage(airgram, chatId, content, options) {
    if (!chatId) {
        return { success: false, reason: "CHAT_ID_NOT_SPECIFIED" };
    } else if (!content) {
        return { success: false, reason: "CONTENT_NOT_SPECIFIED" };
    }
    let type = content.type;
    if (!type) {
        return { success: false, reason: "CONTENT_TYPE_NOT_SPECIFIED" };
    }
    let params;
    switch (type) {
        case "text":
            let text = content.text;
            if (!text) {
                return { success: false, reason: "MESSAGE_TEXT_NOT_SPECIFIED" };
            }
            params = {
                chatId,
                inputMessageContent: {
                    _: "inputMessageText",
                    text: {
                        _: "formattedText",
                        text
                    }
                }
            }
            break;
        default:
            return { success: false, reason: "UNSUPPORTED_CONTENT_TYPE" };
    }
    let result;
    try {
        result = await airgram.api.sendMessage(params);
    } catch (error) {
        return { success: false, reason: error };
    }
    if (result._ == "error" || result.response._ == "error") {
        return { success: false, reason: result };
    } else {
        return { success: true, result: result.response }
    }
}

async function deleteMessages(airgram, chatId, messageIds, revoke = true) {
    let params = {
        chatId,
        messageIds,
        revoke
    }
    let result;
    try {
        result = await airgram.api.deleteMessages(params);
    } catch (error) {
        return { success: false, reason: error };
    }
    if (result._ == "error" || result.response._ == "error") {
        return { success: false, reason: result };
    } else {
        return { success: true, result: result.response }
    }
}

/**
 * removes the airgram object from the airgram 
 * api response while stringify the response object
 */
function removeAirgram(key, value) {
    if (key == "airgram") return undefined;
    else return value;
}

function stringifyAirgramResponse(airgramResponse) {
    return JSON.stringify(airgramResponse, removeAirgram, 2);
}

export { getLogTime, getAirgram, authUser, welcomeAtLogin, sendMessage, deleteMessages, stringifyAirgramResponse };