var oracledb = require('oracledb');

function normalizeObject(obj) {
    return Object.keys(obj).reduce((result, currKey) => {
        result[currKey.toLocaleLowerCase()] = obj[currKey]
        return result
    }, {})
}

class Database {
    connect() {

        var config = {
            user: "hpd_stage",
            password: "hpd_stage",
            connectString: "db4"
        };

        oracledb.autoCommit = true
        oracledb.outFormat = oracledb.OBJECT

        return new Promise((resolve, reject) => {
            oracledb.getConnection(config)
                .then(conn => {
                    this._connection = conn
                    resolve('connected to oracledb!')
                })
                .catch(err => reject(Error('failed to connect to oracledb : ' + err)))
        })
    }

    execute(query, bindings = {}, options = {}) {
        return this._connection.execute(query, bindings)
            .then(
                result => {
                    if (result.rows) {
                        return result.rows.map(normalizeObject)
                    } else {
                        return result
                    }
                },
                err => {
                    if (options.throwBack) {
                        throw (err)
                    }
                }
            )
    }
}

const db = new Database()

module.exports = db;
