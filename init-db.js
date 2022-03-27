import { dbInfo } from "./config.js";
import mysql from 'mysql';

let con = mysql.createConnection({
    host: dbInfo.host,
    user: dbInfo.user,
    password: dbInfo.password,
    database: dbInfo.database
});
console.log(`Connecting to host '${dbInfo.host}'...`)
con.connect(error => {
    if (error) {
        console.error(`[Error: Couldn't connect to host '${dbInfo.host}'.]\n`, error);
        process.exit();
    } else {
        console.log("Connected.");
        console.log(`\nCreating database '${dbInfo.database}'...`);
        let createDbQuery = `CREATE DATABASE ${dbInfo.database}`;
        con.query(createDbQuery, error => {
            if (error) {
                console.error(`[Error: Couldn't create the database '${dbInfo.database}'. Database may already exist.]\nReason:`, error.sqlMessage ?? error);
                process.exit();
            }
            console.log("Database created.");
            console.log(`\nCreating table '${dbInfo.moviesTableName}'...`);
            let createUserTableQuery = "CREATE TABLE " + dbInfo.moviesTableName + " (\
                    id INT AUTO_INCREMENT PRIMARY KEY, \
                    uniqueId VARCHAR(2000) NOT NULL UNIQUE, \
                    type VARCHAR(255) NOT NULL, \
                    category VARCHAR(255) NOT NULL, \
                    title VARCHAR(255) NOT NULL, \
                    season VARCHAR(255), \
                    episode VARCHAR(255), \
                    quality VARCHAR(20) NOT NULL, \
                    messageId bigint NOT NULL, \
                    fromChatId bigint NOT NULL, \
                    keywords VARCHAR(255), \
                    description VARCHAR(1500), \
                    year VARCHAR(20), \
                    duration bigint, \
                    fileSize bigint \
                    )";
            con.query(createUserTableQuery, error => {
                if (error) {
                    console.error(`[Error: Couldn't create the table '${dbInfo.moviesTableName}'. Table may already exist.]\nReason:`, error.sqlMessage ?? error);
                    process.exit();
                } else {
                    console.log("Table created.");
                    process.exit();
                }
            });
        })
    }
});