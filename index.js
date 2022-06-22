const inquirer = require("inquirer");
const { readdirSync, mkdirSync, existsSync } = require("fs");
const child_process = require("child_process");

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

const copyUnit = unit => {
    let dirInGithub = getSubDirs(GITHUB)[0];
    let dirInGitlab = getSubDirs(GITLAB)[0];

    let classContentPath = `${GITHUB}/${dirInGithub}/${getSubDirs(`${GITHUB}/${dirInGithub}`).filter(dir=>dir.includes("01"))[0]}`
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`

    const rmSolved = `rm -rf 01-Activities/*/Solved 01-Activities/*/Main 02-Homework/Master 02-Homework/Main 02-Challenge/Main 03-Algorithms/*/Solved`

    child_process.execSync(`cp -r ${classContentPath}/${unit} ${gitlabContentPath} && cd ${gitlabContentPath}/${unit} && ${rmSolved}`);
    changesToPush.push(`unit ${unit} added`);
}

const pushChanges = () => {
    let dirInGitlab = getSubDirs(GITLAB)[0];
    let gitlabContentPath = `${GITLAB}/${dirInGitlab}`
    child_process.execSync(`cd ${gitlabContentPath} && git add -A && git commit -m "${changesToPush.join(" ")}" && git push`)
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
        try {
            console.log(`Cloning ${parseLinkRepo(link)} into ${directory}, this may take a few minutes.`);
            cloneIntoDirectory(directory,link);
            console.log(`The ${directory} directory is set up!`)
        }catch(error){
            console.log(error)
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
                // "Add All Solved to Unit",
                // "Add Selection of Solved to Unit",
                // "Remove Solved from Unit",
                // "Remove Unit",
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
                if(changesToPush.length) pushChanges()
                else console.info("No changes to push");
                gitlabPromts();
                break;
            case "Hard reset from origin":
                hardUpdateDirectory(repo);
                gitlabPromts();
                break;
            case "Current Units":
                console.log(getSubDirs(repo).filter(unit=>unit[0]!=="."));
                gitlabPromts();
                break;
            case "Back":
                basePromts();
                break;
            case "Exit":
                console.log("Exiting Class Manager");
                break;
            default:
                let unit = options.split("(")[1].split(")")[0];
                if(unit === "none") console.info("No more units left to add!")
                else copyUnit(unit);
                gitlabPromts();
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log("Prompt failed in the current environment");
        } else {
            console.log(error)
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
        console.log("Initializing github folder...");
        mkdirSync(GITHUB);
        await promptForLink(GITHUB);
    }

    if(existsSync(GITHUB) && !getSubDirs(GITHUB).length){
        console.log("Initializing github folder...");
        await promptForLink(GITHUB);
    }

    // Create the directory for gitlab class material
    if(!existsSync(GITLAB)) {
        console.log("Initializing gitlab folder...");
        mkdirSync(GITLAB);
        await promptForLink(GITLAB);
    }

    if(existsSync(GITLAB) && !getSubDirs(GITLAB).length){
        console.log("Initializing gitlab folder...");
        await promptForLink(GITLAB);
    }

    basePromts();
}

// nextUnit(getSubDirs(`${GITLAB}/${getSubDirs(GITLAB)[0]}`))
init();