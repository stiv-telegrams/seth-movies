
import color from "cli-color";
import { separatingLine } from "../../../config.js";
import { getLogTime, capitalize, stringifyAirgramResponse } from "../../commons/functions.js";
import { makeMovieSearchFirstMessage } from "../../commons/functions.js";
function makeMovieQuestion(knownFields, nextField, nextOptions) {
    let question = "";
    question += knownFields.join(" > ") + " >\n";
    question += separatingLine + "\n";
    if (nextOptions == undefined || nextOptions == null || nextOptions.length == 0) {
        question += `No ${capitalize(nextField)}s found`;
    } else {
        question += `Choose ${capitalize(nextField)}` + "\n";
        let count = 1;
        for (let option of nextOptions) {
            question += `${count} > ${option}` + "\n"
            count++
        }
    }
    return question;
}
async function sendFirstMovieQuestion(airgram, user, messageId) {
    try {
        let questionMessage = await makeMovieSearchFirstMessage();
        let movieSearchFirstMessageContent = {
            type: "text",
            text: questionMessage
        }
        let movieSearchFirstMessageFirstTimeResult = await user.sendMessage(airgram, movieSearchFirstMessageContent);
        if (!movieSearchFirstMessageFirstTimeResult.success) {
            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Sending Movie Search First Message']`), "\n", stringifyAirgramResponse(movieSearchFirstMessageFirstTimeResult.reason));
        } else {
            console.log(getLogTime(), `[${user.id} | ${messageId}]`, `[Sent Movie Search First Message]`);
        }
    } catch (error) {
        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Sending Movie Search First Message']`), "\n", error);
    }
}
export { makeMovieQuestion, sendFirstMovieQuestion };