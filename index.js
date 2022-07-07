const inquirer = require("inquirer");
const { readdirSync, mkdirSync, existsSync, lstatSync, readFileSync, writeFileSync } = require("fs");
const child_process = require("child_process");
const ChangeLog = require("./utils/changeLog.js");
const cm = require("./utils/cm")
const changeLog = new ChangeLog();

const GITHUB = "instructor";
const GITLAB = "student";

const EXIT = "\033[91mExit\x1b[0m";
const BACK = "\033[33mBack\x1b[0m";

const ERROR_COLOR = "\x1b[31m%s\x1b[0m";
const WARNING_COLOR = "\x1b[33m%s\x1b[0m";
const SUCCESS_COLOR = "\x1b[32m%s\x1b[0m";
const INFO_COLOR = "\x1b[34m%s\x1b[0m";

const getSubDirs = (directory) => readdirSync(directory);

const parseClassName = str => {
    return str.split("/").pop().split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" ")
}

const parseLinkRepo = str => str.split("/")[1].split(".")[0];

const cloneIntoDirectory = (directory,link) =>
    child_process.execSync(`cd ${directory.replace(" ","\\ ")} && git clone ${link}`);

const updateDirectory = (directory) =>{
    child_process.execSync(`cd ${directory.replace(" ","\\ ")} && git pull`);
}

const hardUpdateDirectory = (directory) =>{
    child_process.execSync(`cd ${directory.replace(" ","\\ ")} && git fetch origin && git reset --hard origin/main && git clean -f -d`);
}

const nextUnit = arr => {

    let unitValue = arr
        .filter(unit=>unit[0]!=="."&&unit[0]!=="R")
        .map(unit=>parseInt(unit.split("-")))
        .pop();
    unitValue++;
    unitValue = unitValue.toString(); 
    unitValue = unitValue.length < 2 ? "0"+unitValue : unitValue;

    // const dirInGithub = getSubDirs(GITHUB)[0];
    // const githubDirs = getSubDirs(`${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`);
    const matchedDir = cm.insUnits().filter(unit=>unit.includes(unitValue));

    if(matchedDir.length){
        return matchedDir[0];
    }
    else return "none";
}

const copyUnitUnsolved = (unit,type) => {
    const rmSolved = `rm -rf 01-Activities/*/Solved 01-Activities/*/Main 02-Homework/Master 02-Homework/Main 02-Challenge/Main 03-Algorithms/*/Solved`;
    const addSandbox = `mkdir 05-Sandbox && cd 05-Sandbox && echo # Sandbox folder for activities and testing code > README.md`;

    child_process.execSync(`cp -r ${cm.insUnitsPath()}/${unit} ${cm.stuPath()} && cd ${cm.stuPath().replace(" ","\\ ")}/${unit} && ${rmSolved} && ${addSandbox}`);
    changeLog.pushToLog(`unit ${unit} added`);
}

const removeUnit = unit => {
    const rmUnit = `rm -rf ${unit}`;
    child_process.execSync(rmUnit);
    const updateChanges = changeLog.getLog().filter(e=>!e.includes(`unit ${unit} added`));
    if(updateChanges.length === changeLog.getLog().length){
        changeLog.pushToLog(`removed unit ${unit}`);
    }
    else changeLog.updateLog(updateChanges);
}

const openAtPath = (path) => {
    console.info(INFO_COLOR, `Opening ${path}...`);
    child_process.execSync(`code ${path.replace(" ","\\ ")}`);
    console.info(SUCCESS_COLOR, `${path} opened.`);
}

const pushChanges = () => {
    let commitMessage = `${changeLog.getLog().join(" and ")}`;

    if(commitMessage === "") commitMessage = "committing changes";

    child_process.execSync(`cd ${cm.stuPath().replace(" ","\\ ")} && git add -A && git commit -m "${commitMessage}" && git push`);
    changeLog.updateLog([]);
}

const addSelectionSolved = (start,end,unit,activitiesPath,activities) => {
    const startIndex = activities.indexOf(start);
    const endIndex = activities.indexOf(end);

    // const dirInGitlab = getSubDirs(GITLAB)[0];
    // const gitlabContentPath = `${GITLAB}/${dirInGitlab}/${unit}`;
    // const gitlabUnitActivities = getSubDirs(gitlabContentPath).filter(dir=>dir.includes("01"))[0];
    const gitlabUnitActivitiesPath = cm.stuUnitActivitiesPath(unit);

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

    for(let i = startIndex; i<=endIndex; startIndex<=endIndex? i++ : i--){
        const activity = activities[i];
        const extension = activity.includes("Project")?"Main":"Solved";
        child_process.execSync(`rm -rf ${cm.stuUnitActivitiesPath(unit)}/${activity}/${extension}`);
        //let filteredChanges = changeLog.getLog().filter(change=>!change.includes(`solved added for ${activities[i]}`));
        //if(filteredChanges.length<changeLog.getLog().length){
            //changeLog.updateLog(filteredChanges);
        //}
        //else changeLog.pushToLog(`solved removed for ${activities[i]}`);
    }
}

