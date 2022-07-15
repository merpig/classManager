const inquirer = require("inquirer");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,SUCCESS_COLOR,ERROR_COLOR,INFO_COLOR} = require("../utils/constants");

const promptForLink = async (directory,type) => 
    await inquirer
    .prompt([
        {
            type: "input",
            name: "link",
            message: `Enter the ${type} content ssh link to clone:`
        }
    ])
    .then(async ({link}) => {
        console.clear();
        const baseLink = link.split("/")[0];
        if(type === 'instructor' && baseLink!=="git@github.com:coding-boot-camp"){
            console.info(ERROR_COLOR, "Invalid link, please clone from a coding bootcamp repository.");
            await promptForLink(directory,type);
        }
        else {
            try {
                console.log(INFO_COLOR, `Cloning ${fileManager.parseLinkRepo(link)} into ${directory}, this may take a few minutes.`);
                fileManager.cloneIntoDirectory(directory,link);
                console.log(SUCCESS_COLOR, `The ${directory} directory is set up!`);
                fileManager.updateBasePaths(directory+'/'+ fileManager.parseLinkRepo(link),type);
            }catch(error){
                console.log(ERROR_COLOR, error.message);
                await promptForLink(directory,type);
            }
        }
    })
    .catch(async (error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            await promptForLink(directory,type);
        }
    });

module.exports = promptForLink;