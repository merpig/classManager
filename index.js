const inquirer = require('inquirer');
const { readdirSync, mkdirSync, existsSync } = require('fs');
const child_process = require('child_process');

const GITHUB = "github";
const GITLAB = "gitlab";

const cloneIntoDirectory = (directory,link) =>
    child_process.execSync(`cd ${directory} && git clone ${link}`);

const promptForLink = directory => 
    inquirer
    .prompt([
        {
            type: 'input',
            name: 'link',
            message: `Enter the ${directory} ssh link to clone:`
        }
    ])
    .then(({link}) => {
        try {
            console.log(`Cloning into ${directory}, this may take a minute.`);
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
        }
    });

const init = () => {

    // Create the directory for github instructional material
    if(!existsSync(GITHUB)) {
        console.log("Initializing github folder...")
        mkdirSync(GITHUB);
        promptForLink(GITHUB);
    }

    // Create the directory for gitlab class material
    if(!existsSync(GITLAB)) {
        console.log("Initializing gitlab folder...")
        mkdirSync(GITLAB);
        promptForLink(GITLAB);
    }
}


init();