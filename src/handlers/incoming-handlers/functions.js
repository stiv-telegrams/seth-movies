
import color from "cli-color";
import { separatingLine } from "../../../config.js";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";
import { movieSearchFirstMessage } from "./variables.js";
function makeMovieQuestion(perviousFields, nextField, options) {
    let question = "";
    perviousFields = perviousFields.map(field => ("" + field)[0].toUpperCase() + ("" + field).substring(1));
    question += perviousFields.join(" > ") + " >\n";
    question += separatingLine + "\n";
    question += `Choose ${nextField[0].toUpperCase() + nextField.substring(1)}` + "\n";
    let count = 1;
    for (let option of options) {
        question += `${count} > ${option}` + "\n"
        count++
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