
import color from "cli-color";
import { postChannelIds } from "./config.js";
import { getAirgram, authUser, welcomeAtLogin, getAllChats, stringifyAirgramResponse, getLogTime } from "./src/commons/functions.js";
import { commandsRegex } from "./src/commons/variables.js";
import deletedMessagesHandler from "./src/handlers/deleted-messages-handler.js";
import incomingHandler from "./src/handlers/incoming-handlers/incoming-router.js";
import newMovieHandler from "./src/handlers/new-movie-handler.js";
import outgoingHandler from "./src/handlers/outgoing-handlers/outgoing-router.js";

const airgram = getAirgram();
authUser(airgram);

async function main() {
    console.log("Starting...")
    let allChats = await getAllChats(airgram);
    if (!allChats.success) {
        console.error(getLogTime(), color.red(`[Error while 'Getting All Chats']`), "\n", stringifyAirgramResponse(allChats.reason));
        process.exit();
    } else {
        // @ts-ignore
        allChats = {};
        await welcomeAtLogin(airgram);
        airgram.on("updateNewMessage", update => {
            let message = update.update.message;
            let { chatId, id } = message;
            if (Object.keys(postChannelIds).includes("" + chatId)) {
                // @ts-ignore
                let caption = message.content.caption?.text;
                if (message.content._ == "messageVideo" && caption) {
                    let commandMatch = caption.match(commandsRegex);
                    if (commandMatch && commandMatch[0].trim().toLowerCase() == "#newmovie") {
                        console.log("\n" + getLogTime(), `[${chatId} | ${id}]`, `[New #NewMovie Message]`);
                        return newMovieHandler(airgram, message, caption);
                    }
                }
            }
            if (message.isOutgoing) {
                outgoingHandler(airgram, message);
            } else {
                incomingHandler(airgram, message);
            }
        });

        airgram.on("updateDeleteMessages", update => {
            deletedMessagesHandler(airgram, update);
        })
    }
}

main();