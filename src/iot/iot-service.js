require('dotenv').config();
const awsIot = require('aws-iot-device-sdk');
const path = require('path');
const { format, createLogger, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const Gpio = require('onoff').Gpio;
const os = require('os');

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.cli(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new WinstonCloudWatch({
      awsRegion: 'us-east-1',
      logGroupName: 'smart-garage',
      logStreamName: `garage-${Math.floor(new Date() / 1000)}`
    })
  ]
});

const gpioPin = process.env.GPIO_PIN;
const certsRootPath = path.join(process.cwd(), 'src', 'iot', 'certs');
const CERT_NAME = 'certificate.pem.crt';
const PRIVATE_KEY_NAME = 'private.pem.key';
const ROOT_CERT_NAME = 'AmazonRootCA1.pem';
const certPath = path.join(certsRootPath, CERT_NAME);
const keyPath = path.join(certsRootPath, PRIVATE_KEY_NAME);
const caPath = path.join(certsRootPath, ROOT_CERT_NAME);
const clientId = process.env.IOT_CLIENT_ID;
const iotTopic = `${process.env.IOT_TOPIC_PREFIX}\\${clientId}`;
const host = process.env.IOT_ENDPOINT;
const shadowName = 'smart-garage';

const shadow = awsIot.thingShadow({ keyPath, certPath, caPath, clientId: shadowName, host });
const device = awsIot.device({ keyPath, certPath, caPath, clientId, host });
let currentDeviceState = 'UNLOCKED';
const validDeviceStates = ['LOCKED', 'UNLOCKED', 'JAMMED'];

let relay;
if (os.platform() === 'linux')
  relay = new Gpio(gpioPin, 'high');

shadow.on('connect', () => {
  shadow.register(shadowName, {}, () => {
    const desiredState = {"state": {"desired": {state: currentDeviceState}}};
    const stateUpdatedStatus = shadow.update(shadowName, desiredState);
    logger.info(`Shadow connected, state update status ${stateUpdatedStatus}`);
  });
});

shadow.on('status', (thingName, stat, clientToken, stateObject) => {
  logger.info('received '+stat+' on '+thingName+': '+ JSON.stringify(stateObject) + ' ' + clientToken);
});

shadow.on('delta', (thingName, stateObject) => {
  logger.info('received delta on '+thingName+': '+ JSON.stringify(stateObject));
});

shadow.on('timeout', (thingName, clientToken) => {
  logger.error('received timeout on '+thingName+ ' with token: '+ clientToken);
});

device.on('connect', () => {
    logger.info(`Device connected, subscribing to topic ${iotTopic}`);
    device.subscribe(iotTopic);
  });

device.on('message', (_, payload) => handleStateUpdate(payload));

function handleStateUpdate(payload) {
  try {
    const message = JSON.parse(payload);
    if (!message.newState) {
      logger.error(`Invalid JSON payload. Missing newState key: ${JSON.stringify(message)}`);
      return;
    }

    const newState = message.newState.toUpperCase();
    logger.info(`Requested to change state. Current: ${currentDeviceState} New: ${newState}`);
    if (message.deviceId === clientId && validDeviceStates.includes(newState) && currentDeviceState !== newState) {
      currentDeviceState = newState;
      if (os.platform() === 'linux')
        relay.write(0, () => setTimeout(() => relay.writeSync(1), 500));
    }
  } catch (e) {
    logger.error('Invalid JSON received over topic', e);
  }
}
