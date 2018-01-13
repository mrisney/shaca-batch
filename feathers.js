const knex = require('knex');
const service = require('feathers-knex');
const express = require('express');
const app = express()

const db = knex({
  client: 'oracledb',
  connection: {
            user: "shaca_admin",
            password: "shaca_admin",
            connectString: "db4"
  }
});

// Create the schema
db.schema.createTable('hpd_mvar', table => {
  table.increments('id');
  table.string('text');
  table.boolean('processed');
});

app.use('/hpd_mvar', service({
  Model: db,
  name: 'messages'
}));
app.use('/messages', service({ Model, name, id, events, paginate }));




app.listen(3000, () => console.log('Example app listening on port 3000!'))