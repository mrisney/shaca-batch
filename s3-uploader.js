const StreamZip = require('node-stream-zip');
const AWS = require('aws-sdk');
const mime = require('mime-types')

AWS.config.loadFromPath('./config.json');

let s3 = new AWS.S3();
let bucket = 'cdn.shaca.io';

class S3ZipFileUploader {

    constructor() {}

    upload(fileName) {

        return new Promise((resolve, reject) => {

            var zip = new StreamZip({
                file: fileName,
                storeEntries: true
            });

            try {
                zip.on('ready', () => {

                    //console.log('Entries read: ' + zip.entriesCount);

                    for (const entry of Object.values(zip.entries())) {
                        var desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
                        //console.log(`Entry ${entry.name}: ${desc}`);
                        var data = zip.entryDataSync(entry.name);
                        var ext = entry.name.substr(entry.name.lastIndexOf('.') + 1);
                        
                        if (ext !== 'txt') {
                            var params = {
                                Bucket: bucket,
                                Key: entry.name,
                                Body: data,
                                ContentType: mime.lookup(ext),
                                ACL: 'public-read'
                            };

                            s3.putObject(params, function (err, data) {

                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log("Successfully uploaded data to https://s3-us-west-2.amazonaws.com/" + bucket + "/" + entry.name);
                                }
                            });
                        }
                    }
                    // Do not forget to close the file once you're done
                    zip.close()
                });
                resolve('done');
            } catch (e) {
                reject(Error(fileName + ' : bad zip file'));
            }
        });
    }
}
module.exports = S3ZipFileUploader;
