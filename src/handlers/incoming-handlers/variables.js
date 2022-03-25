import { separatingLine } from "../../commons/variables.js";

let userCommands = [
    "#report"
]

let movieSearchFirstMessage = ">\n\
"+ separatingLine + "\n\
Choose a type (reply this message with a number):\n\
1 > Movie\n\
2 > Series\n\
\n\
*NOTE: To search with title or a keyword, send the title/keyword with out reply.";

export { userCommands, movieSearchFirstMessage }