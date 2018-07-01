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

const relay = new Gpio(18, 'out');

function handleAlexa(action) {
  logger.info(`garage action: ${action}`);

  switch(action) {
    case 'on':
      relay.write(0, () => {
        relay.writeSync(1);
      });
      break;
    case 'off':
      relay.write(1, () => {
        relay.writeSync(0);
      });
      break;
  }
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
