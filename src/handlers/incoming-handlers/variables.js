import { separatingLine } from "../../../config.js";

let userCommands = [
    "#report"
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

let movieSearchFirstMessage = ">\n\
"+ separatingLine + "\n\
Choose a type (reply this message with a number):\n\
1 > Movie\n\
2 > Series\n\
\n\
*NOTE: To search with title or a keyword, send the title/keyword with out reply.";

export { userCommands, movieSearchFirstMessage, movieQuestionFields }