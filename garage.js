const FauxMo = require('fauxmojs');
const Gpio = require('onoff').Gpio;
const relay = new Gpio(18, 'out');

function handleAlexa(action) {
  console.log('garage action:', action);
  switch(action) {
    case 'on': relay.writeSync(0); break;
    case 'off': relay.writeSync(1); break;
  }
}

wemoConfig = {
  // ipAddress: '192.168.1.203',
  devices: [
    {
      name: 'garage',
      // port: 11000,
      handler: (action) => handleAlexa(action),
    },
  ]
}

new FauxMo(wemoConfig);
console.log('garage-pi started..');
