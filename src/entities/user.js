
import path from "path";
import fs from "fs";
import { users_dir } from "../commons/variables.js";
import { deleteMessages, sendMessage } from "../commons/functions.js";

export default class User {
    #id;
    name;
    age;
    country;
    phone;
    confirmed = false;
    approved = true;
    blocked = false;
    lastRegistrationMessage;

    constructor(id) {
        this.#id = id;
        if (this.isRegistered()) {
            let user_file_path = path.resolve(users_dir, id + ".json");
            let user_data = fs.readFileSync(user_file_path, { encoding: 'utf-8' });
            user_data = JSON.parse(user_data);
            for (let [field, value] of Object.entries(user_data)) {
                try {
                    this[field] = value;
                } catch (error) { }
            }
        }
    }

    get id() {
        return this.#id
    }

    get contactInfo() {
        return {
            name: this.name,
            age: this.age,
            country: this.country,
            phone: this.phone
        }
    }

    get fullInfo() {
        let fullInfo = { id: this.id };
        for (let [key, value] of Object.entries(this)) {
            fullInfo[key] = value;
        }
        return fullInfo
    }

    isRegistered() {
        return fs.existsSync(path.resolve(users_dir, this.id + ".json"));
    }

    async save() {
        let user_data = this.fullInfo;
        let user_file_path = path.resolve(users_dir, this.id + ".json");
        return new Promise((resolve, reject) => {
            fs.writeFile(user_file_path, JSON.stringify(user_data), (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            })
        })
    }

    async addToContact(airgram) {
        let params = {
            contacts: [
                {
                    _: "contact",
                    phoneNumber: this.phone,
                    firstName: `${this.name} | ${this.id}`,
                    userId: this.id
                }
            ]
        };
        let result;
        try {
            result = await airgram.api.importContacts(params);
        } catch (error) {
            return { success: false, reason: error };
        }
        if (result._ == "error" || result.response._ == "error") {
            return { success: false, reason: result };
        } else if (result.response.userIds[0] == this.id) {
            return { success: true, result: true };
        } else {
            console.dir(result.response,{depth:null}) //
            return { success: true, result: false }
        }
    }

    async sendMessage(airgram, content) {
        return sendMessage(airgram, this.id, content);
    }

    async deleteMessages(airgram, messageIds, revoke) {
        return deleteMessages(airgram, this.id, messageIds, revoke);
    }

    updateLastRegistrationMessage(field, text) {
        this.lastRegistrationMessage = {
            field,
            text
        }
    }
}