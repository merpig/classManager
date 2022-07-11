const { readdirSync, mkdirSync, existsSync, lstatSync, readFileSync, writeFileSync } = require("fs");

/**
 * 
 * @param {string} path 
 * @returns {Array}
 * Returns the contents of the path.
 */
const pathContents = (path) => {
    return readdirSync(path);
}
/**
 * 
 * @param {string} path 
 * @returns {Array}
 * Returns the contents of the path with no hidden or README files
 */
const pathContentsFiltered = path => {
    return pathContents(path).filter(dir=>dir[0]!=="."&&dir[0]!=="R");
}
/**
 * 
 * @param {string} path 
 * @returns {Array}
 * Return the directories of the path.
 */
const pathDirs = path => {
    return pathContents(path).filter( e => {
        try{
            return !lstatSync(path+(path==="/"?"":"/")+e).isFile() && e[0]!=="."
        } catch(e){
            return false;
        }
    });
}
/**
 * 
 * @returns {Object}
 * Returns the object containing the base content paths.
 */
const basePaths = () => JSON.parse(readFileSync('basePaths.json'));

/**
 * 
 * @returns {String}
 * Returns the path for the instructional material.
 */
const insPath = () => basePaths().instructor;

/**
 * 
 * @returns {Array}
 * Returns the contents of the instructional material path.
 */
const insDirs = () => pathContents(insPath());

/**
 * 
 * @returns {String}
 * Returns the path for the instructional class content material.
 */
const insUnitsPath = () => 
    insPath() + "/" + insDirs().filter(dir=>dir.includes("01"))[0];

/**
 * 
 * @returns {Array}
 * Return an array of all the instructional class content units.
 */
const insUnits = () => pathDirs(insUnitsPath());

/**
 * 
 * @param {String} unit 
 * @returns {String}
 * Returns the path for a specific instructional class content unit.
 */
const insUnitPath = unit =>
    insUnitsPath() + "/" + insUnits().filter(n=>n===unit)[0];

/**
 * 
 * @param {String} unit 
 * @returns {String}
 * Returns the activities path for a specific student class content unit.
 */
const insUnitActivitiesPath = unit => 
    insUnitPath(unit)+"/01-Activities";

    /**
 * 
 * @param {String} unit 
 * @returns {Array}
 * Returns the an array of all activities for a unit
 */
const insUnitActivities = unit => pathDirs(insUnitActivitiesPath(unit));

/**
 * 
 * @returns {String}
 * Returns the path for the instructional lesson plan material.
 */
const insLessonPlansPath = () =>
    insPath() + "/" + insDirs().filter(dir=>dir.includes("02"))[0];

/**
 * 
 * @returns {String}
 * Returns the path for the student material.
 */
const stuPath = () => basePaths().student;

/**
 * 
 * @returns {Array}
 * Return an array of all the student class content units.
 */
const stuUnits = () => pathDirs(stuPath());

/**
 * 
 * @param {String} unit 
 * @returns {String}
 * Returns the path for a specific student class content unit.
 */
const stuUnitPath = unit => 
    stuPath() + "/" + stuUnits().filter(n=>n===unit)[0];

/**
 * 
 * @param {String} unit 
 * @returns {String}
 * Returns the activities path for a specific student class content unit.
 */
const stuUnitActivitiesPath = unit => 
    stuUnitPath(unit)+"/01-Activities";

/**
 * 
 * @param {String} unit 
 * @returns {Array}
 * Returns the an array of all activities for a unit
 */
const stuUnitActivities = unit => pathDirs(stuUnitActivitiesPath(unit));

module.exports = {
    basePaths,
    pathContents,
    pathContentsFiltered,
    pathDirs,

    // Instructional material exports
    insPath,
    insDirs,
    insUnits,
    insUnitsPath,
    insUnitPath,
    insUnitActivitiesPath,
    insUnitActivities,
    insLessonPlansPath,

    // Student material exports
    stuPath,
    stuUnits,
    stuUnitPath,
    stuUnitActivitiesPath,
    stuUnitActivities
};