let welcomeAtLoginText = (firstName) => `\nHi ${firstName} 👋, good to see you here!`;
let users_dir = "data-store/users-data/users";
let commandsRegex = /^\#\S+\s?/;
export { welcomeAtLoginText, users_dir, commandsRegex };