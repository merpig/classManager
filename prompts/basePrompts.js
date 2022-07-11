const inquirer = require("inquirer");
const githubPrompts = require("./githubPrompts");
const gitlabPrompts = require("./gitlabPrompts");
const advancedPrompts = require("./advancedPrompts");
const cm = require("../utils/cm");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const basePrompts = () => {
    const choices = [
        `Manage ${cm.insPath().split("/").pop()}`,
        `Manage ${cm.stuPath().split("/").pop()}`,
        "Advanced Options",
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
    ]).then(async ({options})=>{
        console.clear();
        switch(options){
            case `Manage ${cm.insPath().split("/").pop()}`:
                githubPrompts(basePrompts);
                break;
            case `Manage ${cm.stuPath().split("/").pop()}`:
                gitlabPrompts(basePrompts);
                break;
            case "Advanced Options":
                advancedPrompts(basePrompts);
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
            basePrompts();
        }
    });
}

module.exports = basePrompts;