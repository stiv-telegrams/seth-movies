
import color from "cli-color";
import { getAirgram, authUser, welcomeAtLogin, getAllChats, stringifyAirgramResponse, getLogTime } from "./src/commons/functions.js";
import deletedMessagesHandler from "./src/handlers/deleted-messages-handler.js";
import incomingHandler from "./src/handlers/incoming-handlers/incoming-router.js";
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