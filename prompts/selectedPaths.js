const promptForLink = require("./promptForLink");
const {EXIT,BACK,ERROR_COLOR,WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("../utils/constants");

const selectedPaths = async (path,type,cbPrompt) => {
    console.clear();

    // Create the directory for instructional material
    console.info(INFO_COLOR,`Initializing ${type} folder...`);
    await promptForLink(path,type);

    cbPrompt();
}

module.exports = selectedPaths;