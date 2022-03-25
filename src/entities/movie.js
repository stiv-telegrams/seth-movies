
import path from "path";
import fs from "fs";
import { movies_dir } from "../commons/variables.js";
import { separatingLine } from "../../config.js";

export default class Movie {
    type;
    category;
    title;
    season;
    episode;
    quality;
    id;
    fromChatId;
    keyword;
    description;
    year;
    time;
    fileSize;

    constructor(
        type,
        category,
        title,
        season,
        episode,
        quality,
        id,
        fromChatId,
        keyword,
        description,
        year,
        fileSize) {
        this.type = type;
        this.category = category;
        this.title = title;
        this.season = season;
        this.episode = episode;
        this.quality = quality;
        this.id = id;
        this.fromChatId = fromChatId;
        this.keyword = keyword;
        this.description = description;
        this.year = year;
        this.fileSize = fileSize;
    };
    get fileLocation() {
        if (!fs.existsSync(path.resolve(movies_dir, this.type, this.category))) {
            try {
                fs.mkdirSync(path.resolve(movies_dir, this.type, this.category));
            } catch (error) {
                return { success: false, reason: error };
            }
        }
        return { success: true, result: path.resolve(movies_dir, this.type, this.category, this.title + ".json") };
    }

    get content() {
        let fileLocation = this.fileLocation;
        if (!fileLocation.success) {
            return fileLocation;
        } else if (!fs.existsSync(fileLocation.result)) {
            return { success: true, result: null };
        } else {
            try {
                let content = fs.readFileSync(fileLocation.result, { encoding: 'utf-8' });
                content = JSON.parse(content);
                switch (this.type) {
                    case "movie":
                        return { success: true, result: content[this.quality] };
                    case "series":
                        return { success: true, result: content[this.season][this.episode][this.quality] };
                    default:
                        return { success: false, reason: "UNKNOWN_TYPE" };
                }
            } catch (error) {
                return { success: false, reason: error };
            }
        }
    }
    async save() {
        let fileLocation = this.fileLocation;
        if (!fileLocation.success) {
            throw fileLocation.reason;
        } else {
            let content = {};
            if (fs.existsSync(fileLocation.result)) {
                try {
                    content = fs.readFileSync(fileLocation.result, { encoding: 'utf-8' });
                    // @ts-ignore
                    content = JSON.parse(content);
                } catch (error) {
                    throw error;
                }
            }
            let newContent = {
                id: this.id,
                fromChatId: this.fromChatId,
                keyword: this.keyword,
                description: this.description,
                year: this.year,
                fileSize: this.fileSize,
                time: new Date().toISOString().replace("Z", "").replace("T", " | ").split(".")[0]
            }
            switch (this.type) {
                case "movie":
                    content[this.quality] = newContent;
                    break;
                case "series":
                    if (!content[this.season]) {
                        content[this.season] = {
                            [this.episode]: {
                                [this.quality]: newContent
                            }
                        };
                        break;
                    } else if (!content[this.season][this.episode]) {
                        content[this.episode] = {
                            [this.quality]: newContent
                        };
                        break;
                    } else {
                        content[this.season][this.episode][this.quality] = newContent;
                        break;
                    }
                default:
                    throw "UNSUPPORTED_TYPE";
            }
            return new Promise((resolve, reject) => {
                fs.writeFile(fileLocation.result, JSON.stringify(content), (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                })
            })
        }
    };
    async send(airgram, user) {
        let content = this.content;
        // @ts-ignore
        if (!content.success) {
            return content;
            // @ts-ignore
        } else if (!content.result) {
            return { success: false, reason: "NO_DATA_FOUND" };
        } else {
            let userId = user.id;
            // @ts-ignore
            let { id, fromChatId } = content.result;
            let params = {
                chatId: userId,
                // @ts-ignore
                fromChatId,
                // @ts-ignore
                messageIds: [id],
                sendCopy: true,
                removeCaption: true
            };
            try {
                let result = await airgram.api.forwardMessages(params);
                if (result._ == "error" || result.response._ == "error" || !result.response.messages?.[0]) {
                    return { success: false, reason: result };
                } else {
                    return { success: true, result: result.response }
                }
            } catch (error) {
                return { success: false, reason: error };
            }
        }
    };
    async send2(airgram, user) {
        let content = this.content;
        // @ts-ignore
        if (!content.success) {
            return content;
            // @ts-ignore
        } else if (!content.result) {
            return { success: false, reason: "NO_DATA_FOUND" };
        } else {
            let userId = user.id;
            // @ts-ignore
            let { id: messageId, fromChatId: chatId, description } = content.result;
            let getMessageParams = {
                chatId,
                messageId
            };
            try {
                let getMessageResult = await airgram.api.getMessage(getMessageParams);
                if (getMessageResult._ == "error" || getMessageResult.response._ == "error" || !getMessageResult.response.content?.video) {
                    return { success: false, reason: getMessageResult };
                } else {
                    let movieCaption = ""
                    if (this.type == 'movie') {
                        movieCaption += `${this.title[0].toUpperCase()+this.title.substring(1)} > ${this.quality}`;
                    } else if (this.type == 'series') {
                        movieCaption += `${this.title[0].toUpperCase()+this.title.substring(1)} > ${this.season} > ${this.episode} > ${this.quality}`;
                    }
                    if (description) {
                        movieCaption += "\n" + separatingLine;
                        movieCaption += "\n" + description;
                    }
                    let caption = {
                        _: "formattedText",
                        text: movieCaption
                    }
                    let thumbnail = getMessageResult.response.content.video.thumbnail;
                    let videoId = getMessageResult.response.content.video.video?.id;
                    let { duration, width, height, supportsStreaming } = getMessageResult.response.content.video;

                    let sendMessageParams = {
                        chatId: user.id,
                        inputMessageContent: {
                            _: "inputMessageVideo",
                            video: {
                                _: "inputFileId",
                                id: videoId
                            },
                            thumbnail,
                            duration,
                            width,
                            height,
                            supportsStreaming,
                            caption
                        }
                    }
                    let sendMessageResult = await airgram.api.sendMessage(sendMessageParams);
                    if (sendMessageResult._ == "error" || sendMessageResult.response._ == "error") {
                        return { success: false, reason: sendMessageResult };
                    } else {
                        return { success: true, result: sendMessageResult.response }
                    }
                }
            } catch (error) {
                return { success: false, reason: error };
            }
        }
    };
}