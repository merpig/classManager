const fs = require("fs");
const changeLog = require("./changeLog.json");

class ChangeLog{
    getLog() {
        return changeLog.changesToPush;
    }
    updateLog(changes) {
        changeLog.changesToPush = changes;
        fs.writeFile("./utils/changeLog.json", JSON.stringify(changeLog,null,2), function writeJSON(err) {
            if (err) return console.log(err);
            //console.log('writing to ' + "./utils/changeLog.json");
        });
    }
    pushToLog(change) {
        changeLog.changesToPush.push(change);
        fs.writeFile("./utils/changeLog.json", JSON.stringify(changeLog,null,2), function writeJSON(err) {
            if (err) return console.log(err);
            //console.log('writing to ' + "./utils/changeLog.json");
        });
    }
}

module.exports = ChangeLog;