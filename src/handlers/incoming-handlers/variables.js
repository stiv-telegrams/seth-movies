import { types } from "../../../config.js";

let userCommands = [
    "#report",
    "#browse"
]

let typeContents = {
    "single": [
        "type",
        "title",
        "quality"
    ],
    "series": [
        "type",
        "title",
        "season",
        "episode",
        "quality"
    ]
}
let movieQuestionFields = {}
for (let type of Object.values(types)) {
    movieQuestionFields[type.name] = typeContents[type.type];
}
export { userCommands, movieQuestionFields }