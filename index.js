import { getAirgram, authUser, welcomeAtLogin } from "./src/commons/functions.js";
import deletedMessagesHandler from "./src/handlers/deleted-messages-handler.js";
import incomingHandler from "./src/handlers/incoming-handlers/incoming-router.js";
import outgoingHandler from "./src/handlers/outgoing-handlers/outgoing-router.js";

const airgram = getAirgram();
authUser(airgram);

async function main() {
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

main();