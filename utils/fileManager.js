const { readFileSync, writeFileSync } = require("fs");
const child_process = require("child_process");
const ChangeLog = require("./changeLog.js");
const cm = require("./cm");
const {INFO_COLOR, SUCCESS_COLOR} = require("./constants")

const isWin = process.platform === "win32";
const changeLog = new ChangeLog();

const winPathing = isWin?"/c":"";

const parseClassName = str => {
    return str.split("/").pop().split("-").map(word=>word[0].toUpperCase()+word.slice(1)).join(" ")
}

const parseLinkRepo = str => str.split("/")[1].split(".")[0];

const cloneIntoDirectory = (directory,link) =>{
    child_process.execSync(`cd ${directory.replace(" ","\\ ")} && git clone ${link}`);
}

const updateDirectory = (directory) =>{
    child_process.execSync(`cd ${directory.replace(" ","\\ ")} && git pull`);
}

const hardUpdateDirectory = (directory) =>{
    child_process.execSync(`cd ${directory.replace(" ","\\ ")} && git fetch origin && git reset --hard origin/main && git clean -f -d`);
}

const nextUnit = arr => {
    // console.log(arr);
    let unitValue = 0;
    if(arr.length){
        unitValue = arr
            .filter(unit=>unit[0]!=="."&&unit[0]!=="R")
            .map(unit=>parseInt(unit.split("-")))
            .pop();
    }
    unitValue++;
    unitValue = unitValue.toString(); 
    unitValue = unitValue.length < 2 ? "0"+unitValue : unitValue;

    const matchedDir = cm.insUnits().filter(unit=>unit.includes(unitValue));

    if(matchedDir.length){
        return matchedDir[0];
    }
    else return "none";
}

const copyUnitUnsolved = (unit) => {
    const rmSolved = `rm -rf 01-Activities/*/Solved 01-Activities/*/Main 02-Homework/Master 02-Homework/Main 02-Challenge/Main 03-Algorithms/*/Solved`;
    const addSandbox = `mkdir 05-Sandbox && cd 05-Sandbox && echo # Sandbox folder for activities and testing code > README.md`;

    child_process.execSync(`cp -r ${winPathing}${cm.insUnitsPath()}/${unit} ${winPathing}${cm.stuPath()} && cd ${cm.stuPath().replace(" ","\\ ")}/${unit} && ${rmSolved} && ${addSandbox}`);

    changeLog.pushToLog(`unit ${unit} added`);
}

const removeUnit = unit => {
    const rmUnit = `rm -rf ${winPathing}${unit}`;
    console.log(rmUnit)
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

const addAlgorithmsSolved = (unit) => {
    const insUnitPath = cm.insUnitPath(unit);
    const stuUnitPath = cm.stuUnitPath(unit);
    const extension = "03-Algorithms";

    child_process.execSync(`cp -r ${winPathing}${insUnitPath}/${extension} ${winPathing}${stuUnitPath}`);
}

const addSelectionSolved = (start,end,unit,activitiesPath,activities) => {
    const startIndex = activities.indexOf(start);
    const endIndex = activities.indexOf(end);

    const gitlabUnitActivitiesPath = cm.stuUnitActivitiesPath(unit);

    for(let i = startIndex; i<=endIndex; startIndex<=endIndex ? i++ : i--){
        const activity = activities[i];
        const extension = (activity.includes("Project")?"Main":"Solved");

        child_process.execSync(`cp -r ${winPathing}${activitiesPath}/${activities[i]}/${extension} ${winPathing}${gitlabUnitActivitiesPath}/${activity}`);

        //changeLog.pushToLog(`solved added for ${activities[i]}`);
    }
}

const removeSelectionSolved = (start,end,unit,activities) => {
    const startIndex = activities.indexOf(start);
    const endIndex = activities.indexOf(end);

    for(let i = startIndex; i<=endIndex; startIndex<=endIndex? i++ : i--){
        const activity = activities[i];
        const extension = activity.includes("Project")?"Main":"Solved";
        child_process.execSync(`rm -rf ${winPathing}${cm.stuUnitActivitiesPath(unit)}/${activity}/${extension}`);
        //let filteredChanges = changeLog.getLog().filter(change=>!change.includes(`solved added for ${activities[i]}`));
        //if(filteredChanges.length<changeLog.getLog().length){
            //changeLog.updateLog(filteredChanges);
        //}
        //else changeLog.pushToLog(`solved removed for ${activities[i]}`);
    }
}

const updateBasePaths = (path,type) => {
    try{
        let data = JSON.parse(readFileSync("basePaths.json"));
        data[type] = `${winPathing}${path}`;
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

module.exports = {
    parseClassName,
    parseLinkRepo,
    cloneIntoDirectory,
    updateDirectory,
    hardUpdateDirectory,
    nextUnit,
    copyUnitUnsolved,
    removeUnit,
    openAtPath,
    pushChanges,
    addSelectionSolved,
    removeSelectionSolved,
    updateBasePaths,
    addAlgorithmsSolved,
}