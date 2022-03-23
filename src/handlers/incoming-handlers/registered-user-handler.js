
// import path from "path";
// import fs from "fs";
import color from "cli-color";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";
// const { serviceMessageTexts } = JSON.parse(fs.readFileSync(path.resolve("config.json"), "utf-8"));
import { serviceMessageTexts } from "../../../config.js";


export default async function registeredUserHandler(airgram, message, user) {
    let messageId = message.id;
    let willStartSoonMessageContent = {
        type: "text",
        text: serviceMessageTexts.willStartSoon
    }
    let willStartSoonMessageResult = await user.sendMessage(airgram, willStartSoonMessageContent);
    if (!willStartSoonMessageResult.success) {
        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Telling Service Will Start Soon']`), "\n", stringifyAirgramResponse(willStartSoonMessageResult.reason));
    } else {
        console.log(getLogTime(), `[${user.id}} | ${messageId}]`, `[Told Service Will Start Soon]`);
    }
}