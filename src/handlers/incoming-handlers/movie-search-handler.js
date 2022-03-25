
import color from "cli-color";
import { serviceMessageTexts, validationMessageTexts } from "../../../config.js";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";

export default async function movieSearchHandler(airgram, message, user) {
    let { chatId: userId, id: messageId, replyToMessageId } = message;
    let messageText = message.content.text?.text;
    if (!messageText) {
        let  wasExpectingTextMessageContents= {
            type: "text",
            text: validationMessageTexts.wasExpectingText
        }
        let wasExpectingTextMessageResult = await user.sendMessage(airgram, wasExpectingTextMessageContents);
        if (!wasExpectingTextMessageResult.success) {
            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while Sending 'Was Expecting Text Message Only']`), "\n", stringifyAirgramResponse(wasExpectingTextMessageResult.reason));
        } else {
            console.log(getLogTime(), `[${user.id}} | ${messageId}]`, `[Sent 'Was Expecting Text Message Only']`);
        }
    } else if (!replyToMessageId) {
        let keywordSearchNotAvailableMessageContent = {
            type: "text",
            text: "Title/Keyword search not available yet."
        }
        let keywordSearchNotAvailableMessageResult = await user.sendMessage(airgram, keywordSearchNotAvailableMessageContent);
        if (!keywordSearchNotAvailableMessageResult.success) {
            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while Sending 'Keyword Search Not Available Message']`), "\n", stringifyAirgramResponse(keywordSearchNotAvailableMessageResult.reason));
        } else {
            console.log(getLogTime(), `[${user.id}} | ${messageId}]`, `[Sent 'Keyword Search Not Available Message']`);
        }
    } else {
        let getMessageParams = {
            chatId: userId,
            messageId: replyToMessageId
        }
        let repliedToMessage;
        try {
            repliedToMessage = await airgram.api.getMessage(getMessageParams);
        } catch (error) {
            console.error(getLogTime(), `[${userId} | ${messageId}]`, color.red(`[Error while Getting 'Replied To Message']`), "\n", stringifyAirgramResponse(error));
            let retryMessageContent = {
                type: "text",
                text: serviceMessageTexts.tryAgainDueToInternalError
            }
            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
            if (!retryMessageResult.success) {
                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [repliedToMessage]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
            }
            return;
        }
        let invalidReply;
        let repliedToText = repliedToMessage.content.text?.text;
        if (!repliedToText || !repliedToMessage.isOutgoing) {
            invalidReply = true;
        } else {
            let firstLine = (repliedToText.substring(0, repliedToText.indexOf("\n"))).trim().toLowerCase();
            if (!firstLine) {
                invalidReply = true;
            } else {
                let validStart = firstLine.match(/^((search)|(movie))\s\>/);
                if (firstLine != ">" && !validStart) {
                    invalidReply = true;
                } else {
                    let dataLines = repliedToText.split(/\n+/).filter(line => {
                        return line.match(/^\d+\s\>\s\S/);
                    });
                    if (!dataLines[0]) {
                        invalidReply = true;
                    } else {
                        dataLines = dataLines.map(dataLine => {
                            return {
                                [dataLine.substring(0, dataLine.indexOf(">")).trim()]: dataLine.substring(dataLine.indexOf(">") + 1).trim()
                            }
                        });
                        // here
                    }

                }
                let fields = firstLine.split(">");
                fields = fields.map(field => field.trim());

            }
        }
        if (invalidReply) {
            let invalidReplyWhileSearchingMessageContent = {
                type: "text",
                text: serviceMessageTexts.invalidReplyWhileSearching
            }
            let invalidReplyWhileSearchingMessageResult = await user.sendMessage(airgram, invalidReplyWhileSearchingMessageContent);
            if (!invalidReplyWhileSearchingMessageResult.success) {
                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while Sending 'Invalid Reply While Searching']`), "\n", stringifyAirgramResponse(invalidReplyWhileSearchingMessageResult.reason));
            } else {
                console.log(getLogTime(), `[${user.id}} | ${messageId}]`, `[Sent 'Invalid Reply While Searching']`);
            }
        }
    }
}