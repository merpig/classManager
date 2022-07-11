const fs = require("fs");

class ChangeLog{
    getLog() {
        try {
            return JSON.parse(readFileSync('changeLog.json')).changesToPush;
        } catch(e){
            const changeLog = {
                "changesToPush": []
            }
            fs.writeFile("./utils/changeLog.json", JSON.stringify(changeLog,null,2), function writeJSON(err) {
                if (err) return console.log(err);
                //console.log('writing to ' + "./utils/changeLog.json");
            });
            return changeLog.changesToPush;
        }
    }
    updateLog(changes) {
        const changeLog = {};
        changeLog.changesToPush = changes;
        fs.writeFile("./utils/changeLog.json", JSON.stringify(changeLog,null,2), function writeJSON(err) {
            if (err) return console.log(err);
            //console.log('writing to ' + "./utils/changeLog.json");
        });
    }
    pushToLog(change) {
        const changeLog = {
            changesToPush: [...this.getLog(),change]
        };
        // changeLog.changesToPush.push(change);
        fs.writeFile("./utils/changeLog.json", JSON.stringify(changeLog,null,2), function writeJSON(err) {
            if (err) return console.log(err);
            //console.log('writing to ' + "./utils/changeLog.json");
        });
    }
}

module.exports = ChangeLog;