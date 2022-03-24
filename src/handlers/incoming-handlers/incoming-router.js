// import fs from "fs";
// import path from "path";
import { getLogTime } from "../../commons/functions.js";
// const { allowedUserIdsRange, serviceMessageTexts } = JSON.parse(fs.readFileSync(path.resolve("config.json"), "utf-8"));
import { allowedUserIdsRange, serviceMessageTexts } from "../../../config.js";
import User from "../../modules/user.js";
import notServingHandler from "./not-serving-handler.js";
import registeredUserHandler from "./registered-user-handler.js";
import registrationHandler from "./registration-handler.js";

export default async function incomingHandler(airgram, message) {
    let userId = message.chatId;
    let messageId = message.id;
    let userType;
    try {
        let incomingFromUser = await airgram.api.getUser({ userId });
        if (incomingFromUser._ != "error" && incomingFromUser.response._ != "error") {
            userType = incomingFromUser.response.type?._;
        }
    } catch (error) {}
    if (userType != "userTypeRegular") {
        // None-Private Chats will be ignored
        return;
    } else {
        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[New Private Chat Message]`);
        if (userId < allowedUserIdsRange.min || userId > allowedUserIdsRange.max) {
            notServingHandler(airgram, messageId, userId, serviceMessageTexts.yourIdIsOutOfRange, "User_Id_Out_Of_Range");
        } else {
            const user = new User(userId);
            if (user.blocked) {
                notServingHandler(airgram, messageId, userId, serviceMessageTexts.youAreBlocked, "Blocked_User");
            } else if (!user.approved) {
                notServingHandler(airgram, messageId, userId, serviceMessageTexts.waitForAdminApproval), "Unapproved_User";
            } else if (!user.confirmed) {
                registrationHandler(airgram, message, user);
            } else {
                registeredUserHandler(airgram, message, user);
            }
        }
    }
}