
import color from "cli-color";
import { getLogTime, stringifyAirgramResponse } from "../../commons/functions.js";
import { serviceMessageTexts, registrationMessages, validationMessageTexts, validConfirmationAnswers } from "../../../config.js";
import { movieSearchFirstMessage } from "./variables.js";

export default async function registrationHandler(airgram, message, user) {
    let messageId = message.id;
    if (!user.lastRegistrationMessage) {
        let welcomeMessageContent = {
            type: "text",
            text: serviceMessageTexts.welcome
        }
        let welcomeMessageResult = await user.sendMessage(airgram, welcomeMessageContent);
        if (!welcomeMessageResult.success) {
            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Welcoming_New_User']`), "\n", stringifyAirgramResponse(welcomeMessageResult.reason));
        } else {
            console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[New User Welcomed]`);
        }
        let askNameMessageContent = {
            type: "text",
            text: registrationMessages.name
        }
        let askNameMessageResult = await user.sendMessage(airgram, askNameMessageContent);
        if (!askNameMessageResult.success) {
            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Name']`), "\n", stringifyAirgramResponse(askNameMessageResult.reason));
        } else {
            let sentMessageId = askNameMessageResult.result.id;
            user.updateLastRegistrationMessage("name", askNameMessageContent.text);
            try {
                await user.save();
                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Name Asked]`);
            } catch (error) {
                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'saving name asked']`), "\n", error);
                let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId, welcomeMessageResult.result.id]);
                if (!deleteLastMessageResult.success) {
                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Welcome and Name Question']`), "\n", deleteLastMessageResult.reason);
                }
                let retryMessageContent = {
                    type: "text",
                    text: serviceMessageTexts.tryAgainDueToInternalError
                }
                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                if (!retryMessageResult.success) {
                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [First Message]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                }
            }
        }
    } else {
        let notReplied;
        if (!message.replyToMessageId) {
            notReplied = true;
        } else {
            let repliedToMessage, apiError;
            try {
                repliedToMessage = await airgram.api.getMessage({ chatId: user.id, messageId: message.replyToMessageId });
            } catch (error) {
                apiError = error;
            }
            if (apiError || repliedToMessage._ == "error" || repliedToMessage.response._ == "error") {
                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'getting repliedToMessage'`), "\n", stringifyAirgramResponse(repliedToMessage || apiError));
                let retryMessageContent = {
                    type: "text",
                    text: serviceMessageTexts.tryAgainDueToInternalError
                }
                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                if (!retryMessageResult.success) {
                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [get repliedToMessage]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason || apiError));
                }
                return;
            } else {
                let escapeRegex = /\W/g;
                let repliedToText = repliedToMessage.response?.content?.text?.text;
                repliedToText = repliedToText.replace(escapeRegex, "");
                let lastText = (user.lastRegistrationMessage.text).replace(escapeRegex, "");
                if (!repliedToText) {
                    notReplied = true;
                } else if (!repliedToMessage.response.isOutgoing || !repliedToText.match(lastText)) {
                    notReplied = true;
                }
            }
        }
        if (notReplied) {
            let notRepliedMessageContent = {
                type: "text",
                text: validationMessageTexts.notReplied
            }
            let notRepliedMessageResult = await user.sendMessage(airgram, notRepliedMessageContent);
            if (!notRepliedMessageResult.success) {
                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Not_Replied']`), "\n", stringifyAirgramResponse(notRepliedMessageResult.reason));
            } else {
                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[User Not Replied]`);
            }
        } else if (message.content._ != "messageText") {
            let wasExpectingTextMessageContent = {
                type: "text",
                text: validationMessageTexts.wasExpectingText
            }
            let wasExpectingTextMessageResult = await user.sendMessage(airgram, wasExpectingTextMessageContent);
            if (!wasExpectingTextMessageResult.success) {
                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Was_Expecting_text']`), "\n", stringifyAirgramResponse(wasExpectingTextMessageResult.reason));
            } else {
                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[None-Text Message While registering]`);
            }

        } else {
            switch (user.lastRegistrationMessage.field) {
                case "name":
                    let name = message.content.text.text;
                    user.name = name;
                    let askAgeMessageContent = {
                        type: "text",
                        text: (registrationMessages.age).replace(/\%name\%/, user.name)
                    }
                    let askAgeMessageResult = await user.sendMessage(airgram, askAgeMessageContent);
                    if (!askAgeMessageResult.success) {
                        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Age']`), "\n", stringifyAirgramResponse(askAgeMessageResult.reason));
                    } else {
                        let sentMessageId = askAgeMessageResult.result.id;
                        user.updateLastRegistrationMessage("age", askAgeMessageContent.text);
                        try {
                            await user.save();
                            console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Age Asked]`);
                        } catch (error) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Saving Name']`), "\n", error);
                            let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId]);
                            if (!deleteLastMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Age Question']`), "\n", deleteLastMessageResult.reason);
                            }
                            let retryMessageContent = {
                                type: "text",
                                text: serviceMessageTexts.tryAgainDueToInternalError
                            }
                            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                            if (!retryMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [name]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                            }
                        }
                    }
                    break;
                case "age":
                    let age = parseInt(message.content.text.text);
                    if (!Number.isInteger(age) || age < 1) {
                        console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Invalid Age]`);
                        let invalidAgeMessageContent = {
                            type: "text",
                            text: validationMessageTexts.invalidAge
                        }
                        let invalidAgeMessageResult = await user.sendMessage(airgram, invalidAgeMessageContent);
                        if (!invalidAgeMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling Invalid Age']`), "\n", stringifyAirgramResponse(invalidAgeMessageResult.reason));
                        }
                    } else {
                        user.age = age;
                        let askCountryMessageContent = {
                            type: "text",
                            text: registrationMessages.country
                        }
                        let askCountryMessageResult = await user.sendMessage(airgram, askCountryMessageContent);
                        if (!askCountryMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Country']`), "\n", stringifyAirgramResponse(askCountryMessageResult.reason));
                        } else {
                            let sentMessageId = askCountryMessageResult.result.id;
                            user.updateLastRegistrationMessage("country", askCountryMessageContent.text);
                            try {
                                await user.save();
                                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Country Asked]`);
                            } catch (error) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Saving Age']`), "\n", error);
                                let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId]);
                                if (!deleteLastMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Country Question']`), "\n", deleteLastMessageResult.reason);
                                }
                                let retryMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.tryAgainDueToInternalError
                                }
                                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                if (!retryMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [age]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                }
                            }
                        }
                    }
                    break;
                case "country":
                    let country = message.content.text.text;
                    user.country = country;
                    let askPhoneMessageContent = {
                        type: "text",
                        text: registrationMessages.phone
                    }
                    let askPhoneMessageResult = await user.sendMessage(airgram, askPhoneMessageContent);
                    if (!askPhoneMessageResult.success) {
                        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Phone']`), "\n", stringifyAirgramResponse(askPhoneMessageResult.reason));
                    } else {
                        let sentMessageId = askPhoneMessageResult.result.id;
                        user.updateLastRegistrationMessage("phone", askPhoneMessageContent.text);
                        try {
                            await user.save();
                            console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Phone Asked]`);
                        } catch (error) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Saving Country']`), "\n", error);
                            let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId]);
                            if (!deleteLastMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Phone Question']`), "\n", deleteLastMessageResult.reason);
                            }
                            let retryMessageContent = {
                                type: "text",
                                text: serviceMessageTexts.tryAgainDueToInternalError
                            }
                            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                            if (!retryMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [country]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                            }
                        }
                    }
                    break;
                case "phone":
                    let phoneFormat = /^\+\d{5,20}$/;
                    let phone = message.content.text.text;
                    if (!phoneFormat.test(phone)) {
                        console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Invalid Phone]`);
                        let invalidPhoneMessageContent = {
                            type: "text",
                            text: validationMessageTexts.invalidPhone
                        }
                        let invalidPhoneMessageResult = await user.sendMessage(airgram, invalidPhoneMessageContent);
                        if (!invalidPhoneMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling Invalid Age']`), "\n", stringifyAirgramResponse(invalidPhoneMessageResult.reason));
                        }
                    } else {
                        user.phone = phone;
                        let contact_info = "";
                        for (let [field, value] of Object.entries(user.contactInfo)) {
                            contact_info += `${field[0].toUpperCase() + "" + field.slice(1).toLowerCase()}: ${value}\n`;
                        }
                        let askConfirmationMessageContent = {
                            type: "text",
                            text: (registrationMessages.confirmation).replace(/\%contactInfo\%/g, contact_info)
                        }
                        let askConfirmationMessageResult = await user.sendMessage(airgram, askConfirmationMessageContent);
                        if (!askConfirmationMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Confirmation']`), "\n", stringifyAirgramResponse(askConfirmationMessageResult.reason));
                        } else {
                            let sentMessageId = askConfirmationMessageResult.result.id;
                            user.updateLastRegistrationMessage("confirmation", askConfirmationMessageContent.text);
                            try {
                                await user.save();
                                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Confirmation Asked]`);
                            } catch (error) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Saving Phone']`), "\n", error);
                                let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId]);
                                if (!deleteLastMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Confirmation Question']`), "\n", deleteLastMessageResult.reason);
                                }
                                let retryMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.tryAgainDueToInternalError
                                }
                                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                if (!retryMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [phone]']`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                }
                            }
                        }
                    }
                    break;
                case "confirmation":
                    let answer = message.content.text.text;
                    answer = answer.toLowerCase();
                    if (validConfirmationAnswers.yes.includes(answer)) {
                        let addToContactResult = await user.addToContact(airgram);
                        if (!addToContactResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Adding To Contact']`), "\n", addToContactResult.result);
                            let retryMessageContent = {
                                type: "text",
                                text: serviceMessageTexts.tryAgainDueToInternalError
                            }
                            let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                            if (!retryMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Confirmation]'][1]`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                            }
                        } else if (!addToContactResult.result) {
                            console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Invalid or Different Phone]`);
                            let invalidOrDifferentPhoneMessageContent = {
                                type: "text",
                                text: validationMessageTexts.invalidOrDifferentPhone
                            }
                            let invalidOrDifferentPhoneMessageResult = await user.sendMessage(airgram, invalidOrDifferentPhoneMessageContent);
                            if (!invalidOrDifferentPhoneMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling Invalid Or Different Phone']`), "\n", stringifyAirgramResponse(invalidOrDifferentPhoneMessageResult.reason));
                            }
                            let askPhoneMessageContent = {
                                type: "text",
                                text: registrationMessages.phone
                            }
                            let askPhoneMessageResult = await user.sendMessage(airgram, askPhoneMessageContent);
                            if (!askPhoneMessageResult.success) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Phone_After_Invalid_Or_Different_Phone']`), "\n", stringifyAirgramResponse(askPhoneMessageResult.reason));
                            } else {
                                let sentMessageId = askPhoneMessageResult.result.id;
                                user.updateLastRegistrationMessage("phone", askPhoneMessageContent.text);
                                try {
                                    await user.save();
                                    console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Phone Asked After Invalid Or Different Phone]`);
                                } catch (error) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Saving Phone Question After Invalid Or Different Phone']`), "\n", error);
                                    let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId, askPhoneMessageResult.result.id]);
                                    if (!deleteLastMessageResult.success) {
                                        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Phone Question After Invalid Or Different Phone']`), "\n", deleteLastMessageResult.reason);
                                    }
                                    let retryMessageContent = {
                                        type: "text",
                                        text: serviceMessageTexts.tryAgainDueToInternalError
                                    }
                                    let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                    if (!retryMessageResult.success) {
                                        console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Confirmation]'][2]`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                    }
                                }
                            }
                        } else {
                            user.confirmed = true;
                            user.lastRegistrationMessage = undefined;
                            try {
                                await user.save();
                                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[User Confirmed]`);
                                let successfulRegistrationMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.successfulRegistration
                                }
                                let successfulRegistrationMessageResult = await user.sendMessage(airgram, successfulRegistrationMessageContent);
                                if (!successfulRegistrationMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling Successful Registration']`), "\n", stringifyAirgramResponse(successfulRegistrationMessageResult.reason));
                                } else {
                                    console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Told Successful Registration]`);
                                }
                                let movieSearchFirstMessageContent = {
                                    type: "text",
                                    text: movieSearchFirstMessage
                                }
                                let movieSearchFirstMessageFirstTimeResult = await user.sendMessage(airgram, movieSearchFirstMessageContent);
                                if (!movieSearchFirstMessageFirstTimeResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Sending Movie Search First Message First Time']`), "\n", stringifyAirgramResponse(movieSearchFirstMessageFirstTimeResult.reason));
                                } else {
                                    console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Sent Movie Search First Message First Time]`);
                                }
                            } catch (error) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Saving Confirmation']`), "\n", error);
                                let retryMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.tryAgainDueToInternalError
                                }
                                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                if (!retryMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Confirmation]'][3]`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                }
                            }
                        }
                    } else if (validConfirmationAnswers.no.includes(answer)) {
                        let restartRegistrationMessageContent = {
                            type: "text",
                            text: serviceMessageTexts.restartRegistration
                        }
                        let restartRegistrationMessageResult = await user.sendMessage(airgram, restartRegistrationMessageContent);
                        if (!restartRegistrationMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Restart_Registration']`), "\n", stringifyAirgramResponse(restartRegistrationMessageResult.reason));
                        } else {
                            console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Registration Restarted]`);
                        }

                        let askNameMessageContent = {
                            type: "text",
                            text: registrationMessages.name
                        }
                        let askNameMessageResult = await user.sendMessage(airgram, askNameMessageContent);
                        if (!askNameMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while handling 'Asking_Name']`), "\n", stringifyAirgramResponse(askNameMessageResult.reason));
                        } else {
                            let sentMessageId = askNameMessageResult.result.id;
                            user.updateLastRegistrationMessage("name", askNameMessageContent.text);
                            try {
                                await user.save();
                                console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Name Asked]`);
                            } catch (error) {
                                console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'saving name asked']`), "\n", error);
                                let deleteLastMessageResult = await user.deleteMessages(airgram, [sentMessageId, restartRegistrationMessageResult.result.id]);
                                if (!deleteLastMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Deleting Restart Registration and Name Question']`), "\n", deleteLastMessageResult.reason);
                                }
                                let retryMessageContent = {
                                    type: "text",
                                    text: serviceMessageTexts.tryAgainDueToInternalError
                                }
                                let retryMessageResult = await user.sendMessage(airgram, retryMessageContent);
                                if (!retryMessageResult.success) {
                                    console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling To Retry [Confirmation]'][4]`), "\n", stringifyAirgramResponse(retryMessageResult.reason));
                                }
                            }
                        }
                    } else {
                        console.log(getLogTime(), `[${user.Id} | ${messageId}]`, `[Invalid Confirmation]`);
                        let invalidConfirmationMessageContent = {
                            type: "text",
                            text: validationMessageTexts.invalidConfirmation
                        }
                        let invalidConfirmationMessageResult = await user.sendMessage(airgram, invalidConfirmationMessageContent);
                        if (!invalidConfirmationMessageResult.success) {
                            console.error(getLogTime(), `[${user.id} | ${messageId}]`, color.red(`[Error while 'Telling Invalid Confirmation']`), "\n", stringifyAirgramResponse(invalidConfirmationMessageResult.reason));
                        }
                    }
                    break;
            }
        }
    }
}