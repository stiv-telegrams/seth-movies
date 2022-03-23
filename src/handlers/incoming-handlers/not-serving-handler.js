
import color from "cli-color";
import { getLogTime, stringifyAirgramResponse, sendMessage } from "../../commons/functions.js";

export default async function notServingHandler(airgram, messageId, userId, message, logCode) {
    let result = await sendMessage(airgram, userId, { type: "text", text: message });
    if (result.success) {
        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[${logCode}]`);
    } else {
        console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while handling '${logCode}']`),"\n",stringifyAirgramResponse(result.reason));
    }
}