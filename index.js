const inquirer = require("inquirer");
const { readdirSync, mkdirSync, existsSync } = require("fs");
const child_process = require("child_process");
const ChangeLog = require("./utils/changeLog.js");

// General TODOS:
// 1. Work on the changeLog messages
// 2. More graceful error handling than just spitting out the raw error
// 3. Filter selection of activities for adding and removing solved versions
// 4. Add additional functionality to github
//      - Open unit in vscode
//      - Open all units in vscode
//      - Open lesson plan in vscode
// 5. Add documentation
// 6. Add README content
const changeLog = new ChangeLog();

const GITHUB = "github";
const GITLAB = "gitlab";

let changesToPush = [];

const getSubDirs = (directory) => readdirSync(directory);

const parseClassName = str => {
    return str.split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" ")
}

const parseLinkRepo = str => str.split("/")[1].split(".")[0];

const cloneIntoDirectory = (directory,link) =>
    child_process.execSync(`cd ${directory} && git clone ${link}`);

const updateDirectory = (directory) =>{
    child_process.execSync(`cd ${directory} && git add -A && git commit -m "committed" && git pull`);
}

const hardUpdateDirectory = (directory,subDir) =>{
    child_process.execSync(`cd ${directory} && git fetch origin && git reset --hard origin/main && git clean -f -d`);
}

const nextUnit = arr => {

    let unitValue = arr
        .filter(unit=>unit[0]!=="."&&unit[0]!=="R")
        .map(unit=>parseInt(unit.split("-")))
        .pop();
    unitValue++;
    unitValue = unitValue.toString(); 
    unitValue = unitValue.length < 2 ? "0"+unitValue : unitValue;

    let dirInGithub = getSubDirs(GITHUB)[0];
    let githubDirs = getSubDirs(`${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`);
    let matchedDir = githubDirs.filter(unit=>unit.includes(unitValue));

    if(matchedDir.length){
        return matchedDir[0];
    }
    else return "none";
}

const copyUnitUnsolved = (unit,type) => {
    let dirInGithub = getSubDirs(GITHUB)[0];
    let dirInGitlab = getSubDirs(GITLAB)[0];

    let classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`;
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`;

    const rmSolved = `rm -rf 01-Activities/*/Solved 01-Activities/*/Main 02-Homework/Master 02-Homework/Main 02-Challenge/Main 03-Algorithms/*/Solved`;
    const addSandbox = `mkdir 05-Sandbox && cd 05-Sandbox && echo # Sandbox folder for activities and testing code > README.md`;
    if(type==="removeAllSolved"){
        child_process.execSync(`cp -r ${classContentPath}/${unit} ${gitlabContentPath} && cd ${gitlabContentPath}/${unit} && ${rmSolved}`);
        let filteredChanges = changeLog.getLog().filter(change=>!change.includes(`unit ${unit} solved added`));
        if(filteredChanges.length<changeLog.getLog().length){
            changeLog.updateLog(filteredChanges);
        }
        else changeLog.pushToLog(`unit ${unit} all solved removed`);
    }
    else {
        child_process.execSync(`cp -r ${classContentPath}/${unit} ${gitlabContentPath} && cd ${gitlabContentPath}/${unit} && ${rmSolved} && ${addSandbox}`);
        changeLog.pushToLog(`unit ${unit} added`);
    }
}

const copyUnitSolved = unit => {
    let dirInGithub = getSubDirs(GITHUB)[0];
    let dirInGitlab = getSubDirs(GITLAB)[0];

    let classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`

    let classActivities = getSubDirs(`${classContentPath}/${unit}`).filter(dir=>dir.includes("01"))[0];

    let copyFrom = `${classContentPath}/${unit}/${classActivities}`;
    let copyTo = `${gitlabContentPath}/${unit}/`;

    child_process.execSync(`cp -r ${copyFrom} ${copyTo}`);
    changeLog.pushToLog(`unit ${unit} solved added`);
}

const removeUnit = (dir,unit) => {
    const rmUnit = `cd ${dir} && rm -rf ${unit}`;
    child_process.execSync(rmUnit);
    const updateChanges = changeLog.getLog().filter(e=>!e.includes(`unit ${unit} added`));
    if(updateChanges.length === changeLog.getLog().length){
        changeLog.pushToLog(`removed unit ${unit}`);
    }
    else changeLog.updateLog(updateChanges);
}

const pushChanges = () => {
    let dirInGitlab = getSubDirs(GITLAB)[0];
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`;
    let commitMessage = `${changeLog.getLog().join(" and ")}`;

    if(commitMessage === "") commitMessage = "committing changes";

    child_process.execSync(`cd ${gitlabContentPath} && git add -A && git commit -m "${commitMessage}" && git push`);
    changeLog.updateLog([]);
}

