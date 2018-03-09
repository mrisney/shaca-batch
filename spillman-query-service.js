const fs = require('fs');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const oracledb = require('oracledb');
const rp = require('request-promise');
const schedule = require('node-schedule');

var EventLogger = require('node-windows').EventLogger;
var log = new EventLogger('SHACA Batch Process');

// The base XML query, to be posted to the Spillman REST API
const baseXMLQuery = fs.readFileSync(__dirname + '/spillman-query.xml', 'utf8');
var spillmanQuery = new DOMParser().parseFromString(baseXMLQuery);

// The Request options for the Spillman REST API 
var requestOptions = {
    uri: 'https://shaca.kauai.gov:4444/DataExchange/REST',
    rejectUnauthorized: false,
    method: 'POST',
    // authentication headers
    headers: {
        'Authorization': 'Basic ' + new Buffer('SHACA' + ':' + 'shaca2018').toString('base64'),
        'Content-Type': 'text/xml',
    },
    json: false
};

async function insertAccidentXML(accidentNumber, dateOfAccident, accidentXML, queryDate) {
    return new Promise(async function (resolve, reject) {

        let conn;

        try {

            oracledb.autoCommit = true
            oracledb.outFormat = oracledb.OBJECT

            conn = await oracledb.getConnection({
                user: "kpd_stage",
                password: "kpd_stage",
                connectString: "db4"
            });

            let result = await conn.execute(
                "BEGIN accident_clob_in(:p_acc_num, :p_acc_dt, :p_xmlclob, :p_last_mod); END;", {
                    p_acc_num: accidentNumber,
                    p_acc_dt: dateOfAccident,
                    p_xmlclob: accidentXML,
                    p_last_mod: queryDate
                });

            resolve(JSON.stringify(result));

        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) { // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    log.error(e);
                }
            }
        }
    });
}

async function postAndProcessQuery(queryDate) {

    // 1. set the date last modified
    spillmanQuery.getElementsByTagName("DateLastModified")[0].childNodes[0].data = queryDate;

    // 2. get the xml with the new query date
    let xml = new XMLSerializer().serializeToString(spillmanQuery);

    // 3. set the bod of the request options with the xml
    requestOptions.body = xml;
    requestOptions.headers["Content-Length"] = Buffer.byteLength(xml)

    // 4. wait for the response
    let responseXML = await rp(requestOptions);

    let xmlAccidents = new DOMParser().parseFromString(responseXML);
    let trafficAccidents = xmlAccidents.getElementsByTagName("TrafficAccidentTable");

    for (let i = 0; i < trafficAccidents.length; i++) {

        var accidentNumber = trafficAccidents[i].getElementsByTagName("AccidentNumber")[0].childNodes[0].nodeValue;
        var dateOfAccident = trafficAccidents[i].getElementsByTagName("DateOfAccident")[0].childNodes[0].nodeValue;
        var trafficAccidentXML = new XMLSerializer().serializeToString(trafficAccidents[i]);

        trafficAccidentXML = '<?xml version="1.0" encoding="UTF-8"?>' + trafficAccidentXML;

        try {
            let res = await insertAccidentXML(accidentNumber, dateOfAccident.trim(), trafficAccidentXML, queryDate);
        } catch (err) {
            log.error(err);
        }
    }
}

async function processDates() {
    
    var d = new Date(); // Today!
    d.setDate(d.getDate() - 1); // Yesterday

    var queryDate = d.toLocaleDateString('en-US');
    await postAndProcessQuery(queryDate);
    
    log.info("querying and inserting accident complete for " + queryDate);
}

var event = schedule.scheduleJob({ hour: 04, minute: 15 }, function () {
    processDates();
});
