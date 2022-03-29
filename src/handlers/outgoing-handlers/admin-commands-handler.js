
import color from "cli-color";
import { serviceMessageTexts } from "../../../config.js";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";
import User from "../../entities/user.js";
export default async function adminCommandsHandler(airgram, message, command) {
    let chatId = message.chatId;
    let user;
    switch (command) {
        case "#approve":
            user = new User(chatId);
            if (!user.approved) {
                user.approved = true;
                try {
                    await user.save();
                    console.log("\n" + getLogTime(), `[${chatId}]`, `[User Got Approved]`);
                } catch (error) {
                    console.error(getLogTime(), `[${chatId}]`, color.red(`[Error while 'Approving A User']`), "\n", error);
                }
            }
            break;
        case "#unapprove":
            user = new User(chatId);
            if (user.approved) {
                user.approved = false;
                try {
                    await user.save();
                    console.log("\n" + getLogTime(), `[${chatId}]`, `[User Got Unapproved]`);
                } catch (error) {
                    console.error(getLogTime(), `[${chatId}]`, color.red(`[Error while 'Unapproving A User']`), "\n", error);
                }
            }
            break;
        case "#block":
            user = new User(chatId);
            if (!user.blocked) {
                user.blocked = true;
                try {
                    await user.save();
                    console.log("\n" + getLogTime(), `[${chatId}]`, `[User Got Blocked]`);
                } catch (error) {
                    console.error(getLogTime(), `[${chatId}]`, color.red(`[Error while 'Blocking A User']`), "\n", error);
                }
            }
            break;
        case "#unblock":
            user = new User(chatId);
            if (user.blocked) {
                user.blocked = false;
                try {
                    await user.save();
                    console.log("\n" + getLogTime(), `[${chatId}]`, `[User Got Unblocked]`);
                } catch (error) {
                    console.error(getLogTime(), `[${chatId}]`, color.red(`[Error while 'Unblocking A User']`), "\n", error);
                }
            }
            break;
        case "#reregister":
    }
}