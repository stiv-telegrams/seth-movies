import mysql from 'mysql'
import { Airgram, Auth } from 'airgram';
import prompt from "prompt-sync";
import color from "cli-color";
import dotenv from "dotenv";
import { welcomeAtLoginText } from './variables.js';

const getLine = prompt();
dotenv.config();

/**
 * returns the current time formatted for logging
 */
function getLogTime() {
    let now = new Date().toISOString();
    now = now.replace("Z", "").replace(/\-/g, ":").replace("T", " | ");
    now = now.split(".")[0];
    now = now.substring(now.indexOf(":") + 1, now.lastIndexOf(":"))
    return color.blue("[" + now + "]");
}
/**
 * Changes first letter of the given text to upper case, and the rest to lower case.
 * @param {string} text 
 * @returns {string}
 */
function capitalize(text) {
    return `${text[0].toUpperCase() + text.substring(1).toLowerCase()}`;
}

/**
 * returns an airgram object
 */
function getAirgram(
    apiId = process.env.API_ID,
    apiHash = process.env.API_HASH,
    command = process.env.TDLIB_COMMAND,
    logVerbosityLevel = 0) {
    return new Airgram({
        // @ts-ignore
        apiId,
        apiHash,
        command,
        logVerbosityLevel,
    });
}

function authUser(airgram) {
    airgram.use(new Auth({
        phoneNumber: () => getLine(`Phone number: `),
        code: () => getLine(`Login code: `),
        password: () => getLine("Password: ", { echo: "*" })
    }))
}

async function getAllChats(airgram) {
    let params = {
        chatList: null,
        limit: 99999999
    }
    let result;
    try {
        result = await airgram.api.getChats(params);
    } catch (error) {
        return { success: false, reason: error };
    }
    if (result._ == "error" || result.response._ == "error") {
        return { success: false, reason: result };
    } else {
        return { success: true, result: result.response }
    }
}
async function welcomeAtLogin(airgram) {
    try {
        let me = await airgram.api.getMe();
        console.log(welcomeAtLoginText(me.response.firstName));
    } catch (error) {
        console.error("[Error while welcoming at login]");
        console.dir(error, { depth: null });
    }
}

async function sendMessage(airgram, chatId, content, options) {
    if (!chatId) {
        return { success: false, reason: "CHAT_ID_NOT_SPECIFIED" };
    } else if (!content) {
        return { success: false, reason: "CONTENT_NOT_SPECIFIED" };
    }
    let type = content.type;
    if (!type) {
        return { success: false, reason: "CONTENT_TYPE_NOT_SPECIFIED" };
    }
    let params;
    switch (type) {
        case "text":
            let text = content.text;
            if (!text) {
                return { success: false, reason: "MESSAGE_TEXT_NOT_SPECIFIED" };
            }
            params = {
                chatId,
                inputMessageContent: {
                    _: "inputMessageText",
                    text: {
                        _: "formattedText",
                        text
                    }
                }
            }
            break;
        default:
            return { success: false, reason: "UNSUPPORTED_CONTENT_TYPE" };
    }
    let result;
    try {
        result = await airgram.api.sendMessage(params);
    } catch (error) {
        return { success: false, reason: error };
    }
    if (result._ == "error" || result.response._ == "error") {
        return { success: false, reason: result };
    } else {
        return { success: true, result: result.response }
    }
}

async function deleteMessages(airgram, chatId, messageIds, revoke = true) {
    let params = {
        chatId,
        messageIds,
        revoke
    }
    let result;
    try {
        result = await airgram.api.deleteMessages(params);
    } catch (error) {
        return { success: false, reason: error };
    }
    if (result._ == "error" || result.response._ == "error") {
        return { success: false, reason: result };
    } else {
        return { success: true, result: result.response }
    }
}

/**
 * removes the airgram object from the airgram 
 * api response while stringify the response object
 */
function removeAirgram(key, value) {
    if (key == "airgram") return undefined;
    else return value;
}

function stringifyAirgramResponse(airgramResponse) {
    return JSON.stringify(airgramResponse, removeAirgram, 2);
}

// mysql methods

