const FauxMo = require('fauxmojs');
const Gpio = require('onoff').Gpio;
const relay = new Gpio(18, 'out');

relay.watch(function (err, value) {
  console.log('relay watch ', err, value);
});

function handleAlexa(action) {
  console.log('garage action:', action);
  switch(action) {
    case 'on': relay.writeSync(0); break;
    case 'off': relay.writeSync(1); break;
  }
}

let fauxMo = new FauxMo(
  {
    ipAddress: '192.168.1.203',
    devices: [
      {
        name: 'garage',
        port: 11000,
        handler: (action) => handleAlexa(action),
      },
    ]
  });

console.log('garage pi started..');
