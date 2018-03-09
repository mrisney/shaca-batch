var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Spillman KPD Batch Process',
  description: 'Nightly Spillman KPD Batch process, queries and inserts data from REST Service at 4:15 PST.',
  script: 'D:\\projects\\shaca\\shaca-batch\\spillman-query-service.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();