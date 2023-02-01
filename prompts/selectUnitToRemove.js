const inquirer = require("inquirer");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const selectUnitToRemove = (gitlabPrompts,basePrompts) => {
    const choices = [
        ...cm.stuUnits(),
        BACK
    ];
    
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select unit to remove:",
            type: "list",
            choices
        }
    ])
    .then(({options})=>{
        console.clear();
        switch(options){
            case BACK:
                break;
            default:
                console.info(INFO_COLOR, `Removing unit ${options}...`);
                fileManager.removeUnit(cm.stuUnitPath(options));
                console.info(SUCCESS_COLOR, `Unit ${options} removed.`);
        }
        gitlabPrompts(basePrompts);
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            selectUnitToRemove(gitlabPrompts,basePrompts);
        }
    });
}

module.exports = selectUnitToRemove;