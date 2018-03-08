var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'SHACA HPD Batch Process',
  description: 'Nightly SHACA Batch process, uploads mvar data at 4:30 PST.',
  script: 'D:\\projects\\shaca\\shaca-batch\\nightly-file-process.js',
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