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

const relay = new Gpio(18, 'high');

function handleAlexa(action) {
  logger.info(`garage action: ${action}`);

  switch(action) {
    case 'on':
      relay.write(0, () => setTimeout(() => relay.writeSync(1), 500));
      break;
    case 'off':
      relay.write(1, () => setTimeout(() => relay.writeSync(0), 500));
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
