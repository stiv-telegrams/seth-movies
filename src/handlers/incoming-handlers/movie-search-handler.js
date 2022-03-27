
import mysql from 'mysql';
import color from "cli-color";
import { dbInfo, serviceMessageTexts, validationMessageTexts } from "../../../config.js";
import { getLogTime, getRows, stringifyAirgramResponse } from "../../commons/functions.js";
import Movie from "../../entities/movie.js";
import { makeMovieQuestion, sendFirstMovieQuestion } from "./functions.js";
import { movieQuestionFields, movieSearchFirstMessage, movieSearchFirstMessageFirstLine } from "./variables.js";

export default async function movieSearchHandler(airgram, message, user) {
    let { chatId: userId, id: messageId, replyToMessageId } = message;
    let messageText = message.content.text?.text.trim();
    if (!messageText) {
        let wasExpectingTextMessageContents = {
            type: "text",
            text: validationMessageTexts.wasExpectingText
        }
        let wasExpectingTextMessageResult = await user.sendMessage(airgram, wasExpectingTextMessageContents);
        if (!wasExpectingTextMessageResult.success) {
            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Sending 'Was Expecting Text Message Only']`), "\n", stringifyAirgramResponse(wasExpectingTextMessageResult.reason));
        } else {
            console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent 'Was Expecting Text Message Only']`);
        }
    } else if (!replyToMessageId) {
        let keywordSearchNotAvailableMessageContent = {
            type: "text",
            text: "Title/Keyword search is not available yet."
        }
        let keywordSearchNotAvailableMessageResult = await user.sendMessage(airgram, keywordSearchNotAvailableMessageContent);
        if (!keywordSearchNotAvailableMessageResult.success) {
            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Sending 'Keyword Search Not Available Message']`), "\n", stringifyAirgramResponse(keywordSearchNotAvailableMessageResult.reason));
        } else {
            console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent 'Keyword Search Not Available Message']`);
        }
    } else {
        let getMessageParams = {
            chatId: userId,
            messageId: replyToMessageId
        }
        let repliedToMessage;
        try {
            repliedToMessage = await airgram.api.getMessage(getMessageParams);
            if (repliedToMessage._ == "error" || repliedToMessage.response._ == "error") {
                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Getting 'Replied To Message']`), "\n", stringifyAirgramResponse(repliedToMessage));
                let retryMessageContent = {
                    type: "text",
                    text: serviceMessageTexts.tryAgainDueToInternalError
                }
                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                if (!retryMessageResult.success) {
                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [gettingRepliedToMessage (1)]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                }
                return;
            }
        } catch (error) {
            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Getting 'Replied To Message']`), "\n", stringifyAirgramResponse(error));
            let retryMessageContent = {
                type: "text",
                text: serviceMessageTexts.tryAgainDueToInternalError
            }
            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
            if (!retryMessageResult.success) {
                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [getting replied to message (2)]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
            }
            return;
        }
        let invalidReply;
        let repliedToText = repliedToMessage.response.content.text?.text;
        if (!repliedToText || !repliedToMessage.response.isOutgoing) {
            invalidReply = true;
            console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to non-text or outgoing message)]`);
        } else {
            repliedToText = repliedToText.toLowerCase();
            let firstLine = (repliedToText.substring(0, repliedToText.indexOf("\n"))).trim();
            if (!firstLine) {
                invalidReply = true;
                console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to no-first line)]`);
            } else {
                let validStart = firstLine.match(/^((series)|(movie))\s\>/);
                let validFirstMessage = firstLine == movieSearchFirstMessageFirstLine.toLowerCase();
                if (!validFirstMessage && !validStart) {
                    invalidReply = true;
                    console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to invalid first line)]`);
                } else {
                    let knownFields = [];
                    if (!validFirstMessage) {
                        knownFields = firstLine.split(">");
                        knownFields = knownFields.map(field => field.trim());
                        knownFields = knownFields.filter(field => field);
                    }
                    let thisField;
                    let allLines = repliedToText.split(/\n+/).map(line => line.trim());
                    if (validFirstMessage) {
                        thisField = "type";
                    } else {
                        let typeLine = allLines[2];
                        thisField = typeLine?.substring(typeLine.lastIndexOf(" ") + 1);
                    }
                    if (!thisField) {
                        invalidReply = true;
                        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to invalid typeLine)]`);
                    } else {
                        let dataLines = allLines.filter(line => {
                            return line.match(/^\d+\s\>\s\S/);
                        });
                        if (!dataLines[0]) {
                            invalidReply = true;
                            console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to no-data lines)]`);
                        } else {
                            let dataLinesObject = {};
                            for (let dataLine of dataLines) {
                                dataLinesObject[dataLine.substring(0, dataLine.indexOf(">")).trim()] = dataLine.substring(dataLine.indexOf(">") + 1).trim();
                            }
                            if (!Object.keys(dataLinesObject).includes(messageText)) {
                                let invalidAnswerWhileSearchingMessageContent = {
                                    type: "text",
                                    text: validationMessageTexts.invalidAnswerWhileSearching
                                }
                                let invalidAnswerWhileSearchingMessageResult = await user.sendMessage(airgram, invalidAnswerWhileSearchingMessageContent);
                                if (!invalidAnswerWhileSearchingMessageResult.success) {
                                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Sending 'Invalid Reply While Searching']`), "\n", stringifyAirgramResponse(invalidAnswerWhileSearchingMessageResult.reason));
                                } else {
                                    console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent 'Invalid Reply While Searching']`);
                                }
                            } else {
                                knownFields.push(dataLinesObject[messageText]);
                                if (thisField == "quality") {
                                    let tempFields = [
                                        knownFields[0],
                                        "animation",
                                        `demo ${knownFields[0]}`,
                                        knownFields[0] == "movie" ? null : "1",
                                        knownFields[0] == "movie" ? null : "1",
                                        "1080p"
                                    ]
                                    let movie = new Movie(...tempFields);
                                    let movieSendResult = await movie.send(airgram, user);
                                    // @ts-ignore
                                    if (!movieSendResult.success) {
                                        // @ts-ignore
                                        console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Sending A Movie']`), "\n", stringifyAirgramResponse(movieSendResult.reason));
                                        let retryMessageContent = {
                                            type: "text",
                                            text: serviceMessageTexts.tryAgainDueToInternalError
                                        }
                                        let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                        if (!retryMessageResult.success) {
                                            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [The Final Movie Question]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                        }
                                    } else {
                                        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent A Movie]`);
                                        setTimeout(() => {
                                            sendFirstMovieQuestion(airgram, user, messageId);
                                        }, 3000)

                                    }
                                } else {
                                    let typedMovieQuestionFields = movieQuestionFields[knownFields[0]];
                                    let nextField = typedMovieQuestionFields[typedMovieQuestionFields.indexOf(thisField) + 1];
                                    let options = [];
                                    for (let index = 1; index <= 1 + Math.ceil(Math.random() * 9); index++) {
                                        options.push(`${nextField}-${index}`);
                                    }
                                    let con = mysql.createConnection({
                                        host: dbInfo.host,
                                        user: dbInfo.user,
                                        password: dbInfo.password,
                                        database: dbInfo.database
                                    });
                                    con.connect(async error => {
                                        if (error) {
                                            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Connecting to Database']`), "\n", error);
                                            let retryMessageContent = {
                                                type: "text",
                                                text: serviceMessageTexts.tryAgainDueToInternalError
                                            }
                                            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                            if (!retryMessageResult.success) {
                                                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Movie Question]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                            }
                                        } else {
                                            let knownFieldsObject = {}
                                            knownFields.forEach((element, index) => {
                                                knownFieldsObject[typedMovieQuestionFields[index]] = element;
                                            })
                                            try {
                                                let nextOptionsResult = await getRows(con, dbInfo.moviesTableName, [nextField], knownFieldsObject);
                                                console.dir(nextOptionsResult,{depth:null})
                                                let nextOptions = [];
                                                for (let option of nextOptionsResult) {
                                                    nextOptions.push(option[nextField])
                                                };
                                                console.dir(nextOptions,{depth:null})
                                                let nextQuestion = makeMovieQuestion(knownFields, nextField, nextOptions);

                                                let movieQuestionMessageContent = {
                                                    type: "text",
                                                    text: nextQuestion
                                                }
                                                let movieQuestionMessageFirstTimeResult = await user.sendMessage(airgram, movieQuestionMessageContent);
                                                if (!movieQuestionMessageFirstTimeResult.success) {
                                                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Sending Movie Question Message']`), "\n", stringifyAirgramResponse(movieQuestionMessageFirstTimeResult.reason));
                                                    let retryMessageContent = {
                                                        type: "text",
                                                        text: serviceMessageTexts.tryAgainDueToInternalError
                                                    }
                                                    let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                                    if (!retryMessageResult.success) {
                                                        console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Movie Question]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                                    }
                                                } else {
                                                    console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent Movie Question Message]`);
                                                }

                                            } catch (error) {
                                                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Getting Next Options While Searching']`), "\n", error);
                                                let retryMessageContent = {
                                                    type: "text",
                                                    text: serviceMessageTexts.tryAgainDueToInternalError
                                                }
                                                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                                if (!retryMessageResult.success) {
                                                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Movie Question]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                                }
                                            }
                                        }
                                    }
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
        if (invalidReply) {
            let invalidReplyWhileSearchingMessageContent = {
                type: "text",
                text: validationMessageTexts.invalidReplyWhileSearching
            }
            let invalidReplyWhileSearchingMessageResult = await user.sendMessage(airgram, invalidReplyWhileSearchingMessageContent);
            if (!invalidReplyWhileSearchingMessageResult.success) {
                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Sending 'Replied For Invalid Message While Searching']`), "\n", stringifyAirgramResponse(invalidReplyWhileSearchingMessageResult.reason));
            } else {
                console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent 'Replied For Invalid Message While Searching']`);
            }
        }
    }
}