const addSelectionSolved = (start,end,unit,activitiesPath,activities) => {
    let startIndex = activities.indexOf(start);
    let endIndex = activities.indexOf(end);

    let dirInGitlab = getSubDirs(GITLAB)[0];
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}/${unit}`;
    let gitlabUnitActivities = getSubDirs(gitlabContentPath).filter(dir=>dir.includes("01"))[0];
    let gitlabUnitActivitiesPath = `${gitlabContentPath}/${gitlabUnitActivities}`;

    for(let i = startIndex; i<=endIndex; startIndex<=endIndex ? i++ : i--){
        child_process.execSync(`cp -r ${activitiesPath}/${activities[i]} ${gitlabUnitActivitiesPath}`);
        //changeLog.pushToLog(`solved added for ${activities[i]}`);
    }
}

const removeSelectionSolved = (start,end,unit,activities) => {
    let startIndex = activities.indexOf(start);
    let endIndex = activities.indexOf(end);

    let dirInGitlab = getSubDirs(GITLAB)[0];
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}/${unit}`
    let gitlabUnitActivities = getSubDirs(gitlabContentPath).filter(dir=>dir.includes("01"))[0];
    let gitlabUnitActivitiesPath = `${gitlabContentPath}/${gitlabUnitActivities}`;

    
    for(let i = startIndex; i<=endIndex; startIndex<=endIndex? i++ : i--){
        child_process.execSync(`rm -rf ${gitlabUnitActivitiesPath}/${activities[i]}/Solved`);
        //let filteredChanges = changeLog.getLog().filter(change=>!change.includes(`solved added for ${activities[i]}`));
        //if(filteredChanges.length<changeLog.getLog().length){
            //changeLog.updateLog(filteredChanges);
        //}
        //else changeLog.pushToLog(`solved removed for ${activities[i]}`);
    }
    

}

