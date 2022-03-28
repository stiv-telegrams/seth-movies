
import color from "cli-color";
import { serviceMessageTexts } from "../../config.js";
import { getLogTime, stringifyAirgramResponse } from "../commons/functions.js";
import User from "../entities/user.js";
export default async function deletedMessagesHandler(airgram, deletedMessages) {
    let chatId = deletedMessages.update.chatId;
    let user = new User(chatId);
    if (user.confirmed && user.approved) {
        console.log("\n" + getLogTime(), `[${chatId}]`, `[User Deleted A Message]`);
        user.approved = false;
        try {
            await user.save();
            console.log(getLogTime(), `[${chatId}]`, `[User Got Unapproved]`);
            let youJustGotUnapprovedMessageContent = {
                type: "text",
                text: serviceMessageTexts.youJustGotUnapproved
            }
            let youJustGotUnapprovedMessageResult = await user.sendMessage(airgram, youJustGotUnapprovedMessageContent);
            if (!youJustGotUnapprovedMessageResult.success) {
                console.error(getLogTime(), `[${chatId}]`, color.red(`[Error while 'Sending youJustGotUnapproved Message']`), "\n", stringifyAirgramResponse(youJustGotUnapprovedMessageResult.reason));
            } else {
                console.log(getLogTime(), `[${chatId}]`, `[Sent youJustGotUnapproved Message]`);
            }
        } catch (error) {
            console.error(getLogTime(), `[${chatId}]`, color.red(`[Error while 'Unapproving A User']`), "\n", error);
        }
    }
}