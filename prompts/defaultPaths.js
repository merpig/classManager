const { mkdirSync, existsSync } = require("fs");
const promptForLink = require("./promptForLink");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const defaultPaths = async () => {
    console.clear();
    let basePath = __dirname.includes("/")? __dirname.split("/") : __dirname.split("\\");
    basePath.pop();
    basePath.shift();
    basePath = "/" + basePath.join("/")

    // Create the directory for instructional material
    if(existsSync("instructor") && !getSubDirs("instructor").length){
        console.info(INFO_COLOR,"Initializing instructor folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to github and access has been granted.")
        await promptForLink(basePath + '/instructor','instructor');
    }

    if(!existsSync("instructor")) {
        console.info(INFO_COLOR,"Initializing instructor folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to github and access has been granted.")
        mkdirSync("instructor");
        console.log(__dirname);
        await promptForLink(basePath + '/instructor','instructor');
    }

    if(existsSync("student") && !getSubDirs("student").length){
        console.info(INFO_COLOR,"Initializing student folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to gitlab and access has been granted.")
        await promptForLink(basePath + '/student','student');
    }

    // Create the directory for student class material
    if(!existsSync("student")) {
        console.info(INFO_COLOR,"Initializing student folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to gitlab and access has been granted.")
        mkdirSync("student");
        await promptForLink(basePath + '/student','student');
    }

    basePromts();
}

module.exports = defaultPaths;