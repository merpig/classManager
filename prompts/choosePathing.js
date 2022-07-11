const inquirer = require("inquirer");
const defaultPaths = require("./defaultPaths");
const selectExistingPath = require("./selectExistingPath");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const choosePathing = () => {
    const choices = [
        "Default Pathing (stores in classManager)",
        "Select paths for existing content",
        //"Select paths to clone content to",
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
                case "Default Pathing (stores in classManager)":
                    defaultPaths();
                    break;
                case "Select paths for existing content":
                    selectExistingPath("/","instructor",true,choosePathing);
                    break;
                case "Select paths to clone content to":
                    selectExistingPath("/","instructor",false,choosePathing);
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
                choosePathing();
            }
        });
}

module.exports = choosePathing;