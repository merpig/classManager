const inquirer = require("inquirer");
const { readFileSync } = require("fs");
const prompts = require("./prompts/index");
const fileManager = require("./utils/fileManager")
const {WARNING_COLOR,SUCCESS_COLOR,INFO_COLOR} = require("./utils/constants");

const init = async () => {
    console.clear();
    console.info(SUCCESS_COLOR,"Welcome to Class Manager!");

    let basePaths = {};

    try {
        basePaths = JSON.parse(readFileSync('basePaths.json'));
    } catch (e) {
        console.log(e.message);
        console.info(WARNING_COLOR,"No content paths currently settup.");
        prompts.settupPrompts();
        return;
    }

    console.log(INFO_COLOR,"Current class: " + fileManager.parseClassName(basePaths.instructor));

    prompts.basePrompts();
}

init();