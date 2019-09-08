const { Gpio } = require('onoff');

const reedSwitchPin = 23;

reed = new Gpio(reedSwitchPin, 'in', 'both');
reed2 = new Gpio(24, 'in', 'both');

reed.watch((err, value) => {
  console.log('reed1 value is ', value);
});

reed2.watch((err, value) => {
  console.log('reed2 value is ', value);
});

process.on('SIGINT', () => {
  reed.unexport();
  reed2.unexport();
});
