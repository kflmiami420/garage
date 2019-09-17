// must set high first: echo high > /sys/class/gpio/gpio21/direction

const gpio = require('wpi-gpio');

// gpio.BCM_GPIO = true;
const pin = 21;

gpio.input(pin).then(() => {
  // gpio.write(pin, 1).then(() => {
  //   console.log('write success')
  // });
});

setInterval(() => {
  gpio.read(pin).then(val => {
    // `val` is numeric value of GPIO pin 3
    console.log('pin val is ', val)
  });
}, 100);
