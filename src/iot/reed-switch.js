const { Gpio } = require('onoff');

const reedSwitchPin = 21;

reed = new Gpio(reedSwitchPin, 'in');

reed.watch((err, value) => {
  console.log('value is ', value);
});

process.on('SIGINT', () => {
  reed.unexport();
});
