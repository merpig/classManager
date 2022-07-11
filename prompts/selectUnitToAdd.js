const inquirer = require("inquirer");
const promptForSelection = require("./promptForSelection");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const selectUnitToAdd = (type,cbPrompts) => {
    let units;
    let message;

    if(type === "unsolved") {
        message = "Select unit to add:";
        units = cm.insUnits().filter(unit=>!cm.stuUnits().includes(unit));
    }
    else {
        if(type==="solved") message = "Select unit to add all solved to:";
        else if(type==="selectionSolved") message = "Select unit to add selection of solved to:";
        else if(type==="removeAllSolved") message = "Select unit to remove all solved from:";
        else if(type==="removeSelectionSolved") message = "Select unit to remove selection of solved from:";
        else if(type==="unitToOpen") message = "Select unit to open:";
        else if(type==="openAllUnits"){
            fileManager.openAtPath(cm.insUnitsPath());
            return cbPrompts();
        }
        if(type==="unitToOpen") units = cm.stuUnits();
        else units = cm.stuUnits().filter(e=>!e.includes("Project"));
    }

    const choices = [
        ...units,
        BACK
    ];

    inquirer
    .prompt([
        {
            name: "options",
            message,
            type: "list",
            choices
        }
    ])
    .then(({options})=>{
        console.clear();
        switch(options){
            case BACK:
                if(type==="unitToOpen"||type==="openAllUnits") githubPrompts();
                else cbPrompts();
                break;
            default:
                if(type==="unsolved"){
                    console.info(INFO_COLOR, `Adding unit ${options}...`);
                    fileManager.copyUnitUnsolved(options);
                    console.info(SUCCESS_COLOR, `Unit ${options} added. Make sure to select push to update gitlab.`);
                    cbPrompts();
                }
                else if(type==="solved"){
                    console.info(INFO_COLOR, `Adding all solved to unit ${options}...`);
                    promptForSelection(type,options,cbPrompts);
                }
                else if(type==="removeAllSolved"){
                    console.info(INFO_COLOR, `Removing all solved from unit ${options}...`);
                    promptForSelection(type,options,cbPrompts);
                }
                else if(type==="unitToOpen"){
                    fileManager.openAtPath(`${cm.insUnitsPath()}/${options}`);
                    cbPrompts();
                }
                else {
                    // Prompt for a selection
                    promptForSelection(type,options,cbPrompts);
                }
        }
        
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            selectUnitToAdd(type,cbPrompts);
        }
    });
}

module.exports = selectUnitToAdd;