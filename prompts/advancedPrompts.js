const inquirer = require("inquirer");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,INFO_COLOR} = require("../utils/constants");

const advancedPrompts = (basePrompts) => {
    const choices = [
        "Reset Class Manager",
        BACK,
        EXIT
    ];

    inquirer
    .prompt([
        {
            name: "options",
            message: "Select an option:",
            type: "list",
            choices
        }
    ]).then(({options})=>{
        console.clear();
        switch(options){
            case "Reset Class Manager":
                // move to fileManager
                child_process.execSync(`rm -rf github gitlab`);
                console.log(INFO_COLOR, "Exiting Class Manager");
                break;
            case BACK:
                basePrompts();
                break;
            default:
                console.log(INFO_COLOR, "Exiting Class Manager");
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            advancedPrompts();
        }
    });
}

module.exports = advancedPrompts;