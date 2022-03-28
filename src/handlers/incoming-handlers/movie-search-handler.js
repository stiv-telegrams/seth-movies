
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
                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Search By Title/Keyword]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                }
            } else {
                let query = `SELECT type, category, title FROM ${dbInfo.moviesTableName} WHERE CONCAT (title, '', keywords) LIKE ?`;
                con.query(query, ["%" + messageText + "%"], async (error, result) => {
                    if (error) {
                        console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Getting Result For Keyword Search]`), "\n", error);
                        let retryMessageContent = {
                            type: "text",
                            text: serviceMessageTexts.tryAgainDueToInternalError
                        }
                        let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                        if (!retryMessageResult.success) {
                            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Search By Title/Keyword](1)']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                        }
                    } else if (result.length == 0) {
                        let noResultFoundMessageContent = {
                            type: "text",
                            text: serviceMessageTexts.noResultFound
                        }
                        let noResultFoundMessageResult = await user.sendMessage(airgram, noResultFoundMessageContent);
                        if (!noResultFoundMessageResult.success) {
                            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Telling 'No Result Found']`), "\n", stringifyAirgramResponse(noResultFoundMessageResult.reason));
                        }
                    } else {
                        // let searchResults = [[[], []], [[], []], []];
                        // let exampleSearchResults = {
                        //     "movie>drama": [
                        //         ["Movie", "Drama"], "Title-1", "Title-2"
                        //     ]
                        // };
                        let hereAreSearchResultsMessageContent = {
                            type: "text",
                            text: serviceMessageTexts.hereAreSearchResultsMessage
                        }
                        let hereAreSearchResultsMessageResult = await user.sendMessage(airgram, hereAreSearchResultsMessageContent);
                        if (!hereAreSearchResultsMessageResult.success) {
                            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling Here Are The Results']`), "\n", stringifyAirgramResponse(hereAreSearchResultsMessageResult.reason));
                        }
                        let searchResults = {};
                        for (let thisResult of result) {
                            let knownFieldsString = `${thisResult["type"].toLowerCase()}>${thisResult["category"].toLowerCase()}`;
                            if (!searchResults[knownFieldsString]) {
                                searchResults[knownFieldsString] = [[thisResult["type"], thisResult["category"]]]
                            }
                            searchResults[knownFieldsString].push(thisResult["title"])
                        }
                        for (let options of Object.values(searchResults)) {
                            let knownFields = options[0];
                            let titles = options.slice(1);
                            let nextOptions = [], uniqueMaker = [];
                            for (let title of titles) {
                                if (!uniqueMaker.includes(title.toLowerCase())) {
                                    nextOptions.push(title);
                                    uniqueMaker.push(title.toLowerCase());
                                }
                            };
                            let titleListQuestion = makeMovieQuestion(knownFields, "Title", nextOptions);
                            let movieQuestionMessageContent = {
                                type: "text",
                                text: titleListQuestion
                            }
                            let movieQuestionMessageResult = await user.sendMessage(airgram, movieQuestionMessageContent);
                            if (!movieQuestionMessageResult.success) {
                                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Sending Movie Question For Search By Keyword']`), "\n", stringifyAirgramResponse(movieQuestionMessageResult.reason));
                                let retryMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.tryAgainDueToInternalError
                                }
                                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                if (!retryMessageResult.success) {
                                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Search By Title/Keyword](2)']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                }
                            } else {
                                console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent Title List Message]`);
                            }
                        }
                    }
                })
            }
        });
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
            let firstLine = (repliedToText.substring(0, repliedToText.indexOf("\n"))).trim();
            if (!firstLine) {
                invalidReply = true;
                console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to no-first line)]`);
            } else {
                let validStart = firstLine.match(/^((series)|(movie))\s+\>/i);
                let validFirstMessage = firstLine == movieSearchFirstMessageFirstLine;
                if (!validFirstMessage && !validStart) {
                    invalidReply = true;
                    console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to invalid first line)]`);
                } else {
                    let knownFields = [];
                    if (!validFirstMessage) {
                        knownFields = firstLine.split(">");
                        knownFields = knownFields.map(field => field.trim());
                        knownFields = knownFields.filter(field => field !== "");
                    }
                    let thisField;
                    let allLines = repliedToText.split(/\n+/).map(line => line.trim());
                    if (validFirstMessage) {
                        thisField = "type";
                    } else {
                        let typeLine = allLines[2];
                        thisField = typeLine?.substring(typeLine.lastIndexOf(" ") + 1).toLowerCase();
                    }
                    if (!thisField) {
                        invalidReply = true;
                        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Replied For Invalid Message While Searching (replied to invalid typeLine)]`);
                    } else {
                        let dataLines = allLines.filter(line => line.match(/^\d+\s\>\s\S/));
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
                                let typedMovieQuestionFields = movieQuestionFields[knownFields[0].toLowerCase()];
                                let knownFieldsObject = {}
                                knownFields.forEach((element, index) => {
                                    knownFieldsObject[typedMovieQuestionFields[index]] = element;
                                })
                                if (thisField == "quality") {
                                    try {
                                        // @ts-ignore
                                        let movie = new Movie(knownFieldsObject);
                                        let movieSendResult;
                                        movieSendResult = await movie.send(airgram, user);
                                        console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Sent A Movie]`);
                                        setTimeout(() => {
                                            sendFirstMovieQuestion(airgram, user, messageId);
                                        }, 3000);
                                    } catch (error) {
                                        // @ts-ignore
                                        if (error === "MOVIE_NOT_FOUND") {
                                            console.log(getLogTime(), `[${userId} | ${messageId}]`, `[Content '${knownFields.join(" > ")}' Not Found]`);
                                            let contentNotFoundMessageContent = {
                                                type: "text",
                                                text: serviceMessageTexts.contentNotFound
                                            }
                                            let contentNotFoundMessageResult = await user.sendMessage(airgram, contentNotFoundMessageContent);
                                            if (!contentNotFoundMessageResult.success) {
                                                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling Content Not Found']`), "\n", stringifyAirgramResponse(contentNotFoundMessageResult.reason));
                                            }
                                        } else {
                                            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Sending A Movie']`), "\n", stringifyAirgramResponse(error));
                                            let retryMessageContent = {
                                                type: "text",
                                                text: serviceMessageTexts.tryAgainDueToInternalError
                                            }
                                            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                            if (!retryMessageResult.success) {
                                                console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [The Final Movie Question]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                            }
                                        }
                                    }
                                } else {
                                    let nextField = typedMovieQuestionFields[typedMovieQuestionFields.indexOf(thisField) + 1];
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
                                            try {
                                                let nextOptionsResult = await getRows(con, dbInfo.moviesTableName, [nextField], knownFieldsObject);
                                                let nextOptions = [], uniqueMaker = [];
                                                for (let option of nextOptionsResult) {
                                                    if (!uniqueMaker.includes(option[nextField].toLowerCase())) {
                                                        nextOptions.push(option[nextField]);
                                                        uniqueMaker.push(option[nextField].toLowerCase());
                                                    }
                                                };
                                                let nextQuestion = makeMovieQuestion(knownFields, nextField, nextOptions);

                                                let movieQuestionMessageContent = {
                                                    type: "text",
                                                    text: nextQuestion
                                                }
                                                let movieQuestionMessageResult = await user.sendMessage(airgram, movieQuestionMessageContent);
                                                if (!movieQuestionMessageResult.success) {
                                                    console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while 'Sending Movie Question Message']`), "\n", stringifyAirgramResponse(movieQuestionMessageResult.reason));
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