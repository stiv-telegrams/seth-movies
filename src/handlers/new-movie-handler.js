import color from "cli-color";
import { separatingLine, types } from "../../config.js";
import { getLogTime } from "../commons/functions.js";
import Movie from "../entities/movie.js";

export default async function newMovieHandler(airgram, message, caption) {
    let dataCaption = caption.substring(caption.indexOf("\n") + 1);
    dataCaption = dataCaption.split(/\n+/g);
    let movieInfo = {}
    for (let data of dataCaption) {
        let separatorIndex = data.indexOf(":");
        let key = data.substring(0, separatorIndex).trim().toLowerCase();
        let value = data.substring(separatorIndex + 1).trim();
        movieInfo[key] = value;
    }
    let editedCaption;
    let { type,
        category,
        title,
        season,
        episode,
        quality,
        keywords,
        description,
        year } = movieInfo;
    let { id, chatId, content: { video: { video: { size: fileSize }, duration } } } = message;
    type = types[type?.toLowerCase()];
    if (!type) {
        console.log(getLogTime(), `[${chatId} | ${id}]`, `[Invalid Caption (Unknown Type)]`);
        editedCaption = caption + "\n" + separatingLine + `\n❌ - Invalid Caption (Unknown Type)`;
    } else if (!title) {
        let notFound = [];
        if (!title) {
            notFound.push("title")
        }
        // @ts-ignore
        notFound = notFound.join(", ");
        console.log(getLogTime(), `[${chatId} | ${id}]`, `[Invalid Caption (${notFound} Not Found)]`);
        editedCaption = caption + "\n" + separatingLine + `\n❌ - Invalid Caption (${notFound} Not Found)`;
    } else if ((type.type == "series") && (!season || !episode)) {
        let notFound = [];
        if (!season) {
            notFound.push("season")
        }
        if (!episode) {
            notFound.push("episode")
        }
        // @ts-ignore
        notFound = notFound.join(", ");
        console.log(getLogTime(), `[${chatId} | ${id}]`, `[Invalid Caption (${notFound} Not Found)]`);
        editedCaption = caption + "\n" + separatingLine + `\n❌ - Invalid Caption (${notFound} Not Found)`;
    } else {
        type = type.name;
        try {
            let movie = new Movie(
                {
                    type,
                    category,
                    title,
                    season,
                    episode,
                    quality,
                    messageId: id,
                    fromChatId: chatId,
                    keywords,
                    description,
                    year,
                    duration,
                    fileSize
                });
            await movie.save();
            console.log(getLogTime(), `[${chatId} | ${id}]`, `[Movie Saved]`);
            editedCaption = caption + "\n" + separatingLine + "\n✅";
        } catch (error) {
            console.error(getLogTime(), `[${chatId} | ${id}]`, color.red(`[Error while 'Saving Movie']`), "\n", error);
            editedCaption = caption + "\n" + separatingLine + "\n❌ - Internal Error";
        }
    }
    try {
        let params = {
            chatId,
            messageId: id,
            caption: {
                _: "formattedText",
                text: editedCaption
            }
        }
        try {
            let editMessageCaptionResult = await airgram.api.editMessageCaption(params);
            if (editMessageCaptionResult._ == "error" || editMessageCaptionResult.response._ == "error") {
                console.error(getLogTime(), `[${chatId} | ${id}]`, color.red(`[Error while 'Editing Caption']`), "\n", editMessageCaptionResult);
            }
        } catch (error) { }
    } catch (error) { }
}