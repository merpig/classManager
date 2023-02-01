const inquirer = require("inquirer");
const cm = require("../utils/cm");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR} = require("../utils/constants");
const { lstatSync } = require("fs");

const selectLessonPlan = (path,githubPrompts,basePrompts) => {
    const dirs = cm.pathContents(path);
    const choices = [
        "Open in vscode",
        ...dirs,
        BACK,
        "Return to github prompts", //change github name
        EXIT
    ];
    
    inquirer
    .prompt([
        {
            name: "options",
            message: "Select a directory",
            type: "list",
            choices
        }
    ])
    .then(({options})=>{
        console.clear();
        switch(options){
            case "Open in vscode":
                fileManager.openAtPath(path);
                githubPrompts(basePrompts);
                break;
            case BACK:
                if(dirs.includes("Full-Time")) githubPrompts(basePrompts);
                else {
                    const newPath = path.split("/");
                    newPath.pop();
                    selectLessonPlan(newPath.join("/"),githubPrompts,basePrompts)
                }
                break;
            case "Return to github prompts":
                githubPrompts(basePrompts);
                break;
            case EXIT:
                break;
            default:
                const newPath = `${path}/${options}`;
                if(!lstatSync(newPath).isFile()) {
                    selectLessonPlan(newPath,githubPrompts,basePrompts);
                }
                else {
                    fileManager.openAtPath(newPath);
                    githubPrompts(basePrompts);
                }
        }
    })
    .catch((error) => {
        if (error.isTtyError) {
            console.log(ERROR_COLOR, "Prompt failed in the current environment");
        } else {
            console.log(ERROR_COLOR, error.message);
            selectLessonPlan(path,githubPrompts,basePrompts);
        }
    });
}

module.exports = selectLessonPlan;