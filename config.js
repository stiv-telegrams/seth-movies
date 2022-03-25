let allowedUserIdsRange = {
    "min": 1,
    "max": 400000000
};
let serviceMessageTexts = {
    "welcome": "Welcome to chat.",
    "successfulRegistration": "You are successfully registered.",
    "willStartSoon": "You are a registered user. The service will be started soon.",
    "restartRegistration": "Ok, we will restart the registration.",
    "youAreBlocked": "Sorry, we can't serve you. [blocked by the admin]",
    "yourIdIsOutOfRange": "Sorry we can't serve you. [user id out of our range]",
    "waitForAdminApproval": "Please wait until an admin approves you.",
    "userCommandUnderMaintenance":"Sorry, this command is not available yet.",
    "tryAgainDueToInternalError": "Please try again [Internal Error]",
    "invalidReplyWhileSearching":"You have replied to wrong message."
}
let registrationMessages = {
    "name": "Please let me know your real name",
    "age": "Hi %name%, may I know how old you are?",
    "country": "where do you live?",
    "phone": "whats your phone number? [Format: +1234567890]",
    "confirmation": "This is your information:\n\n%contactInfo%\nDo you confirm? [Yes | No]"
}
let validationMessageTexts = {
    "notReplied": "You haven't replied to the last question.",
    "wasExpectingText": "I was expecting 'Text Message' only.",
    "invalidAge": "Invalid age.",
    "invalidPhone": "Invalid phone, phone number must be in the form +1234567890",
    "invalidOrDifferentPhone": "The phone number was invalid or different from the current account.",
    "invalidConfirmation": "Confirmation must be yes or no."
}
let validConfirmationAnswers = {
    "yes": [
        "yes",
        "yeah",
        "ya",
        "yea",
        "y"
    ],
    "no": [
        "no",
        "n"
    ]
}
let postChannelId = -1001608780817

export { allowedUserIdsRange, serviceMessageTexts, registrationMessages, validationMessageTexts, validConfirmationAnswers, postChannelId }