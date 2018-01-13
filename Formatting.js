'use strict';
const fs = require('fs');
const _ = require('lodash');
const knex = require('knex')({
    client: 'oracle',
    wrapIdentifier: function (value) {
        return (value !== '*' ? '' + value.replace(/"/g, '') + '' : '*')
    }
});


function replaceColumNames(string) {

    return string.replace(/\bUID\b/g, 'unique_id')
        .replace(/\bowner\b/g, 'report_owner')
        .replace(/\btype\b/g, 'report_type')
        .replace(/\bdate\b/g, 'modified_date')
        .replace(/\btime\b/g, 'modified_time')
        .replace(/''/g, 'NULL');

}
const counter = {
    "main_data": 0,
    "mvc_major_report": 0,
    "mvc_major_gps": 0,
    "address": 0,
    "units_major": 0,
    "object": 0,
    "vehicles": 0,
    "persons": 0,
    "phone": 0,
    "identification" : 0
};

class Formatting {
    constructor(rawJSON) {
        this.rawJSON = rawJSON;
    }

    get metaData() {
        return counter;
    }
    jsonToSQLStatements() {


  
        let insertStatements = new Array();
        let incidents = JSON.parse(this.rawJSON);


       

        Object.keys(incidents).forEach(function (i) {
            var incidentId = i;
            var incident = incidents[i];

            var mainData = incident["main_data"];
            if (mainData) {
                for (let data of mainData) {
                    var sql = knex('main_data').insert(data).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["main_data"]++;
                }
            }

            var mvcMajorReport = incident["mvc_major_report"];
            if (mvcMajorReport) {
                for (let report of mvcMajorReport) {
                    report = _.omit(report, ['mvc_major_gps', 'mvc_major_diagram_skidmarks', 'object_position', 'mvc_major_sequence_events']);
                    var sql = knex('mvc_major_report').insert(report).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["mvc_major_report"]++;
                }
            }

            var objectData = incident["object"];
            for (let key in objectData) {
                if (objectData.hasOwnProperty(key)) {
                    let sql = knex('object').insert(objectData[key]).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["object"]++;
                }
            }

            var addressData = incident["address"];
            for (let key in addressData) {
                if (addressData.hasOwnProperty(key)) {
                    var sql = knex('address').insert(addressData[key]).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["address"]++;
                }
            }

            var unitsMajor = incident["units_major"];
            if (unitsMajor) {
                for (let unitsMjr of unitsMajor) {
                    unitsMjr = _.omit(unitsMjr, ['mvc_major_citations', 'vehicle_direction', 'pavement_markings', 'cmv_number', 'cmv_hazardous', 'cmv_carrier_id']);
                    var sql = knex('units_major').insert(unitsMjr).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["units_major"]++;
                }
            }

            var personData = incident["persons"];
            for (let key in personData) {
                if (personData.hasOwnProperty(key)) {
                    var sql = knex('persons').insert(personData[key]).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["persons"]++;
                }
            }

            var vehicleData = incident["vehicles"];
            for (let key in vehicleData) {
                if (vehicleData.hasOwnProperty(key)) {
                    var sql = knex('vehicles').insert(vehicleData[key]).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["vehicles"]++;
                }
            }

            var phoneData = incident["phone"];
            for (let key in phoneData) {
                if (phoneData.hasOwnProperty(key)) {
                    var sql = knex('phone').insert(phoneData[key]).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["phone"]++;
                }
            }

            var identificationData = incident["identification"];
            for (let key in identificationData) {
                if (identificationData.hasOwnProperty(key)) {
                    var sql = knex('identification').insert(identificationData[key]).toString();
                    insertStatements.push(replaceColumNames(sql));
                    counter["identification"]++;
                }
            }

        });

        return insertStatements;
    }
}
module.exports = Formatting;
