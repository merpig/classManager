const inquirer = require("inquirer");
const choosePathing = require("./choosePathing")
const {EXIT,ERROR_COLOR,INFO_COLOR} = require("../utils/constants");

const settupPrompts = () => {
    const choices = [
        "Settup repository paths",
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
        ]).then(({options}) => {
            console.clear();
            switch(options){
                case "Settup repository paths":
                    choosePathing();
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
            }
        });
}

module.exports = settupPrompts;