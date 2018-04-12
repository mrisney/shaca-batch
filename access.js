'use strict';

const _ = require('lodash');
const knex = require('knex')({
    client: 'oracle',
    wrapIdentifier: function (value) {
        return (value !== '*' ? '' + value.replace(/"/g, '') + '' : '*')
    }
});

const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\\test.accdb;');

async function query() {
  try {

   const incidents = await connection.query('SELECT * FROM [DOT-1-1-17A]');

  let objectKeysToLowerCase = function (incidents) {
      return Object.keys(origObj).reduce(function (newObj, key) {
          let val = origObj[key];
          let newVal = (typeof val === 'object') ? objectKeysToLowerCase(val) : val;
          newObj[key.toLowerCase()] = newVal;
          return newObj;
      }, {});
    }

    console.log(JSON.stringify(incidents, null, 2));
  } catch (error) {
    console.error(error);

  }
}

query();
