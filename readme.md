# Seth-Movies

A simple telegram user bot to serve users with movies and shows (we refer them all as 'movie' here.)

## File-Structure

**The outer files**

Include the entry point to the app and config files.
- [**index.js**](./index.js) | The entry point to the app.
- [**config.json**](./config.json) | Contains configuration data.
- [**readme.md**](./readme.md) | This is me 😊
- **other files** | Used by npm and git for configuration.

[**Data-store**](./data-store)

Used as in-file database.

- [**users-data**](./data-store/users-data) | Store users data.
  - [**users**](./data-store/users-data/users) | Store json files named after user_ids, each file contains detailed information about the user.
- [**movies-data**](./data-store/movies-data) | [NOT_DEALT_WITH_YET]

[**src**](./src)
- [**commons**](./src/commons) | Common resources to be used by the whole program
    - [**functions.js**](./src/commons/functions.js)
    - [**variables.js**](./src/commons/variables.js)
- [**handlers**](./src/handlers) | Programs to handel every activity in the app
    - [**incoming-handlers**](./src/handlers/incoming-handlers) | Handles new incoming messages. flow described [here](./src/handlers/incoming-handlers/readme.md)
    - [**outgoing-handlers**](./src/handlers/outgoing-handlers) | Handles new outgoing messages. flow described [here](./src/handlers/outgoing-handlers/readme.md)
    - [**deleted-messages-handler.js**](./src/handlers/deleted-messages-handler.js) | Handles deleted messages.
- [**modules**](./src/modules) | Modules to be used in the app
  - [**user**](./src/modules/user.js) | A class to deal with users data, well described in [entities](#entities) section.

**Other Folders** | Used by npm and airgram for configuration and data storage.
## Activities

**Movies get uploaded**

- Movies sent to a a channel known by this app,
- The app save info about the movie from there caption and other internal structures.

**Users get registered**

- By sending messages to the account running this app.

**Users search for movies**

- Specifying name or key-words,
- The app looks for the movie and respond accordingly.

## Entities

### [User](./src/modules/user.js)

A class to deal with users data, defined [here](./src/modules/user.js)

**Fields**

- id
- name
- country
- phone
- confirmed | _default: false_
- approved | _default: true_
- blocked | _default: false_
- lastRegistrationMessage

**Methods**

- constructor(id)
- get id()
- get contactInfo()
- get fullInfo()
- isRegistered()
- save()
- sendMessage(airgram, content)
- deleteMessages(airgram, messageIds, revoke)
- updateLastRegistrationMessage(field, text)

## Flow

1.  **New Incoming Message >** flow described [here](./src/handlers/incoming-handlers/readme.md)
2.  **New Outgoing Message >** flow described [here](./src/handlers/outgoing-handlers/readme.md)
3.  **Messages Got Deleted >** handled [here](./src/handlers/deleted-messages-handler.js)