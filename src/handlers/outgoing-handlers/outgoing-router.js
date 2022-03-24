import newMovieHandler from "./new-movie-handler.js";
import adminCommandsHandler from "./admin-commands-handler.js";
import { postChannelId } from "../../../config.js";

export default function outgoingHandler(airgram, message) {
    let commandsRegex = /^\#\S+\s/;
    let text = message.content.text?.text || message.content.caption?.text;
    if (!text) {
        return;
    } else {
        let commandMatch = text.match(commandsRegex);
        if (!commandMatch) {
            return;
        } else {
            let command = commandMatch[0].trim().toLowerCase();
            switch (command) {
                case "#newmovie":
                    if (message._ != "messageVideo" || message.chatId != postChannelId) {
                        return
                    } else {
                        newMovieHandler(airgram, message, text);
                    }
                    break;
                case "#block":
                case "#un-block":
                case "#approve":
                case "#un-approve":
                case "#re-register":
                    adminCommandsHandler(airgram, message, command)

            }
        }
    }
}