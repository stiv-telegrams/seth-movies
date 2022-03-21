import fs from "fs";
import path from "path";
const { allowedUserIdsRange, serviceMessageTexts } = JSON.parse(fs.readFileSync(path.resolve("config.json"), "utf-8"));
import User from "../../modules/user.js";
import notServingHandler from "./not-serving-handler.js";
import registeredUserHandler from "./registered-user-handler.js";
import registrationHandler from "./registration-handler.js";

export default function incomingHandler(airgram, message) {
    let userId = message.chatId;
    if (userId < 0) {
        // None-Private Chats will be ignored
        return;
    } else if (userId < allowedUserIdsRange.min || userId > allowedUserIdsRange.max) {
        notServingHandler(airgram, userId, serviceMessageTexts.yourIdIsOutOfRange);
    } else {
        const user = new User(userId);
        if (user.blocked) {
            notServingHandler(airgram, userId, serviceMessageTexts.youAreBlocked);
        } else if (!user.approved) {
            notServingHandler(airgram, userId, serviceMessageTexts.waitForAdminApproval);
        } else if (!user.confirmed) {
            registrationHandler(airgram, user);
        } else{
            registeredUserHandler(airgram, user);
        }
    }
}