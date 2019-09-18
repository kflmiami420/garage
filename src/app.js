require('dotenv').config();
const AlexaResponse = require("./response.js");
const AWS = require('aws-sdk');

// AWS.config.update({region:process.env.AWS_SERVICE_REGION});
const iotdata = new AWS.IotData({endpoint: process.env.IOT_ENDPOINT});

const clientId = process.env.IOT_CLIENT_ID;
const iotTopic = `${process.env.IOT_TOPIC_PREFIX}\\${clientId}`;
const iotThingName = process.env.IOT_THING_NAME;
const alexaDeviceName = process.env.ALEXA_DEVICE_NAME;
const stateLockMapping = {
  'open': 'UNLOCKED',
  'close': 'LOCKED',
  'lock': 'close',
  'unlock': 'open',
  'LOCKED': 'close',
  'UNLOCKED': 'open',
};

exports.handler = async function (event, context) {
  // console.log(JSON.stringify(event));
  const namespace = event.directive.header.namespace.toLowerCase();
  const directiveName = event.directive.header.name.toLowerCase();
  console.log(`namespace is ${namespace}  -  directive name: ${directiveName}`);

  switch(namespace) {
      case 'alexa.authorization': return handleAuth();
      case 'alexa.discovery': return handleDiscovery();
      case 'alexa.lockcontroller': return handleLockController(event);
      case 'alexa':
          if (directiveName === 'reportstate') return handleReportState(event);
      default: console.log('Unknown namespamce: ', namespace);
  }
};

function handleAuth() {
  const ar = new AlexaResponse({ namespace: "Alexa.Authorization", name: "AcceptGrant.Response"});

  return ar.get();
}

function handleDiscovery() {
    const adr = new AlexaResponse({namespace: "Alexa.Discovery", name: "Discover.Response"});
    const capability_alexa = adr.createPayloadEndpointCapability();

    const lock = adr.createPayloadEndpointCapability({
      interface: "Alexa.LockController",
      supported: [{name: "lockState"}],
      proactivelyReported: true,
      retrievable: true
    });

    const health = adr.createPayloadEndpointCapability({
      interface: "Alexa.EndpointHealth",
      supported: [{name: "connectivity"}],
      proactivelyReported: true,
      retrievable: true
    });

    adr.addPayloadEndpoint({
      friendlyName: alexaDeviceName,
      endpointId: clientId,
      capabilities: [capability_alexa, lock, health]
    });

    return adr.get();
}

async function handleLockController(event) {
  const requestedAction = event.directive.header.name.toLowerCase();
  const desiredState = stateLockMapping[requestedAction];
  const endpointId = event.directive.endpoint.endpointId;
  const token = event.directive.endpoint.scope.token;
  const correlationToken = event.directive.header.correlationToken;

  const updateRes = await iotdata.updateThingShadow({payload: {state: desiredState}, thingName}).promise();
  console.log('update thing res ', updateRes);

  const ar = new AlexaResponse({ correlationToken, token, endpointId });
  ar.addContextProperty({namespace: "Alexa.LockController", name: "lockState", value: desiredState});

  // const params = {
  //   topic: iotTopic,
  //   payload: JSON.stringify({
  //     newState: desiredState,
  //     deviceId: clientId
  //   }),
  //   qos: 0
  // };

  // await iotdata.publish(params).promise();

  return ar.get();
}

async function handleReportState(event) {
    const endpointId = event.directive.endpoint.endpointId;
    const token = event.directive.endpoint.scope.token;
    const correlationToken = event.directive.header.correlationToken;

    const deviceState = await getDeviceShadowState(iotThingName);

    const ar = new AlexaResponse({ correlationToken, token, endpointId, name: "StateReport" });
    ar.addContextProperty({namespace: "Alexa.LockController", name: "lockState", value: stateLockMapping[deviceState]});

    return ar.get();
}

async function getDeviceShadowState(thingName) {
  let shadowState = await iotdata.getThingShadow({thingName}).promise();
  shadowState = JSON.parse(shadowState.payload);

  return shadowState.state.reported.status; // open | close
}
