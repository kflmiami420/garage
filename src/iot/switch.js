// must set high first: echo high > /sys/class/gpio/gpio21/direction
const gpio = require("gpio");
let pin;

pin = gpio.export(23, {
  // When you export a pin, the default direction is out. This allows you to set
  // the pin value to either LOW or HIGH (3.3V) from your program.
  direction: gpio.DIRECTION.IN,

  // set the time interval (ms) between each read when watching for value changes
  // note: this is default to 100, setting value too low will cause high CPU usage
  interval: 200,

  // Due to the asynchronous nature of exporting a header, you may not be able to
  // read or write to the header right away. Place your logic in this ready
  // function to guarantee everything will get fired properly
  ready: function() {
    console.log('ready now...')

    pin.on("change", function(val) {
      // value will report either 1 or 0 (number) when the value changes
      console.log("on change ", val)
    });

    // setInterval(() => {
    //   gpio.read(pin).then(val => {
    //     // `val` is numeric value of GPIO pin 3
    //     console.log('pin val is ', val)
    //   });
    // }, 1000);

  }
});


