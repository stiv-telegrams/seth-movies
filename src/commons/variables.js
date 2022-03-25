let welcomeAtLoginText = (firstName) => `Hi ${firstName}, good to see you here!`;
let users_dir = "data-store/users-data/users";
let movies_dir = "data-store/movies-data/contents";
let commandsRegex = /^\#\S+\s?/;
let separatingLine = "———"
export { welcomeAtLoginText, users_dir, movies_dir, commandsRegex, separatingLine };