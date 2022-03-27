
import color from "cli-color";
import { serviceMessageTexts } from "../../../config.js";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";
import User from "../../entities/user.js";
import { sendFirstMovieQuestion } from "./functions.js";
export default async function userCommandsHandler(airgram, user, message, command) {
    let { chatId: userId, id: messageId } = message;
    switch (command) {
        case "#restart":
            sendFirstMovieQuestion(airgram, user, messageId);
            break;
        default:
            let sendCommandUnderMaintenanceContent = {
                type: "text",
                text: serviceMessageTexts.userCommandUnderMaintenance
            }
            let sendCommandUnderMaintenanceResult = await user.sendMessage(airgram, sendCommandUnderMaintenanceContent);
            if (!sendCommandUnderMaintenanceResult.success) {
                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling User Command Under Maintenance' (${command}) ]`), "\n", stringifyAirgramResponse(sendCommandUnderMaintenanceResult.reason));
            } else {
                console.log(getLogTime(), `[${userId} | ${messageId}]`, `[User Command Under Maintenance (${command})]`);
            }
            return;
    }
}