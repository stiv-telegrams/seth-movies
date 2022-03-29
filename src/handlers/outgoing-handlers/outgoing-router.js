
import adminCommandsHandler from "./admin-commands-handler.js";
import { getLogTime } from "../../commons/functions.js";
import { commandsRegex } from "../../commons/variables.js";

export default function outgoingHandler(airgram, message) {
    let text = message.content.text?.text || message.content.caption?.text;
    if (!text) {
        return;
    } else {
        let commandMatch = text.match(commandsRegex);
        if (!commandMatch) {
            return;
        } else {
            let { id, chatId } = message;
            console.log("\n" + getLogTime(), `[${chatId} | ${id}]`, `[New Outgoing Message]`);
            let command = commandMatch[0].trim().toLowerCase();
            switch (command) {
                case "#block":
                case "#unblock":
                case "#approve":
                case "#unapprove":
                case "#reregister":
                    adminCommandsHandler(airgram, message, command)
            }
        }
    }
}