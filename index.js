const FauxMo = require('fauxmojs');

let fauxMo = new FauxMo(
  {
    ipAddress: '192.168.1.203',
    devices: [
      {
        name: 'garage',
        port: 11000,
        handler: (action) => {
          console.log('garage action:', action);
        }
      },
    ]
  });

console.log('garage pi started..');
