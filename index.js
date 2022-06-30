const inquirer = require("inquirer");
const { readdirSync, mkdirSync, existsSync, lstatSync } = require("fs");
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

const ERROR_COLOR = "\x1b[31m%s\x1b[0m";
const WARNING_COLOR = "\x1b[33m%s\x1b[0m";
const SUCCESS_COLOR = "\x1b[32m%s\x1b[0m";
const INFO_COLOR = "\x1b[34m%s\x1b[0m";

let changesToPush = [];

const getSubDirs = (directory) => readdirSync(directory);

const parseClassName = str => {
    return str.split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" ")
}

const parseLinkRepo = str => str.split("/")[1].split(".")[0];

const cloneIntoDirectory = (directory,link) =>
    child_process.execSync(`cd ${directory} && git clone ${link}`);

const updateDirectory = (directory) =>{
    child_process.execSync(`cd ${directory} && git pull`);
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

    const dirInGithub = getSubDirs(GITHUB)[0];
    const githubDirs = getSubDirs(`${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`);
    const matchedDir = githubDirs.filter(unit=>unit.includes(unitValue));

    if(matchedDir.length){
        return matchedDir[0];
    }
    else return "none";
}

const copyUnitUnsolved = (unit,type) => {
    const dirInGithub = getSubDirs(GITHUB)[0];
    const dirInGitlab = getSubDirs(GITLAB)[0];

    const classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`;
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}`;

    const rmSolved = `rm -rf 01-Activities/*/Solved 01-Activities/*/Main 02-Homework/Master 02-Homework/Main 02-Challenge/Main 03-Algorithms/*/Solved`;
    const addSandbox = `mkdir 05-Sandbox && cd 05-Sandbox && echo # Sandbox folder for activities and testing code > README.md`;
    if(type==="removeAllSolved"){
        child_process.execSync(`cp -r ${classContentPath}/${unit} ${gitlabContentPath} && cd ${gitlabContentPath}/${unit} && ${rmSolved}`);
        const filteredChanges = changeLog.getLog().filter(change=>!change.includes(`unit ${unit} solved added`));
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

const removeUnit = (dir,unit) => {
    const rmUnit = `cd ${dir} && rm -rf ${unit}`;
    child_process.execSync(rmUnit);
    const updateChanges = changeLog.getLog().filter(e=>!e.includes(`unit ${unit} added`));
    if(updateChanges.length === changeLog.getLog().length){
        changeLog.pushToLog(`removed unit ${unit}`);
    }
    else changeLog.updateLog(updateChanges);
}

const openAtPath = (path) => {
    console.info(INFO_COLOR, `Opening ${path}...`);
    child_process.execSync(`code ${path}`);
    console.info(SUCCESS_COLOR, `${path} opened.`);
}

const pushChanges = () => {
    const dirInGitlab = getSubDirs(GITLAB)[0];
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}`;
    let commitMessage = `${changeLog.getLog().join(" and ")}`;

    if(commitMessage === "") commitMessage = "committing changes";

    child_process.execSync(`cd ${gitlabContentPath} && git add -A && git commit -m "${commitMessage}" && git push`);
    changeLog.updateLog([]);
}

const addSelectionSolved = (start,end,unit,activitiesPath,activities) => {
    const startIndex = activities.indexOf(start);
    const endIndex = activities.indexOf(end);

    const dirInGitlab = getSubDirs(GITLAB)[0];
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}/${unit}`;
    const gitlabUnitActivities = getSubDirs(gitlabContentPath).filter(dir=>dir.includes("01"))[0];
    const gitlabUnitActivitiesPath = `${gitlabContentPath}/${gitlabUnitActivities}`;

    for(let i = startIndex; i<=endIndex; startIndex<=endIndex ? i++ : i--){
        const activity = activities[i];
        const extension = (activity.includes("Project")?"Main":"Solved");
        child_process.execSync(`cp -r ${activitiesPath}/${activities[i]}/${extension} ${gitlabUnitActivitiesPath}/${activity}`);
        //changeLog.pushToLog(`solved added for ${activities[i]}`);
    }
}

const removeSelectionSolved = (start,end,unit,activities) => {
    const startIndex = activities.indexOf(start);
    const endIndex = activities.indexOf(end);

    const dirInGitlab = getSubDirs(GITLAB)[0];
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}/${unit}`
    const gitlabUnitActivities = getSubDirs(gitlabContentPath).filter(dir=>dir.includes("01"))[0];
    const gitlabUnitActivitiesPath = `${gitlabContentPath}/${gitlabUnitActivities}`;

    for(let i = startIndex; i<=endIndex; startIndex<=endIndex? i++ : i--){
        const activity = activities[i];
        const extension = activity.includes("Project")?"Main":"Solved";
        child_process.execSync(`rm -rf ${gitlabUnitActivitiesPath}/${activity}/${extension}`);
        //let filteredChanges = changeLog.getLog().filter(change=>!change.includes(`solved added for ${activities[i]}`));
        //if(filteredChanges.length<changeLog.getLog().length){
            //changeLog.updateLog(filteredChanges);
        //}
        //else changeLog.pushToLog(`solved removed for ${activities[i]}`);
    }
}

const promptForSelection = (type,unit) => {
    const dirInGithub = getSubDirs(GITHUB)[0];

    const classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`;
    const unitPath = `${classContentPath}/${unit}`;

    const activitiesName = getSubDirs(unitPath).filter(activity=>activity[0]!=="."&&activity[0]!=="R").filter(dir=>dir.includes("01"))[0];
    const activitiesPath = `${unitPath}/${activitiesName}`;

    const dirInGitlab = getSubDirs(GITLAB)[0];
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}/${unit}`;
    const gitlabUnitActivitiesDir = getSubDirs(gitlabContentPath).filter(dir=>dir.includes("01"))[0];
    const gitlabUnitActivitiesPath = `${gitlabContentPath}/${gitlabUnitActivitiesDir}`;
    let activities = getSubDirs(gitlabUnitActivitiesPath).filter(e=>e[0]!=="."&&e[0]!=="R"&&e.includes("Stu"));

    activities = activities.filter((e,i)=>{
        const gitlabUnitActivity = e;
        const gitlabUnitActivityContents = getSubDirs(`${gitlabUnitActivitiesPath}/${gitlabUnitActivity}`);
        const includesSolved = gitlabUnitActivityContents.includes("Solved");
        const includesMain = gitlabUnitActivityContents.includes("Main");
        //console.log(e,includesSolved)
        if(gitlabUnitActivity.includes("Project")) {
            return ((type==="selectionSolved"||type==="solved")? !includesMain : includesMain);
        }
        else return ((type==="selectionSolved"||type==="solved")? !includesSolved : includesSolved);
    });
    
    if((type==="selectionSolved" || type==="solved") && !activities.length){
        console.info(WARNING_COLOR, "All solved already added.");
        gitlabPromts();
        return;
    }
    else if((type==="removeSelectionSolved" || type ==="removeAllSolved") && !activities.length){
        console.info(WARNING_COLOR, "No solved to remove.");
        gitlabPromts();
        return;
    }

    if(type==="solved"){
        addSelectionSolved(activities[0],activities[activities.length-1],unit,activitiesPath,activities);
        console.info(SUCCESS_COLOR, `Unit ${unit} all solved added. Make sure to select push to update gitlab.`);
        return gitlabPromts();
    }
    else if(type==="removeAllSolved"){
        removeSelectionSolved(activities[0],activities[activities.length-1],unit,activities);
        console.info(SUCCESS_COLOR, `All solved removed from unit ${unit}.`);
        return gitlabPromts();
    }

    const messageStart = "Select start activity to " + (type==="selectionSolved"? "add solved to:":"remove solved from:");
    const messageEnd = "Select end activity to " + (type==="selectionSolved"?"add solved to:":"remove solved from:");

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
            console.info(INFO_COLOR, `Adding solved activites ${start} through ${end} to unit ${unit}...`);
            addSelectionSolved(start,end,unit,activitiesPath,activities);
            console.info(SUCCESS_COLOR, `Added solved activites ${start} through ${end} to unit ${unit}.`);
            gitlabPromts();
        }
        else {
            console.info(INFO_COLOR, `Removing solved activites ${start} through ${end} from unit ${unit}...`);
            removeSelectionSolved(start,end,unit,activities);
            console.info(SUCCESS_COLOR, `Removed solved activites ${start} through ${end} from unit ${unit}...`);
            gitlabPromts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message)
            gitlabPromts();
        }
    });
}

const selectUnitToAdd = (type) => {
    const dirInGitlab = getSubDirs(GITLAB)[0];
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}`;
    const unitsInGitlab = getSubDirs(gitlabContentPath).filter(e=>e[0]!=="."&&e[0]!=="R");

    const dirInGithub = getSubDirs(GITHUB)[0];
    const classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`;
    const unitsInGithub = getSubDirs(classContentPath).filter(e=>e[0]!=="."&&e[0]!=="R");

    let units;
    let message;

    if(type === "unsolved") {
        message = "Select unit to add:";
        units = unitsInGithub.filter(unit=>!unitsInGitlab.includes(unit));
    }
    else {
        if(type==="solved") message = "Select unit to add all solved to:";
        else if(type==="selectionSolved") message = "Select unit to add selection of solved to:";
        else if(type==="removeAllSolved") message = "Select unit to remove all solved from:";
        else if(type==="removeSelectionSolved") message = "Select unit to remove selection of solved from:";
        else if(type==="unitToOpen") message = "Select unit to open:";
        else if(type==="openAllUnits"){
            openAtPath(classContentPath);
            return githubPromts();
        }
        if(type==="unitToOpen") units = unitsInGitlab;
        else units = unitsInGitlab.filter(e=>!e.includes("Project"));
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
                if(type==="unitToOpen"||type==="openAllUnits") githubPromts();
                else gitlabPromts();
                break;
            default:
                if(type==="unsolved"){
                    console.info(INFO_COLOR, `Adding unit ${options}...`);
                    copyUnitUnsolved(options);
                    console.info(SUCCESS_COLOR, `Unit ${options} added. Make sure to select push to update gitlab.`);
                    gitlabPromts();
                }
                else if(type==="solved"){
                    console.info(INFO_COLOR, `Adding all solved to unit ${options}...`);
                    promptForSelection(type,options);
                }
                else if(type==="removeAllSolved"){
                    console.info(INFO_COLOR, `Removing all solved from unit ${options}...`);
                    promptForSelection(type,options);
                }
                else if(type==="unitToOpen"){
                    openAtPath(`${classContentPath}/${options}`);
                    githubPromts();
                }
                else {
                    // Prompt for a selection
                    promptForSelection(type,options);
                }
        }
        
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            gitlabPromts();
        }
    });
}

const selectUnitToRemove = () => {
    const dirInGitlab = getSubDirs(GITLAB)[0];
    const gitlabContentPath = `${GITLAB}/${dirInGitlab}`
    const unitsInGitlab = getSubDirs(gitlabContentPath).filter(e=>e[0]!=="."&&e[0]!=="R");

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
                console.info(INFO_COLOR, `Removing unit ${options}...`);
                removeUnit(gitlabContentPath,options);
                console.info(SUCCESS_COLOR, `Unit ${options} removed.`);
        }
        gitlabPromts();
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            gitlabPromts();
        }
    });
}

const selectLessonPlan = (path) => {
    const dirs = getSubDirs(path).filter(dir=>dir[0]!=="."&&dir[0]!=="R");

    inquirer
    .prompt([
        {
            name: "options",
            message: "Select a directory",
            type: "list",
            choices: [
                "Open in vscode",
                ...dirs,
                "Back",
                "Return to github prompts",
                "Exit"
            ]
        }
    ])
    .then(({options})=>{
        switch(options){
            case "Open in vscode":
                openAtPath(path);
                githubPromts();
                break;
            case "Back":
                if(dirs.includes("Full-Time")) githubPromts();
                else {
                    const newPath = path.split("/");
                    newPath.pop();
                    selectLessonPlan(newPath.join("/"))
                }
                break;
            case "Return to github prompts":
                githubPromts();
                break;
            case "Exit":
                break;
            default:
                const newPath = `${path}/${options}`;
                if(!lstatSync(newPath).isFile()) {
                    selectLessonPlan(newPath);
                }
                else {
                    openAtPath(newPath);
                    githubPromts();
                }
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            promptForLink(directory);
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
        const baseLink = link.split("/")[0];
        if(directory === GITHUB && baseLink!=="git@github.com:coding-boot-camp"){
            console.info(ERROR_COLOR, "Invalid link, please clone from a coding bootcamp repository.");
            promptForLink(directory);
        }
        else {
            try {
            console.log(INFO_COLOR, `Cloning ${parseLinkRepo(link)} into ${directory}, this may take a few minutes.`);
            cloneIntoDirectory(directory,link);
            console.log(SUCCESS_COLOR, `The ${directory} directory is set up!`)
            }catch(error){
                console.log(ERROR_COLOR, error.message);
            }
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            promptForLink(directory);
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
                console.log(INFO_COLOR, "Exiting Class Manager");
                break;
            case "Back":
                basePromts();
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

const githubPromts = () => 
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select an option:",
            type: "list",
            choices: [
                "Select unit to open",
                "Open all units",
                "Select lesson plan to open",
                "Update",
                "Back",
                "Exit"
            ]
        }
    ]).then(({options})=>{
        switch(options){
            case "Select unit to open":
                selectUnitToAdd("unitToOpen");
                break;
            case "Open all units":
                selectUnitToAdd("openAllUnits");
                break;
            case "Select lesson plan to open":
                const dirInGithub = getSubDirs(GITHUB)[0];
                const lessonPlanPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("02"))[0]}`;
                selectLessonPlan(lessonPlanPath);
                break;
            case "Update":
                console.info(INFO_COLOR, `Updating ${getSubDirs(GITHUB)[0]}...`)
                hardUpdateDirectory(GITHUB + "/" + getSubDirs(GITHUB)[0]);
                console.info(SUCCESS_COLOR, `Updated!`);
                githubPromts();
                break;
            case "Back":
                basePromts();
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
                console.info(INFO_COLOR, "Pushing changes to gitlab...");
                pushChanges();
                console.info(SUCCESS_COLOR, "Changes pushed up to gitlab.");
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
                // Make changes to this so it loops to add all so the whole unit isn't copied
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
                console.log(INFO_COLOR, "Exiting Class Manager");
                break;
            default:
                const unit = options.split("(")[1].split(")")[0];
                if(unit === "none") console.info(WARNING_COLOR, "No more units left to add!");
                else {
                    console.info(INFO_COLOR, `Adding unit ${unit}...`);
                    copyUnitUnsolved(unit);
                    console.info(SUCCESS_COLOR, `Unit ${unit} added! Make sure to select push to update gitlab.`);
                }
                gitlabPromts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.info(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
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
                    console.log(INFO_COLOR, "Initializing github folder...");
                    mkdirSync(GITHUB);
                    await promptForLink(GITHUB);
                    basePromts();
                }
                else if(!getSubDirs(GITHUB).length){
                    console.log(INFO_COLOR, "Initializing github folder...");
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