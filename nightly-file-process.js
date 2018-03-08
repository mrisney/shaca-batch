const schedule = require('node-schedule');
const FTPClient = require("./FTPClient.js");
const FileUtils = require("./FileUtils.js");
const Formatting = require("./Formatting.js");
const db = require("./driver.js");
const fs = require('fs');
var EventLogger = require('node-windows').EventLogger;

var client = new FTPClient();
var fileUtils = new FileUtils();
var latestFile = "";
var log = new EventLogger('SHACA Batch Process');


async function downloadFile() {

    // 1. get  the name of lastest mvar zip file.
    latestFile = await client.getLatestMVARFile();

    // 2. download it.
    await client.downloadFile(latestFile);

    // 3. read the zip file, get the json from json.txt.
    const json = await fileUtils.readZipfile(latestFile);

    // 4. delete the locally downloaded file
    await fileUtils.deleteFile(latestFile);

    // 5. create database connection
    await db.connect();

    return json;
}


var bindvars = {
    p_filename: 'test',
    p_description: 'daily batch',
    p_errors: 'none'
};

var event = schedule.scheduleJob({hour: 04, minute: 30}, function () {
    downloadFile().then((json) => {
        var formatUtils = new Formatting(json);
        var sqlStatements = formatUtils.jsonToSQLStatements();
        var counter = sqlStatements.length;

        for (var i = 0, len = sqlStatements.length; i < len; i++) {
            db.execute(sqlStatements[i]);
            counter -= 1;
            if (counter === 0) {
                console.log(formatUtils.metaData);
                client.fileComplete(latestFile);
            }
        }
        var metaData = JSON.stringify(formatUtils.metaData);
        db.execute("BEGIN journal_entry('" + latestFile + "','daily update','none','"+metaData+"'); END;");
        log.info("Upload complete : "+metaData)
    });
});