// TODO: 
// 1. For selectionSolved only show activities that don't have a solved folder
// 2. For removeSelection only show activities that have a solved folder
const promptForSelection = (type,unit) => {
    let dirInGithub = getSubDirs(GITHUB)[0];

    let classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`;
    let unitPath = `${classContentPath}/${unit}`;

    let activitiesName = getSubDirs(unitPath).filter(activity=>activity[0]!=="."&&activity[0]!=="R").filter(dir=>dir.includes("01"))[0];
    let activitiesPath = `${unitPath}/${activitiesName}`;

    let activities = getSubDirs(activitiesPath).filter(activity=>activity[0]!=="."&&activity[0]!=="R"&&!activity.includes("Ins"));

    let messageStart = "Select start activity to " + type==="selectionSolved"? "add solved to:":"remove solved from:";
    let messageEnd = "Select end activity to " + type==="selectionSolved"?"add solved to:":"remove solved from:";

    inquirer
    .prompt([
        {
            name: "start",
            message: messageStart,
            type: "list",
            choices: [
                ...activities
            ]
        },
        {
            name: "end",
            message: messageEnd,
            type: "list",
            choices: [
                ...activities
            ]
        }
    ])
    .then(({start,end})=>{
        if(type==="selectionSolved"){
            console.info(`Adding solved activites ${start} through ${end} to unit ${unit}...`);
            addSelectionSolved(start,end,unit,activitiesPath,activities);
            console.info(`Added solved activites ${start} through ${end} to unit ${unit}.`);
            gitlabPromts();
        }
        else {
            console.info(`Removing solved activites ${start} through ${end} from unit ${unit}...`);
            removeSelectionSolved(start,end,unit,activities);
            console.info(`Removed solved activites ${start} through ${end} from unit ${unit}...`);
            gitlabPromts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
            gitlabPromts();
        }
    });
}

const selectUnitToAdd = (type) => {
    let dirInGitlab = getSubDirs(GITLAB)[0];
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`;
    let unitsInGitlab = getSubDirs(gitlabContentPath).filter(e=>e[0]!=="."&&e[0]!=="R");

    let dirInGithub = getSubDirs(GITHUB)[0];
    let classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`;
    let unitsInGithub = getSubDirs(classContentPath).filter(e=>e[0]!=="."&&e[0]!=="R");

    let units;
    let message;

    console.log(type);

    if(type === "unsolved") {
        message = "Select unit to add:";
        units = unitsInGithub.filter(unit=>!unitsInGitlab.includes(unit));
    }
    else {
        if(type==="solved") message = "Select unit to add all solved to:";
        else if(type==="selectionSolved") message = "Select unit to add selection of solved to:";
        else if(type==="removeAllSolved") message = "Select unit to remove all solved from:";
        else if(type==="removeSelectionSolved") message = "Select unit to remove selection of solved from:";
        units = unitsInGitlab;
    }

    inquirer
    .prompt([
        {
            name: "options",
            message,
            type: "list",
            choices: [
                ...units,
                "Back"
            ]
        }
    ])
    .then(({options})=>{
        
        switch(options){
            case "Back":
                gitlabPromts();
                break;
            default:
                if(type==="unsolved"){
                    console.info(`Adding unit ${options}...`);
                    copyUnitUnsolved(options);
                    console.info(`Unit ${options} added. Make sure to select push to update gitlab.`);
                    gitlabPromts();
                }
                else if(type==="solved"){
                    console.info(`Adding all solved to unit ${options}...`);
                    copyUnitSolved(options);
                    console.info(`Unit ${options} all solved added. Make sure to select push to update gitlab.`);
                    gitlabPromts();
                }
                else if(type==="removeAllSolved"){
                    console.info(`Removing all solved from unit ${options}...`);
                    copyUnitUnsolved(options,type);
                    console.info(`All solved removed from unit ${options}.`);
                    gitlabPromts();
                }
                else {
                    // Prompt for a selection
                    promptForSelection(type,options);
                }
        }
        
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
            gitlabPromts();
        }
    });
}

const selectUnitToRemove = () => {
    let dirInGitlab = getSubDirs(GITLAB)[0];
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`
    let unitsInGitlab = getSubDirs(gitlabContentPath).filter(e=>e[0]!=="."&&e[0]!=="R");

    inquirer
    .prompt([
        {
            name: "options",
            message: "Select unit to add:",
            type: "list",
            choices: [
                ...unitsInGitlab,
                "Back"
            ]
        }
    ])
    .then(({options})=>{
        switch(options){
            case "Back":
                break;
            default:
                console.info(`Removing unit ${options}...`);
                removeUnit(gitlabContentPath,options);
                console.info(`Unit ${options} removed!`);
        }
        gitlabPromts();
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
            gitlabPromts();
        }
    });
}

const promptForLink = async directory => 
    await inquirer
    .prompt([
        {
            type: "input",
            name: "link",
            message: `Enter the ${directory} ssh link to clone:`
        }
    ])
    .then(({link}) => {
        let baseLink = link.split("/")[0];
        if(directory === GITHUB && baseLink!=="git@github.com:coding-boot-camp"){
            console.info("Invalid link, please clone from a coding bootcamp repository.");
            promptForLink(directory);
        }
        else {
            try {
            console.log(`Cloning ${parseLinkRepo(link)} into ${directory}, this may take a few minutes.`);
            cloneIntoDirectory(directory,link);
            console.log(`The ${directory} directory is set up!`)
            }catch(error){
                console.log(error)
            }
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
            promptForLink(directory)
        }
    });

const advancedPrompts = () =>
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select an option:",
            type: "list",
            choices: [
                "Reset Class Manager",
                "Back",
                "Exit"
            ]
        }
    ]).then(({options})=>{
        switch(options){
            case "Reset Class Manager":
                child_process.execSync(`rm -rf github gitlab`);
                console.log("Exiting Class Manager");
                break;
            case "Back":
                basePromts();
                break;
            default:
                console.log("Exiting Class Manager");
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
        }
    });

const githubPromts = () => 
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select an option:",
            type: "list",
            choices: [
                // "Select unit to open",
                // "Open all units",
                // "Select lesson plan to open"
                "Update",
                "Back",
                "Exit"
            ]
        }
    ]).then(({options})=>{
        switch(options){
            case "Update":
                console.info(`Updating ${getSubDirs(GITHUB)[0]}...`)
                hardUpdateDirectory(GITHUB + "/" + getSubDirs(GITHUB)[0]);
                console.info(`Updated!`);
                githubPromts();
                break;
            case "Back":
                basePromts();
                break;
            default:
                console.log("Exiting Class Manager");
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
        }
    });

