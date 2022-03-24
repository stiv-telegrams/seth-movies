
import path from "path";
import fs from "fs";
import { movies_dir } from "../commons/variables.js";

export default class Movie {
    type;
    category;
    title;
    season;
    episode;
    quality;
    id;
    fromChatId;
    constructor(
        type,
        category,
        title,
        season,
        episode,
        quality,
        id,
        fromChatId) {
        this.type = type;
        this.category = category;
        this.title = title;
        this.season = season;
        this.episode = episode;
        this.quality = quality;
        this.id = id;
        this.fromChatId = fromChatId;
    };
    get fileLocation() {
        return path.resolve(movies_dir, this.type, this.category, this.title + ".json");
    }

    get content() {
        let fileLocation = this.fileLocation;
        if (!fs.existsSync(fileLocation)) {
            return { success: true, result: null };
        } else {
            try {
                let content = fs.readFileSync(fileLocation, { encoding: 'utf-8' });
                content = JSON.parse(content);
                switch (this.type) {
                    case "movie":
                        return content[this.quality];
                    case "series":
                        return content[this.season][this.episode][this.quality];
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
        let content;
        if (!fs.existsSync(fileLocation)) {
            content = {};
        } else {
            try {
                let content = fs.readFileSync(fileLocation, { encoding: 'utf-8' });
                content = JSON.parse(content);
            } catch (error) {
                return { success: false, reason: error };
            }
        }
        let newContent = {
            id: this.id,
            fromChatId: this.fromChatId
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
                return { success: false, reason: "UNSUPPORTED_TYPE" };
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(fileLocation, JSON.stringify(content), (error) => {
                if (error) {
                    reject({ success: false, reason: error });
                } else {
                    resolve({ success: true, reason: true });
                }
            })
        })
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
            let(id, fromChatId) = content;
            let params = {
                chatId: userId,
                // @ts-ignore
                fromChatId,
                // @ts-ignore
                messageIds: [id],
                sendCopy: true,
                removeCaption: true
            };
            let result = await airgram.api.forwardMessages(params);
            if (result._ == "error" || result.response._ == "error") {
                return { success: false, reason: result };
            } else {
                return { success: true, result: true }
            }
        }
    };
}