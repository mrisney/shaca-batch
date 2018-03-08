const fs = require('fs');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const oracledb = require('oracledb');
const rp = require('request-promise');

var dateLastModified = "03/07/2018";

async function insertAccidentXML(accidentId, accidentXML) {
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
                "BEGIN accident_clob_in(:p_id, :p_xmlclob, :p_last_mod); END;", {
                    p_id: accidentId,
                    p_xmlclob: accidentXML,
                    p_last_mod: dateLastModified
                });

            resolve(JSON.stringify(result));

        } catch (err) { // catches errors in getConnection and the query
            reject(err);
        } finally {
            if (conn) { // the conn assignment worked, must release
                try {
                    await conn.release();
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}

var content = fs.readFileSync(__dirname + '/spillman-query.xml', 'utf8');
var spillmanQuery = new DOMParser().parseFromString(content);

spillmanQuery.getElementsByTagName("DateLastModified")[0].childNodes[0].data = dateLastModified;

var xml = new XMLSerializer().serializeToString(spillmanQuery);

var requestOptions = {
    uri: 'https://shaca.kauai.gov:4444/DataExchange/REST',
    rejectUnauthorized: false,
    method: 'POST',
    // authentication headers
    headers: {
        'Authorization': 'Basic ' + new Buffer('SHACA' + ':' + 'shaca2018').toString('base64'),
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xml)
    },
    body: xml,
    json: false
};

async function postAndProcessQuery() {

    //1. post xml
    const responseXML = await rp(requestOptions);

    var xmlAccidents = new DOMParser().parseFromString(responseXML);
    var trafficAccidents = xmlAccidents.getElementsByTagName("TrafficAccidentTable");

    for (var i = 0; i < trafficAccidents.length; i++) {

        var accidentNumber = trafficAccidents[i].getElementsByTagName("AccidentNumber")[0].childNodes[0].nodeValue;
        var trafficAccidentXML = new XMLSerializer().serializeToString(trafficAccidents[i]);
        trafficAccidentXML = '<?xml version="1.0" encoding="UTF-8"?>' + trafficAccidentXML;
        try {
            let res = await insertAccidentXML(accidentNumber, trafficAccidentXML);
            console.log(res);
        } catch (err) {
            console.error(err);
        }
    }
}
postAndProcessQuery();
