import color from "cli-color";
import { separatingLine } from "../../config.js";
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
    // fileSize = fileSize ? Math.round((fileSize / (1024 * 1024)) * 100) / 100 + "MB" : "Unknown";
    if ((!type || !category || !title || !quality) || (type == "series" && (!season || !episode))) {
        console.log(getLogTime(), `[${chatId} | ${id}]`, `[Invalid Caption]`);
        editedCaption = caption + "\n"+separatingLine+"\n❌ - Invalid Caption";
    } else {
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
            editedCaption = caption + "\n"+separatingLine+"\n✅";
        } catch (error) {
            console.error(getLogTime(), `[${chatId} | ${id}]`, color.red(`[Error while 'Saving Movie']`), "\n", error);
            editedCaption = caption + "\n"+separatingLine+"\n❌ - Internal Error";
        }
    }
    if (message.canBeEdited) {
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
        } catch (error) {
            console.error(getLogTime(), `[${chatId} | ${id}]`, color.red(`[Error while 'Editing Caption']`), "\n", error);
        }
    }
}