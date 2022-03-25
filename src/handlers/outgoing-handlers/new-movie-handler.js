import color from "cli-color";
import { getLogTime } from "../../commons/functions.js";
import Movie from "../../entities/movie.js";

export default async function newMovieHandler(airgram, message, caption) {
    let dataCaption = caption.substring(caption.indexOf("\n") + 1);
    dataCaption = dataCaption.split(/\n+/g);
    let movieInfo = {}
    for (let data of dataCaption) {
        let separatorIndex = data.indexOf(":");
        let key = data.substring(0, separatorIndex).toLowerCase().trim();
        let value = data.substring(separatorIndex + 1).toLowerCase().trim();
        movieInfo[key] = value;
    }
    let editedCaption;
    let { type,
        category,
        title,
        season,
        episode,
        quality } = movieInfo;
    let { id, chatId } = message;
    if ((!type || !category || !title || !quality) || (type == "series" && (!season || !episode))) {
        console.log(getLogTime(), `[${chatId}} | ${id}]`, `[Invalid Caption]`);
        editedCaption = caption + "\n--------------\n❌";
    } else {
        let movie = new Movie(type, category, title, season, episode, quality, id, chatId);
        try {
            await movie.save();
            console.log(getLogTime(), `[${chatId}} | ${id}]`, `[Movie Saved]`);
            editedCaption = caption + "\n--------------\n✅";
        } catch (error) {
            console.error(getLogTime(), `[${chatId} | ${id}]`, color.red(`[Error while 'Saving Movie']`), "\n", error);
            editedCaption = caption + "\n--------------\n❌ - Internal";
        }
    }
    if (!message.forwardInfo) {
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