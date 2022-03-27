import { separatingLine } from "../../../config.js";

let userCommands = [
    "#report",
    "#restart"
]

let movieQuestionFields = {
    "movie": [
        "type",
        "category",
        "title",
        "quality"
    ],
    "series": [
        "type",
        "category",
        "title",
        "season",
        "episode",
        "quality"
    ]
}
let movieSearchFirstMessageFirstLine = "Choose a type (reply this message with a number):"
let movieSearchFirstMessage = `\
${movieSearchFirstMessageFirstLine}\n\
1 > Movie\n\
2 > Series\n\
\n\
*NOTE: To search with title or a keyword, send the title or keyword with out reply.`;

export { userCommands, movieSearchFirstMessage, movieQuestionFields, movieSearchFirstMessageFirstLine }