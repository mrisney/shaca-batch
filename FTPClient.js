var fs = require('fs');
var FTPS = require('ftps');
var StreamZip = require('node-stream-zip');

class FTPClient {

    constructor() {
        this.ftps = new FTPS({
            host: 'dev.itis-shaca.com',
            username: 'itisadmin',
            password: 'jiud6imi',
            protocol: 'ftps',
            additionalLftpCommands: 'set ssl:verify-certificate no; set ftp:ssl-protect-data true',
            requireSSHKey: false
        });
    }

    incomingMVARFilesList() {
        return new Promise((resolve, reject) => {
            this.ftps.cd('/HPD/MVARIncoming/').raw('ls -altr *.zip').exec(function (error, response) {
                if (error) {
                    reject(Error(error.toString()));
                } else {
                    var responseArray = response.data.split('\n');
                    resolve(responseArray);
                }
            });
        });
    }

    getLatestMVARFile() {
        return new Promise((resolve, reject) => {
            this.ftps.cd('/HPD/MVARIncoming/').raw('ls -altr *.zip').exec(function (error, response) {
                if (error) {
                    reject(Error(error.toString()));
                } else {
                    var responseArray = response.data.split('\n');
                    var latestFile = responseArray[responseArray.length - 2].split(' ');
                    var latestFileName = latestFile[latestFile.length - 1];
                    resolve(latestFileName);
                }
            });
        });
    }

    downloadFile(fileName) {
        return new Promise((resolve, reject) => {
            this.ftps.get('/HPD/MVARIncoming/' + fileName).exec(function (error, response) {
                if (error) {
                    reject(Error(error.toString()));
                } else {
                    resolve(response);
                }
            });
        });
    }

    fileComplete(fileName) {
        return new Promise((resolve, reject) => {
            this.ftps.mv('/HPD/MVARIncoming/' + fileName, '/HPD/MVAR Completed/' + fileName).exec(function (error, response) {
                if (error) {
                    reject(Error(error.toString()));
                } else {
                    resolve(response);
                    console.log("file moved");
                }
            });
        });
    }
}

module.exports = FTPClient;
