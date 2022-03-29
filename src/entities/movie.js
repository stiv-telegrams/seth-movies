
import mysql from 'mysql';
import { dbInfo, defaults, separatingLine } from "../../config.js";
import { addRow, getRows, rowExists, updateRows } from '../commons/functions.js';

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
        { type,
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
            fileSize }) {
        quality = quality ?? defaults.quality;
        if (!type || !title || !quality) {
            throw "SOME_REQUIRED_FIELDS_NOT_SET";
        } else {
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
            this.uniqueId = `|${this.type}|${this.category}|${this.title}|${this.season}|${this.episode}|${this.quality}|`;
        }
    };
    async save() {
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
    };
    async send(airgram, user) {
        // get content
        let con = mysql.createConnection({
            host: dbInfo.host,
            user: dbInfo.user,
            password: dbInfo.password,
            database: dbInfo.database
        });
        return new Promise((resolve, reject) => {
            con.connect(async error => {
                if (error) {
                    reject(error);
                } else {
                    try {
                        let getMovieResult = await getRows(con, dbInfo.moviesTableName, ["messageId", "fromChatId", "description", "duration", "fileSize"], { uniqueId: this.uniqueId });
                        let movieToBeSent = getMovieResult[0];
                        if (!movieToBeSent) {
                            let paramsWithoutQuality = {
                                type: this.type,
                                category: this.category,
                                title: this.title,
                                season: this.season,
                                episode: this.episode,

                            };
                            getMovieResult = await getRows(con, dbInfo.moviesTableName, ["messageId", "fromChatId", "description", "duration", "fileSize", "quality"], paramsWithoutQuality);
                            movieToBeSent = getMovieResult[0];
                        }
                        if (!movieToBeSent) {
                            reject("MOVIE_NOT_FOUND");
                        } else {
                            // @ts-ignore
                            let { messageId, fromChatId: chatId, description, duration: videoDuration, fileSize, quality } = movieToBeSent;
                            if(quality) this.quality = quality;
                            let getMessageParams = {
                                chatId,
                                messageId
                            };
                            try {
                                let getMessageResult = await airgram.api.getMessage(getMessageParams);
                                if (getMessageResult._ == "error" || getMessageResult.response._ == "error" || !getMessageResult.response.content?.video) {
                                    reject(getMessageResult);
                                } else {
                                    let movieSize = fileSize ? Math.round((fileSize / (1024 * 1024)) * 100) / 100 + "MB" : "Unknown";
                                    let movieDuration;
                                    if (videoDuration) {
                                        let durationSec = videoDuration / 100;
                                        if (durationSec > 60) {
                                            let durationMin = durationSec / 60;
                                            if (durationMin > 60) {
                                                movieDuration = `${Math.floor(durationMin / 60)}:${Math.round(durationMin % 60)} Hour`
                                            } else {
                                                movieDuration = `${Math.round(durationMin * 100) / 100} Min`
                                            }
                                        } else {
                                            movieDuration = `${Math.round(durationSec * 100) / 100} Sec`
                                        }
                                    } else {
                                        movieDuration = "Unknown";
                                    }
                                    let movieCaption = `${this.title} ${this.season !== undefined ? "> " + this.season : ""} ${this.episode !== undefined ? "> " + this.episode : ""} > ${this.quality}\nDuration: ${movieDuration}\nSize: ${movieSize}`;

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
                                        reject(sendMessageResult);
                                    } else {
                                        resolve(sendMessageResult.response)
                                    }
                                }
                            } catch (error) {
                                reject(error);
                            }
                        }
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        })
    };
}