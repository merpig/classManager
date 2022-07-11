const inquirer = require("inquirer");
const selectUnitToAdd = require("./selectUnitToAdd");
const selectUnitToRemove = require("./selectUnitToRemove");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const gitlabPrompts = (basePrompts) => {
    const choices = [
        "Pull",
        "Push",
        "Hard reset from origin",
        "Current Units",
        `Add next unit (${fileManager.nextUnit(cm.stuUnits())}) unsolved`,
        "Add unit unsolved",
        "Add all solved to unit",
        "Add selection of solved to unit",
        "Remove all solved from unit",
        "Remove selection of solved from unit",
        "Remove unit",
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
            case "Pull":
                fileManager.updateDirectory(cm.stuPath());
                gitlabPrompts();
                break;
            case "Push":
                console.info(INFO_COLOR, "Pushing changes to gitlab...");
                fileManager.pushChanges();
                console.info(SUCCESS_COLOR, "Changes pushed up to gitlab.");
                gitlabPrompts();
                break;
            case "Hard reset from origin":
                fileManager.hardUpdateDirectory(cm.stuPath());
                gitlabPrompts();
                break;
            case "Current Units":
                console.log(cm.stuUnits().filter(unit=>unit[0]!=="."&&unit[0]!=="R"));
                gitlabPrompts();
                break;
            case "Add unit unsolved":
                selectUnitToAdd("unsolved",gitlabPrompts);
                break;
            case "Add all solved to unit":
                // Make changes to this so it loops to add all so the whole unit isn't copied
                selectUnitToAdd("solved",gitlabPrompts);
                break;
            case "Add selection of solved to unit":
                selectUnitToAdd("selectionSolved",gitlabPrompts);
                break;
            case "Remove all solved from unit":
                selectUnitToAdd("removeAllSolved",gitlabPrompts);
                break;
            case "Remove selection of solved from unit":
                selectUnitToAdd("removeSelectionSolved",gitlabPrompts);
                break;
            case "Remove unit":
                selectUnitToRemove(gitlabPrompts);
                break;
            case BACK:
                basePrompts();
                break;
            case EXIT:
                console.log(INFO_COLOR, "Exiting Class Manager");
                break;
            default:
                const unit = options.split("(")[1].split(")")[0];
                if(unit === "none") console.info(WARNING_COLOR, "No more units left to add!");
                else {
                    console.info(INFO_COLOR, `Adding unit ${unit}...`);
                    fileManager.copyUnitUnsolved(unit);
                    console.info(SUCCESS_COLOR, `Unit ${unit} added! Make sure to select push to update gitlab.`);
                }
                gitlabPrompts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.info(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error);
            gitlabPrompts();
        }
    });
}

module.exports = gitlabPrompts;