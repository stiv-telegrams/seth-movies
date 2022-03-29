let allowedUserIdsRange = {
    min: 1,
    max: 40000000000
};

let defaults = {
    quality:"720p"
}

let dbInfo = {
    host: "localhost",
    user: "stiv",
    password: "0000",
    database: "seth_movies",
    userTableName: "users",
    moviesTableName: "movies",
}
let notes = {
    replayToQuestionMessage: "Reply your answers to the question message.",
    searchWithoutReply: "To search with title or a keyword, send the title or keyword with out reply.",
    ifHiddenPhone: "If your phone number is hidden, allow me to see your phone (add me to your contacts) and try again.",
    useBrowse: "You can send #browse to see what videos do we have."
}
let registrationMessages = {
    name: `Please let me know your real name\n\n*NOTE: ${notes.replayToQuestionMessage}`,
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
    tryAgainDueToInternalError: "Please try again [Internal Error]",
    contentNotFound: "Content Not Found!",
    episodesNot: "Episodes Not Found!",
    episodeNot: "Episode Not Found!",
    noResultFound: `No result found for your search!\n\n*NOTE ${notes.useBrowse}`,
    hereAreSearchResultsMessage: "The results for your search...",
    youJustGotUnapproved: "You just got unapproved! Wait until an admin approves you.",
    youJustGotApproved: "Hi, you have got approved!"
}
let validationMessageTexts = {
    notReplied: "You haven't replied to the last question.",
    wasExpectingText: "I was expecting 'Text Message' only.",
    invalidAge: "Invalid age.",
    invalidPhone: "Invalid phone, phone number must be in the form +1234567890",
    invalidOrDifferentPhone: `The phone number was invalid or different from the current account.\n\n*NOTE ${notes.ifHiddenPhone}`,
    invalidConfirmation: "Confirmation must be yes or no.",
    invalidAnswerWhileSearching: "Invalid answer, please replay a valid number only.",
    invalidReplyWhileSearching: "You have replied to wrong message."
}
let otherTexts = {
    allEpisodes: "All Episodes"
}
let types = {
    m: {
        name: "Movies",
        type: "single"
    },
    s: {
        name: "Series",
        type: "series"
    },
    sh: {
        name: "Shows",
        type: "series"
    },
    sm: {
        name: "Short Movies",
        type: "single"
    },
    d: {
        name: "Documentaries",
        type: "single"
    }
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
let postChannelIds = {
    "-1001608780817": "Ref_Tracker_Channel"
}
let separatingLine = "———";

export {
    dbInfo,
    defaults,
    allowedUserIdsRange,
    notes,
    types,
    serviceMessageTexts,
    otherTexts,
    registrationMessages,
    validationMessageTexts,
    validConfirmationAnswers,
    postChannelIds,
    separatingLine
}