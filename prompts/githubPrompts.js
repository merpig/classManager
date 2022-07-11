const inquirer = require("inquirer");
const selectUnitToAdd = require("./selectUnitToAdd");
const selectLessonPlan = require("./selectLessonPlan");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const githubPrompts = (basePrompts) => {
    const choices = [
        "Select unit to open",
        "Open all units",
        "Select lesson plan to open",
        "Update",
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
            case "Select unit to open":
                selectUnitToAdd("unitToOpen",githubPrompts);
                break;
            case "Open all units":
                selectUnitToAdd("openAllUnits",githubPrompts);
                break;
            case "Select lesson plan to open":
                selectLessonPlan(cm.insLessonPlansPath(),githubPrompts);
                break;
            case "Update":
                console.info(INFO_COLOR, `Updating ${fileManager.parseClassName(cm.insPath())}...`)
                fileManager.hardUpdateDirectory(cm.insPath());
                console.info(SUCCESS_COLOR, `Updated!`);
                githubPrompts();
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
            githubPrompts();
        }
    });
}

module.exports = githubPrompts;