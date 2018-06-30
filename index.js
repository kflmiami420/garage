const FauxMo = require('fauxmojs');
const Gpio = require('onoff').Gpio;
const relay = new Gpio(18, 'in', 'both');

relay.watch(function (err, value) {
  console.log('relay watch ', err, value);
});

function handleAlexa(action) {
  console.log('garage action:', action);
  const res = relay.writeSync(action);
  console.log('relay res ', res);
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
