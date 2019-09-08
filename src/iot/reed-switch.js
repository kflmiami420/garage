const { Gpio } = require('onoff');

const reedSwitchPin = 23;

reed = new Gpio(reedSwitchPin, 'in', 'both');

reed.watch((err, value) => {
  console.log('value is ', value);
});

process.on('SIGINT', () => {
  reed.unexport();
});
