let allowedUserIdsRange = {
    "min": 1,
    "max": 400000000
};
let serviceMessageTexts = {
    "welcome": "Welcome to chat.",
    "successfulRegistration": "You are successfully registered. The service will be started soon.",
    "willStartSoon": "You are a registered user. The service will be started soon.",
    "restartRegistration": "Ok, we will restart the registration.",
    "youAreBlocked": "Sorry, we can't serve you. [blocked by the admin]",
    "yourIdIsOutOfRange": "Sorry we can't serve you. [user id out of our range]",
    "waitForAdminApproval": "Please wait until an admin approves you.",
    "tryAgain": "Please try again [%reason%]",
    "tryAgainDueToInternalError": "Please try again [Internal Error]"
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
    "wasExpectingText": "The answer must be a text message.",
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