const promptForSelection = (type,unit) => {

    let activities = cm.stuUnitActivities(unit).filter(e=>e.includes("Stu"));

    activities = activities.filter((activity,i)=>{
        const activityContents = getSubDirs(`${cm.stuUnitActivitiesPath(unit)}/${activity}`);
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
        gitlabPromts();
        return;
    }
    else if((type==="removeSelectionSolved" || type ==="removeAllSolved") && !activities.length){
        console.info(WARNING_COLOR, "No solved to remove.");
        gitlabPromts();
        return;
    }

    if(type==="solved"){
        addSelectionSolved(activities[0],activities[activities.length-1],unit,cm.insUnitActivitiesPath(unit),activities);
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
            addSelectionSolved(start,end,unit,cm.insUnitActivitiesPath(unit),activities);
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
            openAtPath(cm.insUnitsPath());
            return githubPromts();
        }
        if(type==="unitToOpen") units = cm.stuUnits();
        else units = cm.stuUnits().filter(e=>!e.includes("Project"));
    }

    inquirer
    .prompt([
        {
            name: "options",
            message,
            type: "list",
            choices: [
                ...units,
                BACK
            ]
        }
    ])
    .then(({options})=>{
        
        switch(options){
            case BACK:
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
                    openAtPath(`${cm.insUnitsPath()}/${options}`);
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
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select unit to remove:",
            type: "list",
            choices: [
                ...cm.stuUnits(),
                BACK
            ]
        }
    ])
    .then(({options})=>{
        switch(options){
            case BACK:
                break;
            default:
                console.info(INFO_COLOR, `Removing unit ${options}...`);
                console.log(cm.stuUnitPath(options))
                removeUnit(cm.stuUnitPath(options));
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
    const dirs = cm.pathContents(path);

    inquirer
    .prompt([
        {
            name: "options",
            message: "Select a directory",
            type: "list",
            choices: [
                "Open in vscode",
                ...dirs,
                BACK,
                "Return to github prompts",
                EXIT
            ]
        }
    ])
    .then(({options})=>{
        switch(options){
            case "Open in vscode":
                openAtPath(path);
                githubPromts();
                break;
            case BACK:
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
            case EXIT:
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

const updateBasePaths = (path,type) => {
    try{
        let data = JSON.parse(readFileSync("basePaths.json"));
        data[type] = path;
        writeFileSync("basePaths.json", JSON.stringify(data,null,2), function writeJSON(err) {
            if (err) return console.log(err);
            //console.log('writing to ' + "./utils/changeLog.json");
        });
    }catch(e){
        let data = {};
        data[type] = path;
        writeFileSync("basePaths.json", JSON.stringify(data,null,2), function writeJSON(err) {
            if (err) return console.log(err);
            //console.log('writing to ' + "./utils/changeLog.json");
        });
    }
}

const promptForLink = async (directory,type) => 
    await inquirer
    .prompt([
        {
            type: "input",
            name: "link",
            message: `Enter the ${type} content ssh link to clone:`
        }
    ])
    .then(({link}) => {
        const baseLink = link.split("/")[0];
        if(type === 'instructor' && baseLink!=="git@github.com:coding-boot-camp"){
            console.info(ERROR_COLOR, "Invalid link, please clone from a coding bootcamp repository.");
            promptForLink(directory,type);
        }
        else {
            try {
                console.log(INFO_COLOR, `Cloning ${parseLinkRepo(link)} into ${directory}, this may take a few minutes.`);
                cloneIntoDirectory(directory,link);
                console.log(SUCCESS_COLOR, `The ${directory} directory is set up!`);
                updateBasePaths(directory+'/'+parseLinkRepo(link),type);
            }catch(error){
                console.log(ERROR_COLOR, error.message);
            }
            //basePromts();
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
                BACK,
                EXIT
            ]
        }
    ]).then(({options})=>{
        switch(options){
            case "Reset Class Manager":
                child_process.execSync(`rm -rf github gitlab`);
                console.log(INFO_COLOR, "Exiting Class Manager");
                break;
            case BACK:
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
                BACK,
                EXIT
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
                selectLessonPlan(cm.insLessonPlansPath());
                break;
            case "Update":
                console.info(INFO_COLOR, `Updating ${parseClassName(cm.insPath())}...`)
                hardUpdateDirectory(cm.insPath());
                console.info(SUCCESS_COLOR, `Updated!`);
                githubPromts();
                break;
            case BACK:
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
                `Add next unit (${nextUnit(cm.stuUnits())}) unsolved`,
                "Add unit unsolved",
                "Add all solved to unit",
                "Add selection of solved to unit",
                "Remove all solved from unit",
                "Remove selection of solved from unit",
                "Remove unit",
                BACK,
                EXIT
            ]
        }
    ]).then(({options})=>{
        switch(options){
            case "Pull":
                updateDirectory(cm.stuPath());
                gitlabPromts();
                break;
            case "Push":
                console.info(INFO_COLOR, "Pushing changes to gitlab...");
                pushChanges();
                console.info(SUCCESS_COLOR, "Changes pushed up to gitlab.");
                gitlabPromts();
                break;
            case "Hard reset from origin":
                hardUpdateDirectory(cm.stuPath());
                gitlabPromts();
                break;
            case "Current Units":
                console.log(cm.stuUnits().filter(unit=>unit[0]!=="."&&unit[0]!=="R"));
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
            case BACK:
                basePromts();
                break;
            case EXIT:
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
                `Manage ${cm.insPath().split("/").pop()}`,
                `Manage ${cm.stuPath().split("/").pop()}`,
                "Advanced Options",
                EXIT
            ]
        }
    ]).then(async ({options})=>{
        switch(options){
            case `Manage ${cm.insPath().split("/").pop()}`:
                githubPromts();
                break;
            case `Manage ${cm.stuPath().split("/").pop()}`:
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

const defaultPaths = async () => {
    // Create the directory for instructional material
    if(!existsSync(GITHUB)) {
        console.info("Initializing instructor folder...");
        console.info("Make sure the ssh key has been added to github and access has been granted.")
        mkdirSync(GITHUB);
        await promptForLink('instructor','instructor');
    }

    if(existsSync(GITHUB) && !getSubDirs(GITHUB).length){
        console.info("Initializing instructor folder...");
        console.info("Make sure the ssh key has been added to github and access has been granted.")
        await promptForLink('instructor','instructor');
    }

    // Create the directory for gitlab class material
    if(!existsSync(GITLAB)) {
        console.info("Initializing student folder...");
        console.info("Make sure the ssh key has been added to gitlab and access has been granted.")
        mkdirSync(GITLAB);
        await promptForLink('student','student');
    }

    if(existsSync(GITLAB) && !getSubDirs(GITLAB).length){
        console.info("Initializing student folder...");
        console.info("Make sure the ssh key has been added to gitlab and access has been granted.")
        await promptForLink('student','student');
    }

    basePromts();
}

const selectExistingPath = (path,type,exists) => {
    const dirs = cm.pathDirs(path);
    console.info(INFO_COLOR,`Current path: ${path}`);
    inquirer
        .prompt([
            {
                name: "options",
                message: `Select an option for existing ${type} content:`,
                type: "list",
                choices: [
                    "\033[32mSelect this path\x1b[0m",
                    ...dirs,
                    "\033[33mBack\x1b[0m",
                    "\033[91mExit\x1b[0m"
                ]
            }
        ]).then(({options})=>{
            switch(options){
                case "\033[32mSelect this path\x1b[0m":
                    updateBasePaths(path,type);
                    if(type==="instructor") selectExistingPath('/','student',exists);
                    else init();
                    console.log(path);
                    break;
                case BACK:
                    if(path==="/") choosePathing();
                    else {
                        const newPath = path.split("/");
                        newPath.pop();
                        selectExistingPath(newPath.join("/"),type,exists)
                    }
                    break;
                case EXIT:
                    console.log(INFO_COLOR, "Exiting Class Manager");
                    break;
                default:
                    console.log(options)
                    const newPath = `${path==="/"?"":path}/${options}`;
                    selectExistingPath(newPath,type,exists);
            }
        }).catch((error) => {
            if (error.isTtyError) {
                console.log(ERROR_COLOR, "Prompt failed in the current environment");
            } else {
                console.log(ERROR_COLOR, error.message);
            }
        });
}

const choosePathing = () => {
    inquirer
        .prompt([
            {
                name: "options",
                message: "Select an option:",
                type: "list",
                choices: [
                    "Default Pathing (stores in classManager)",
                    "Select paths for existing content",
                    "Select paths to clone content to",
                    EXIT
                ]
            }
        ]).then(({options}) => {
            switch(options){
                case "Default Pathing (stores in classManager)":
                    defaultPaths();
                    break;
                case "Select paths for existing content":
                    selectExistingPath("/","instructor",true);
                    break;
                case "Select paths to clone content to":
                    selectExistingPath("/","instructor",false);
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
}


const settupPrompts = () => {
    inquirer
        .prompt([
            {
                name: "options",
                message: "Select an option:",
                type: "list",
                choices: [
                    "Settup repository paths",
                    EXIT
                ]
            }
        ]).then(({options}) => {
            switch(options){
                case "Settup repository paths":
                    choosePathing();
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
}


const init = async () => {
    console.info(SUCCESS_COLOR,"Welcome to Class Manager!");

    let basePaths = {};

    try {
        basePaths = JSON.parse(readFileSync('basePaths.json'));
    } catch (e) {
        console.log(e.message);
        console.info(WARNING_COLOR,"No content paths currently settup.");
        settupPrompts();
        return;
    }

    console.log(INFO_COLOR,"Current class: "+parseClassName(basePaths.instructor));

    basePromts();
}

init();