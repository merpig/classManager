const inquirer = require("inquirer");
const cm = require("../utils/cm");
const selectedPaths = require("./selectedPaths");
const fileManager = require("../utils/fileManager");
const {EXIT,BACK,ERROR_COLOR,INFO_COLOR} = require("../utils/constants");

const selectExistingPath = (path,type,exists,cbPrompts,basePrompts) => {
    console.info(INFO_COLOR,`Current path: ${path}`);

    const msg = exists ? "for existing" : "to save";
    const dirs = cm.pathDirs(path);
    const choices = [
        "\x1b[32mSelect this path\x1b[0m",
        ...dirs,
        BACK,
        EXIT
    ];

    inquirer
        .prompt([
            {
                name: "options",
                message: `Select an option ${msg} ${type} content:`,
                type: "list",
                choices
            }
        ]).then(({options})=>{
            console.clear();
            switch(options){
                case "\x1b[32mSelect this path\x1b[0m":
                    if(exists){
                        fileManager.updateBasePaths(path,type);
                        if(type==="instructor") selectExistingPath('/','student',exists,cbPrompts,basePrompts);
                        else basePrompts();
                    }
                    else {
                        if(type==="instructor") selectedPaths(path,'instructor',()=>selectExistingPath('/','student',exists,cbPrompts,basePrompts));
                        else selectedPaths(path,'student',basePrompts);
                    }
                    break;
                case BACK:
                    if(path==="/") cbPrompts();
                    else {
                        const newPath = path.split("/");
                        newPath.pop();
                        selectExistingPath(newPath.join("/"),type,exists,cbPrompts,basePrompts)
                    }
                    break;
                case EXIT:
                    console.log(INFO_COLOR, "Exiting Class Manager");
                    break;
                default:
                    console.log(options)
                    const newPath = `${path==="/"?"":path}/${options}`;
                    selectExistingPath(newPath,type,exists,cbPrompts,basePrompts);
            }
        }).catch((error) => {
            if (error.isTtyError) {
                console.log(ERROR_COLOR, "Prompt failed in the current environment");
            } else {
                console.log(ERROR_COLOR, error.message);
                selectExistingPath(path,type,exists,cbPrompts,basePrompts);
            }
        });
}

module.exports = selectExistingPath;