const gitlabPromts = () => 
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select an option:",
            type: "list",
            choices: [
                "Pull",
                "Push",
                "Hard reset from origin",
                "Current Units",
                `Add next unit (${nextUnit(getSubDirs(`${GITLAB}/${getSubDirs(GITLAB)[0]}`))}) unsolved`,
                "Add unit unsolved",
                "Add all solved to unit",
                "Add selection of solved to unit",
                "Remove all solved from unit",
                "Remove selection of solved from unit",
                "Remove unit",
                "Back",
                "Exit"
            ]
        }
    ]).then(({options})=>{
        const repo = `${GITLAB}/${getSubDirs(GITLAB)[0]}`
        switch(options){
            case "Pull":
                updateDirectory(repo);
                gitlabPromts();
                break;
            case "Push":
                //if(changeLog.getLog().length) {
                console.info("Pushing changes to gitlab...");
                pushChanges();
                console.info("Changes pushed up to gitlab.");
                //}
                //else console.info("No changes to push");
                gitlabPromts();
                break;
            case "Hard reset from origin":
                hardUpdateDirectory(repo);
                gitlabPromts();
                break;
            case "Current Units":
                console.log(getSubDirs(repo).filter(unit=>unit[0]!=="."&&unit[0]!=="R"));
                gitlabPromts();
                break;
            case "Add unit unsolved":
                selectUnitToAdd("unsolved");
                break;
            case "Add all solved to unit":
                selectUnitToAdd("solved");
                break;
            case "Add selection of solved to unit":
                selectUnitToAdd("selectionSolved");
                break;
            case "Remove all solved from unit":
                selectUnitToAdd("removeAllSolved");
                break;
            case "Remove selection of solved from unit":
                selectUnitToAdd("removeSelectionSolved");
                break;
            case "Remove unit":
                selectUnitToRemove();
                break;
            case "Back":
                basePromts();
                break;
            case "Exit":
                console.log("Exiting Class Manager");
                break;
            default:
                let unit = options.split("(")[1].split(")")[0];
                if(unit === "none") console.info("No more units left to add!");
                else {
                    console.info(`Adding unit ${unit}...`);
                    copyUnitUnsolved(unit);
                    console.info(`Unit ${unit} added! Make sure to select push to update gitlab.`);
                }
                gitlabPromts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error);
            gitlabPromts();
        }
    });

const basePromts = () =>
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select an option:",
            type: "list",
            choices: [
                "Manage github",
                "Manage gitlab",
                "Advanced Options",
                "Exit"
            ]
        }
    ]).then(async ({options})=>{
        switch(options){
            case "Manage github":
                if(!existsSync(GITHUB)) {
                    console.log("Initializing github folder...");
                    mkdirSync(GITHUB);
                    await promptForLink(GITHUB);
                    basePromts();
                }
                else if(!getSubDirs(GITHUB).length){
                    console.log("Initializing github folder...");
                    await promptForLink(GITHUB);
                    basePromts();
                }
                else githubPromts();
                break;
            case "Manage gitlab":
                gitlabPromts();
                break;
            case "Advanced Options":
                advancedPrompts();
                break;
            default:
                console.log("Exiting Class Manager");
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
        }
    });

const init = async () => {
    console.info("Welcome to Class Manager!");
    if(existsSync(GITHUB) && getSubDirs(GITHUB).length){
        console.info(`Current class: ${parseClassName(getSubDirs(GITHUB)[0])}`);
    }

    // Create the directory for github instructional material
    if(!existsSync(GITHUB)) {
        console.info("Initializing github folder...");
        console.linfo("Make sure the ssh key has been added to github and access has been granted.")
        mkdirSync(GITHUB);
        await promptForLink(GITHUB);
    }

    if(existsSync(GITHUB) && !getSubDirs(GITHUB).length){
        console.info("Initializing github folder...");
        console.linfo("Make sure the ssh key has been added to github and access has been granted.")
        await promptForLink(GITHUB);
    }

    // Create the directory for gitlab class material
    if(!existsSync(GITLAB)) {
        console.info("Initializing gitlab folder...");
        console.linfo("Make sure the ssh key has been added to gitlab and access has been granted.")
        mkdirSync(GITLAB);
        await promptForLink(GITLAB);
    }

    if(existsSync(GITLAB) && !getSubDirs(GITLAB).length){
        console.info("Initializing gitlab folder...");
        console.linfo("Make sure the ssh key has been added to gitlab and access has been granted.")
        await promptForLink(GITLAB);
    }

    basePromts();
}

init();