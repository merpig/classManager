const inquirer = require("inquirer");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const promptForSelection = (type,unit,cbPrompts) => {

    if(type === "algorithmSolved"){
        fileManager.addAlgorithmsSolved(unit);
        console.info(SUCCESS_COLOR, `Unit ${unit} all solved algorithms added. Make sure to select push to update gitlab.`);
        cbPrompts();
        return;
    }

    // Filter activities by ones that don't have solved yet but have a solved in instructional unit
    // Generate activity list by if the insUnitActivities has a solved or main folder
    let activities = cm.stuUnitActivities(unit).filter((e,i)=>{
        const activityPath = cm.insUnitActivitiesPath(unit)+"/"+cm.insUnitActivities(unit)[i];
        return cm.pathDirs(activityPath).includes("Solved") ||
        cm.pathDirs(activityPath).includes("Main")
    });

    activities = activities.filter((activity,i)=>{
        const activityContents = cm.pathContents(`${cm.stuUnitActivitiesPath(unit)}/${activity}`);
        const includesSolved = activityContents.includes("Solved");
        const includesMain = activityContents.includes("Main");
        //console.log(e,includesSolved)
        if(activity.includes("Project")) {
            return ((type==="selectionSolved"||type==="solved")? !includesMain : includesMain);
        }
        else return ((type==="selectionSolved"||type==="solved")? !includesSolved : includesSolved);
    });
    
    if((type==="selectionSolved" || type==="solved") && !activities.length){
        console.info(WARNING_COLOR, "All solved already added.");
        cbPrompts();
        return;
    }
    else if((type==="removeSelectionSolved" || type ==="removeAllSolved") && !activities.length){
        console.info(WARNING_COLOR, "No solved to remove.");
        cbPrompts();
        return;
    }

    if(type==="solved"){
        fileManager.addSelectionSolved(activities[0],activities[activities.length-1],unit,cm.insUnitActivitiesPath(unit),activities);
        console.info(SUCCESS_COLOR, `Unit ${unit} all solved added. Make sure to select push to update gitlab.`);
        return cbPrompts();
    }
    else if(type==="removeAllSolved"){
        fileManager.removeSelectionSolved(activities[0],activities[activities.length-1],unit,activities);
        console.info(SUCCESS_COLOR, `All solved removed from unit ${unit}.`);
        return cbPrompts();
    }

    const messageStart = "Select start activity to " + (type==="selectionSolved"? "add solved to:":"remove solved from:");
    const messageEnd = "Select end activity to " + (type==="selectionSolved"?"add solved to:":"remove solved from:");

    const choices = [
        ...activities
    ];

    inquirer
    .prompt([
        {
            name: "start",
            message: messageStart,
            type: "list",
            choices
        },
        {
            name: "end",
            message: messageEnd,
            type: "list",
            choices
        }
    ])
    .then(({start,end})=>{
        console.clear();
        if(type==="selectionSolved"){
            console.info(INFO_COLOR, `Adding solved activites ${start} through ${end} to unit ${unit}...`);
            fileManager.addSelectionSolved(start,end,unit,cm.insUnitActivitiesPath(unit),activities);
            console.info(SUCCESS_COLOR, `Added solved activites ${start} through ${end} to unit ${unit}.`);
            cbPrompts();
        }
        else {
            console.info(INFO_COLOR, `Removing solved activites ${start} through ${end} from unit ${unit}...`);
            fileManager.removeSelectionSolved(start,end,unit,activities);
            console.info(SUCCESS_COLOR, `Removed solved activites ${start} through ${end} from unit ${unit}...`);
            cbPrompts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message)
            cbPrompts();
        }
    });
}

module.exports = promptForSelection;