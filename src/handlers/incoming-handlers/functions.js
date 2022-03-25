
import { separatingLine } from "../../../config.js";
function makeMovieQuestion(perviousFields, nextField, options){
    let question = "";
    perviousFields = perviousFields.map(field => (""+field)[0].toUpperCase()+(""+field).substring(1));
    question+=perviousFields.join(" > ")+" >\n";
    question+=separatingLine+"\n";
    question+=`Choose ${nextField[0].toUpperCase()+nextField.substring(1)}`+"\n";
    let count = 1;
    for (let option of options){
        question+= `${count} > ${option}` + "\n"
        count++
    }
    return question;
}

export {makeMovieQuestion};