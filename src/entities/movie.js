
import mysql from 'mysql';
import path from "path";
import fs from "fs";
import { movies_dir } from "../commons/variables.js";
import { dbInfo, separatingLine } from "../../config.js";
import { addRow, rowExists, updateRows } from '../commons/functions.js';

export default class Movie {
    uniqueId;
    type;
    category;
    title;
    season;
    episode;
    quality;
    messageId;
    fromChatId;
    keywords;
    description;
    year;
    duration;
    fileSize;

    constructor(
        type,
        category,
        title,
        season,
        episode,
        quality,
        messageId,
        fromChatId,
        keywords,
        description,
        year,
        duration,
        fileSize) {
        this.type = type;
        this.category = category;
        this.title = title;
        this.season = season;
        this.episode = episode;
        this.quality = quality;
        this.messageId = messageId;
        this.fromChatId = fromChatId;
        this.keywords = keywords;
        this.description = description;
        this.year = year;
        this.duration = duration;
        this.fileSize = fileSize;
        this.uniqueId = `|${this.type}${this.category}${this.title}${this.quality}`.replace(/\S/, "");
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
        if (!this.type || !this.category || !this.title || !this.quality) {
            throw "SOME_REQUIRED_FIELDS_NOT_SET";
        } else {
            let uniqueId = this.uniqueId;
            let con = mysql.createConnection({
                host: dbInfo.host,
                user: dbInfo.user,
                password: dbInfo.password,
                database: dbInfo.database
            });
            return new Promise((resolve, reject) => {
                con.connect(async error => {
                    if (error) {
                        reject("COULDN'T_CONNECT_TO_DATABASE_HOST");
                    } else {
                        let movieExists;
                        try {
                            movieExists = await rowExists(con, dbInfo.moviesTableName, { uniqueId });
                        } catch (error) {
                            reject(error);
                        }
                        if (movieExists) {
                            try {
                                await updateRows(con, dbInfo.moviesTableName, this, { uniqueId })
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                            resolve();
                        } else {
                            try {
                                await addRow(con, dbInfo.moviesTableName, this)
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }
                    }

                })
            });
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
                        movieCaption += `${this.title[0].toUpperCase() + this.title.substring(1)} > ${this.quality}`;
                    } else if (this.type == 'series') {
                        movieCaption += `${this.title[0].toUpperCase() + this.title.substring(1)} > Season: ${this.season} > Episode: ${this.episode} > ${this.quality}`;
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