const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const auth = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const jwt = require('@feathersjs/authentication-jwt');
const memory = require('feathers-memory')

const service = require('feathers-knex');
const knex = require('knex');
const cors=require('cors');

const db = knex({
    client: 'oracledb',
    connection: {
        user: "shaca_admin",
        password: "shaca_admin",
        connectString: "db4"
    }
});

// Create a feathers instance.
const app = express(feathers());
// Turn on JSON parser for REST services
app.use(express.json());




app.use(cors({origin:true,credentials: true}));


// Turn on URL-encoded parser for REST services
app.use(express.urlencoded({
    extended: true
}));
// Enable REST services
app.configure(express.rest())
	.configure(auth({ secret: 'supersecret' }))
 	.configure(local())
 	.configure(jwt())
 	.use('/users', memory())
 	.use(express.errorHandler());

// Enable Socket.io services
app.configure(socketio());
// Create Knex Feathers service with a default page size of 5 items
// and a maximum size of 10
app.use('/hpdmvars', service({
    Model: db,
    name: 'hpdmvars',
    paginate: {
        default: 5,
        max: 10
    }
}))
app.use(express.errorHandler());

// Clean up our data. This is optional and is here
// because of our integration tests
db.schema.dropTableIfExists('hpdmvars').then(() => {
    console.log('Dropped hpdmvars table');

    // Initialize your table
    return db.schema.createTable('hpdmvars', table => {
        console.log('Creating hpdmvars table');
        table.increments('id');
        table.string('summary');
        table.string('metadata');
        table.string('filename');
        table.boolean('process');
        table.string('state');
        table.timestamp('last_modified');
    });
}).then(() => {
    // Create a HPD_MVAR Incident
    app.service('hpdmvars').create({
        summary: 'MVAR 14351',
        metadata: 'hpdmvar created on server',
        filename: 'HpdMvcFiles-2017-12-19.zip',
        process: true,
        state: 'success'


    }).then(incident => console.log('hpdmvars process entry added', incident));
});

const port = 3030;

app.listen(port, () => {
    console.log('feathers server listening on port ${port}');
});
