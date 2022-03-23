
import path from "path";
import fs from "fs";
import { users_dir } from "../commons/variables.js";
import { deleteMessages, sendMessage } from "../commons/functions.js";
// const { serviceMessageTexts } = JSON.parse(fs.readFileSync(path.resolve("config.json"), "utf-8"));
import { serviceMessageTexts } from "../../config.js";

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

    save() {
        let user_data = this.fullInfo;
        let user_file_path = path.resolve(users_dir, this.id + ".json");
        fs.writeFile(user_file_path, JSON.stringify(user_data), (error) => {
            if (error) {
                throw error;
            }
        })
    }

    async addToContact(airgram) {
        let result = await airgram.api.importContacts({
            contacts: [
                {
                    _: "contact",
                    phoneNumber: this.phone,
                    firstName: `${this.name} | ${this.id}`,
                    userId: this.id
                }
            ]
        });
        if (result._ == "error" || result.response._ == "error") {
            return { success: false, reason: result };
        } else if (result.response.userIds[0] == this.id) {
            return { success: true, result: true };
        } else {
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

    // validate(field, value) {
    //     if (!(field && value)) {
    //         return { success: false, reason: "FIELD_OR_VALUE_NOT_SPECIFIED" };
    //     }
    //     switch (field) {
    //         case "age":
    //             let age = parseInt(value);
    //             if (Number.isInteger(age) && age > validations.minAge) {
    //                 return { success: true, result: true, value: age };
    //             } else {
    //                 return { success: true, result: false, message: `Age must be a number greater than or equal to ${validations.minAge}.` };
    //             }
    //         case "phone":
    //             let phoneFormat = /^\+?\d{10,13}$/;
    //             if (phoneFormat.test(value)) {
    //                 return { success: true, result: true, value };
    //             } else {
    //                 return { success: true, result: false, message: `Phone number must be 10-13 digit number.` };
    //             }
    //         case "confirm":
    //             try {
    //                 let confirm = value.toLowerCase();
    //                 if (confirm === "yes" || confirm === "no") {
    //                     return { success: true, result: true, value: confirm };
    //                 } else {
    //                     throw "";
    //                 }
    //             } catch (error) {
    //                 return { success: true, result: false, message: `Only Yes and No are acceptable` };
    //             }

    //         default:
    //             return { success: true, result: true, value };
    //     }
    // }
}