const { mkdirSync, existsSync } = require("fs");
const promptForLink = require("./promptForLink");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const defaultPaths = async () => {
    console.clear();
    // Create the directory for instructional material
    if(!existsSync(GITHUB)) {
        console.info(INFO_COLOR,"Initializing instructor folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to github and access has been granted.")
        mkdirSync(GITHUB);
        await promptForLink('instructor','instructor');
    }

    if(existsSync(GITHUB) && !getSubDirs(GITHUB).length){
        console.info(INFO_COLOR,"Initializing instructor folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to github and access has been granted.")
        await promptForLink('instructor','instructor');
    }

    // Create the directory for gitlab class material
    if(!existsSync(GITLAB)) {
        console.info(INFO_COLOR,"Initializing student folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to gitlab and access has been granted.")
        mkdirSync(GITLAB);
        await promptForLink('student','student');
    }

    if(existsSync(GITLAB) && !getSubDirs(GITLAB).length){
        console.info(INFO_COLOR,"Initializing student folder...");
        console.info(INFO_COLOR,"Make sure the ssh key has been added to gitlab and access has been granted.")
        await promptForLink('student','student');
    }

    basePromts();
}

module.exports = defaultPaths;