
import color from "cli-color";
import { separatingLine } from "../../../config.js";
import { getLogTime, capitalize, stringifyAirgramResponse } from "../../commons/functions.js";
import { movieSearchFirstMessage } from "./variables.js";
function makeMovieQuestion(knownFields, nextField, nextOptions) {
    let question = "";
    question += knownFields.join(" > ") + " >\n";
    question += separatingLine + "\n";
    if (nextOptions.length == 0) {
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
    let movieSearchFirstMessageContent = {
        type: "text",
        text: movieSearchFirstMessage
    }
    let movieSearchFirstMessageFirstTimeResult = await user.sendMessage(airgram, movieSearchFirstMessageContent);
    if (!movieSearchFirstMessageFirstTimeResult.success) {
        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Sending Movie Search First Message']`), "\n", stringifyAirgramResponse(movieSearchFirstMessageFirstTimeResult.reason));
    } else {
        console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Sent Movie Search First Message]`);
    }
}
export { makeMovieQuestion, sendFirstMovieQuestion };