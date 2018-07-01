const FauxMo = require('fauxmojs');
const { format, createLogger, transports } = require('winston');
// TODO: make this work on macOS
const Gpio = require('onoff').Gpio;

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.cli(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console()
  ]
});

const relay = new Gpio(18, 'low', 'both', {debounceTimeout: 10, activeLow: true});

function handleAlexa(action) {
  logger.info(`garage action: ${action}`);

  const currVal = relay.readSync();
  logger.info(`relay.readSync(): ${currVal}, writting: ${currVal ^ 1}`);
  relay.writeSync(currVal ^ 1);

  const currVal = relay.readSync();
  logger.info(`relay.readSync(): ${currVal}, writting: ${currVal ^ 1}`);
  relay.writeSync(currVal ^ 1);

  // switch(action) {
  //   case 'on':
  //   case 'off': relay.writeSync(0); relay.writeSync(1); break;
  // }
}

wemoConfig = {
  devices: [
    {
      name: 'garage',
      port: 11000,
      handler: (action) => handleAlexa(action),
    },
  ]
}

new FauxMo(wemoConfig);
logger.info('garage-pi started..')

process.on('SIGINT', () => {
  relay.unexport();
});
