
import color from "cli-color";
import { separatingLine, serviceMessageTexts, validationMessageTexts } from "../../../config.js";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";
import Movie from "../../entities/movie.js";
import { makeMovieQuestion } from "./functions.js";
import { movieQuestionFields, movieSearchFirstMessage } from "./variables.js";

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
                if (firstLine != ">" && !validStart) {
                    invalidReply = true;
                    console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to invalid first line)]`);
                } else {
                    let fields = firstLine.split(">");
                    fields = fields.map(field => field.trim());
                    fields = fields.filter(field => field);

                    let thisField;
                    let allLines = repliedToText.split(/\n+/).map(line => line.trim());
                    if (firstLine == ">") {
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
                                dataLinesObject[dataLine.substring(0, dataLine.indexOf(">")).trim()] = dataLine.substring(dataLine.indexOf(">") + 1).trim()
                            }
                            if (!Object.keys(dataLinesObject).includes(messageText)) {
                                let invalidRAnswerWhileSearchingMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.invalidAnswerWhileSearching
                                }
                                let invalidReplyWhileSearchingMessageResult = await user.sendMessage(airgram, invalidRAnswerWhileSearchingMessageContent);
                                if (!invalidReplyWhileSearchingMessageResult.success) {
                                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Sending 'Invalid Reply While Searching']`), "\n", stringifyAirgramResponse(invalidReplyWhileSearchingMessageResult.reason));
                                } else {
                                    console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent 'Invalid Reply While Searching']`);
                                }
                            } else {
                                fields.push(dataLinesObject[messageText]);
                            }
                            if (thisField == "quality") {
                                let fields = [
                                    "movie",
                                    "animation",
                                    "demo movie",
                                    null,
                                    null,
                                    "1080p"
                                ]
                                let movie = new Movie(...fields);
                                let movieSendResult = await movie.send2(airgram, user);
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
                                    let movieSearchFirstMessageContent = {
                                        type: "text",
                                        text: movieSearchFirstMessage
                                    }
                                    let movieSearchFirstMessageFirstTimeResult = await user.sendMessage(airgram, movieSearchFirstMessageContent);
                                    if (!movieSearchFirstMessageFirstTimeResult.success) {
                                        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Sending Movie Search First Message After A Movie Sent']`), "\n", stringifyAirgramResponse(movieSearchFirstMessageFirstTimeResult.reason));
                                    } else {
                                        console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Sent Movie Search First Message After A Movie Sent]`);
                                    }
                                }
                            } else {
                                // make the question
                                let typedMovieQuestionFields = movieQuestionFields[fields[0]];
                                let nextField = typedMovieQuestionFields[typedMovieQuestionFields.indexOf(thisField) + 1];
                                let options = [];
                                for (let index = 1; index <= 1 + Math.ceil(Math.random() * 9); index++) {
                                    options.push(`${nextField}-${index}`);
                                }
                                let question = makeMovieQuestion(fields, nextField, options);

                                let movieQuestionMessageContent = {
                                    type: "text",
                                    text: question
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
                            }
                            // console.log("-----------")
                            // console.log(fields)
                            // console.log("-----------")
                            // console.log(thisField)
                            // console.log("-----------")
                            // console.dir(dataLinesObject, { depth: null })
                            // console.log("-----------")
                        }
                    }

                }
            }
        }
        if (invalidReply) {
            let invalidReplyWhileSearchingMessageContent = {
                type: "text",
                text: serviceMessageTexts.invalidReplyWhileSearching
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