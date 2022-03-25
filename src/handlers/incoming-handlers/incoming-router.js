
import { allowedUserIdsRange, serviceMessageTexts } from "../../../config.js";
import { getLogTime } from "../../commons/functions.js";
import User from "../../entities/user.js";
import { userCommands } from "./variables.js";
import notServingHandler from "./not-serving-handler.js";
import movieSearchHandler from "./movie-search-handler.js";
import registrationHandler from "./registration-handler.js";
import userCommandsHandler from "./user-commands-handler.js";
import { commandsRegex } from "../../commons/variables.js";

export default async function incomingHandler(airgram, message) {
    let { chatId: userId, id: messageId } = message;
    let userType;
    try {
        let incomingFromUser = await airgram.api.getUser({ userId });
        if (incomingFromUser._ != "error" && incomingFromUser.response._ != "error") {
            userType = incomingFromUser.response.type?._;
        }
    } catch (error) { }
    if (userType != "userTypeRegular") {
        // None-Private Chats will be ignored
        return;
    } else {
        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[New Incoming Message]`);
        if (userId < allowedUserIdsRange.min || userId > allowedUserIdsRange.max) {
            notServingHandler(airgram, messageId, userId, serviceMessageTexts.yourIdIsOutOfRange, "User_Id_Out_Of_Range");
        } else {
            const user = new User(userId);
            if (user.blocked) {
                notServingHandler(airgram, messageId, userId, serviceMessageTexts.youAreBlocked, "Blocked_User");
            } else if (!user.approved) {
                notServingHandler(airgram, messageId, userId, serviceMessageTexts.waitForAdminApproval), "Unapproved_User";
            } else {
                let text = message.content.text?.text;
                if (text) {
                    let commandMatch = text.match(commandsRegex);
                    let command = commandMatch?.[0].trim().toLowerCase()
                    if (command && userCommands.includes(command)) {
                        return userCommandsHandler(airgram, message, command)
                    }
                }
                if (!user.confirmed) {
                    registrationHandler(airgram, message, user);
                } else {
                    movieSearchHandler(airgram, message, user);
                }
            }
        }
    }
}