/**
 * Checks if a row with the given columns data exists or not
 * @param {mysql.Connection} con a mysql connection
 * @param {string} table mysql table name
 * @param {*} conditionsObject conditions to define the row to be checked
 */
async function rowExists(con, table, conditionsObject) {
    let conditionParams = [];
    let values = [];
    if (conditionsObject) {
        for (let [column, data] of Object.entries(conditionsObject)) {
            conditionParams.push(`${column}=${data ? `?` : `NULL`}`);
        }
        // @ts-ignore
        conditionParams = conditionParams.join(" AND ");
        values = [...Object.values(conditionsObject).filter(condition => condition !== undefined)]
    }
    let query = `SELECT EXISTS(SELECT * FROM ${table} ${conditionsObject ? 'WHERE ' + conditionParams : ""})`;
    return new Promise((resolve, reject) => {
        con.query(query, values, (error, result) => {
            if (error) {
                reject(error);
            } else {
                try {
                    resolve(Object.values(result[0])[0]);
                } catch (error) {
                    reject(error);
                }

            }
        })
    });
}

/**
 * Adds a row to mysql table
 * @param {mysql.Connection} con a mysql connection
 * @param {string} table mysql table name
 * @param {*} rowData columnName to data pair object
 */
async function addRow(con, table, rowData) {
    let columns = Object.keys(rowData).join(", ");
    let dataParams = Object.values(rowData).map(data => data ? `?` : `NULL`).join(", ");
    let dataValues = Object.values(rowData).filter(data => data !== undefined);
    let query = `INSERT INTO ${table} (${columns}) VALUES (${dataParams})`;
    return new Promise((resolve, reject) => {
        con.query(query, dataValues, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    });
}

/**
 * Updates a row(s) in mysql table
 * @param {mysql.Connection} con a mysql connection
 * @param {string} table mysql table name
 * @param {*} columns columns to be returned
 * @param {*} conditionsObject conditions to define the rows to be edited to data pair object
 */
async function getRows(con, table, columns, conditionsObject) {
    let conditionParams = [];
    let values = [];
    if (conditionsObject) {
        for (let [column, data] of Object.entries(conditionsObject)) {
            conditionParams.push(`${column}=${data ? `?` : `NULL`}`);
        }
        // @ts-ignore
        conditionParams = conditionParams.join(" AND ");
        values = [...Object.values(conditionsObject).filter(condition => condition !== undefined)]
    }
    columns = columns.join(" , ");
    let query = `SELECT ${columns} FROM ${table} ${conditionsObject ? 'WHERE ' + conditionParams : ""} ORDER BY ${columns} ASC `;
    return new Promise((resolve, reject) => {
        con.query(query, values, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    });
}

/**
 * Updates a row(s) in mysql table
 * @param {mysql.Connection} con a mysql connection
 * @param {string} table mysql table name
 * @param {*} newDataObject columnName to newData pair object
 * @param {*} conditionsObject conditions to define the rows to be edited to data pair object
 */
async function updateRows(con, table, newDataObject, conditionsObject) {
    let conditionParams = [];
    let values = [];
    if (conditionsObject) {
        for (let [column, data] of Object.entries(conditionsObject)) {
            conditionParams.push(`${column}=${data ? `?` : `NULL`}`);
        }
        // @ts-ignore
        conditionParams = conditionParams.join(" AND ");
        values = [...Object.values(conditionsObject).filter(condition => condition !== undefined)]
    }

    let newDataParams = [];
    for (let [column, data] of Object.entries(newDataObject)) {
        newDataParams.push(`${column}=${data ? `?` : `NULL`}`);
    }
    values = [...Object.values(newDataParams).filter(data => data), ...values];
    let query = `UPDATE ${table} SET ${newDataParams} ${conditionsObject ? 'WHERE ' + conditionParams : ""}`;
    return new Promise((resolve, reject) => {
        con.query(query, values, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    });
}
export {
    getLogTime,
    capitalize,
    getAirgram,
    authUser,
    getAllChats,
    welcomeAtLogin,
    sendMessage,
    deleteMessages,
    stringifyAirgramResponse,
    rowExists,
    addRow,
    getRows,
    updateRows
};