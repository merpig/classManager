const inquirer = require("inquirer");
const promptForSelection = require("./promptForSelection");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const selectUnitToAdd = (type,cbPrompts,basePrompts) => {
    let units;
    let message;

    if(type === "unsolved") {
        message = "Select unit to add:";
        units = cm.insUnits().filter(unit=>!cm.stuUnits().includes(unit));
    }
    else if(type === "solved") {
        message = "Select unit to add all solved to:";
        const stuUnits = cm.stuUnits();

        // Filters out student units that have all solved already
        units = stuUnits.filter(stuUnit=>{
            if(stuUnit.includes("Project")) return false;

            const insPath = cm.insUnitActivitiesPath(stuUnit);
            const stuPath = cm.stuUnitActivitiesPath(stuUnit);

            let activities = cm.stuUnitActivities(stuUnit).filter((e,i)=>{
                const insActivityPath = insPath + "/" + cm.insUnitActivities(stuUnit)[i];
                const activityPath = stuPath + "/" + cm.stuUnitActivities(stuUnit)[i];
                return (!cm.pathDirs(activityPath).includes("Solved") &&
                !cm.pathDirs(activityPath).includes("Main"))
                && activityPath.includes("Stu") 
                && (cm.pathDirs(insActivityPath).includes("Solved")
                || cm.pathDirs(insActivityPath).includes("Main"))
            });
            return activities.length;
        });

        if(!units.length){
            console.info(WARNING_COLOR, "All units already have all solved added.");
            cbPrompts(basePrompts);
            return;
        }
    }
    else if(type === "algorithmSolved"){
        message = "Select unit to add all algorithm solved to:";
        const stuUnits = cm.stuUnits();
        let algoExists = false;
        units = stuUnits.filter(stuUnit=>{
            const stuUnitPath = cm.stuUnitPath(stuUnit);
            const dirs = cm.pathDirs(stuUnitPath);
            
            if(!dirs.includes("03-Algorithms")) return false;
            
            const algosPath = stuUnitPath + "/03-Algorithms";
            const algosDirs = cm.pathDirs(algosPath);
            algoExists = true;

            let unsolvedAlgos = algosDirs.filter(algo=>{
                const algoPath = algosPath + "/" + algo;
                const algoDirs = cm.pathDirs(algoPath);
                return !algoDirs.includes("Solved");
            });

            return unsolvedAlgos.length;
        })
        if(!algoExists){
            console.info(WARNING_COLOR, "No current units with algo folder.");
            cbPrompts(basePrompts);
            return;
        }
        else if(!units.length){
            console.info(WARNING_COLOR, "All units already have all algorithm solved added.");
            cbPrompts(basePrompts);
            return;
        }
    }
    else {
        if(type==="selectionSolved") message = "Select unit to add selection of solved to:";
        else if(type==="removeAllSolved") message = "Select unit to remove all solved from:";
        else if(type==="removeSelectionSolved") message = "Select unit to remove selection of solved from:";
        else if(type==="unitToOpen") message = "Select unit to open:";
        else if(type==="openAllUnits"){
            fileManager.openAtPath(cm.insUnitsPath());
            return cbPrompts(basePrompts);
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
                if(type==="unitToOpen"||type==="openAllUnits") cbPrompts(basePrompts);
                else cbPrompts(basePrompts);
                break;
            default:
                if(type==="unsolved"){
                    console.info(INFO_COLOR, `Adding unit ${options}...`);
                    fileManager.copyUnitUnsolved(options);
                    console.info(SUCCESS_COLOR, `Unit ${options} added. Make sure to select push to update gitlab.`);
                    cbPrompts(basePrompts);
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
                    cbPrompts(basePrompts);
                }
                else if(type==="algorithmSolved"){
                    console.info(INFO_COLOR, `Adding all solved algorithms to unit ${options}...`);
                    promptForSelection(type,options,cbPrompts);
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