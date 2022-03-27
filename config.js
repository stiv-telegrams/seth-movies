let allowedUserIdsRange = {
    min: 1,
    max: 40000000000
};

let dbInfo = {
    host: "localhost",
    user: "stiv",
    password: "0000",
    database: "seth_movies",
    userTableName: "users",
    moviesTableName: "movies",
}
let registrationMessages = {
    name: "Please let me know your real name\n\n*NOTE: Reply your answers to the question message.",
    age: "Hi %name% 👋, how old are you?",
    country: "Where do you live?",
    phone: "What is your phone number?\n[Format: +1234567890]",
    confirmation: "This is your information:\n\n%contactInfo%\nDo you confirm? [Yes | No]"
}
let serviceMessageTexts = {
    welcome: "Welcome...",
    successfulRegistration: "You are successfully registered.",
    willStartSoon: "You are a registered user. The service will be started soon.",
    restartRegistration: "Ok, we will restart the registration.",
    youAreBlocked: "Sorry, we can't serve you. [blocked by the admin]",
    yourIdIsOutOfRange: "Sorry we can't serve you. [user id out of our range]",
    waitForAdminApproval: "Please wait until an admin approves you.",
    userCommandUnderMaintenance: "Sorry, this command is not available yet.",
    tryAgainDueToInternalError: "Please try again [Internal Error]"
}
let validationMessageTexts = {
    notReplied: "You haven't replied to the last question.",
    wasExpectingText: "I was expecting 'Text Message' only.",
    invalidAge: "Invalid age.",
    invalidPhone: "Invalid phone, phone number must be in the form +1234567890",
    invalidOrDifferentPhone: "The phone number was invalid or different from the current account.",
    invalidConfirmation: "Confirmation must be yes or no.",
    invalidAnswerWhileSearching: "Invalid answer, please replay a valid number only.",
    invalidReplyWhileSearching: "You have replied to wrong message."
}
let validConfirmationAnswers = {
    yes: [
        "yes",
        "yeah",
        "ya",
        "yea",
        "y"
    ],
    no: [
        "no",
        "n"
    ]
}
let postChannelId = -1001608780817
let separatingLine = "———";

export { dbInfo, allowedUserIdsRange, serviceMessageTexts, registrationMessages, validationMessageTexts, validConfirmationAnswers, postChannelId, separatingLine }