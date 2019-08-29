require('dotenv').config();
const AWS = require('aws-sdk');
AWS.config.update({region:process.env.AWS_SERVICE_REGION});
const iotdata = new AWS.IotData({endpoint: process.env.IOT_ENDPOINT});

const AlexaResponse = require("./response.js");

const DDB_TABLE_NAME = process.env.DDB_TABLE_NAME;
const ddb = new AWS.DynamoDB.DocumentClient();

let currentState = "UNLOCKED";
const clientId = process.env.IOT_CLIENT_ID;
const iotTopic = `${process.env.IOT_TOPIC_PREFIX}\\${clientId}`;

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
      friendlyName: "Garage Door",
      endpointId: clientId,
      capabilities: [capability_alexa, lock, health]
    });

    return adr.get();
}

async function handleLockController(event) {
  let requestedAction = event.directive.header.name.toUpperCase();
  if (requestedAction === "UNLOCK") requestedAction = "UNLOCKED";
  if (requestedAction === "LOCK") requestedAction = "LOCKED";
  if (requestedAction && requestedAction !== currentState) currentState = requestedAction;

  const endpointId = event.directive.endpoint.endpointId;
  const token = event.directive.endpoint.scope.token;
  const correlationToken = event.directive.header.correlationToken;

  const ar = new AlexaResponse({ correlationToken, token, endpointId });
  ar.addContextProperty({namespace: "Alexa.LockController", name: "lockState", value: currentState});

  await setDeviceState(endpointId, currentState);

  const params = {
    topic: iotTopic,
    payload: JSON.stringify({
      newState: currentState,
      deviceId: clientId
    }),
    qos: 0
  };

  const pubRes = await iotdata.publish(params).promise();
  console.log('pubRes ', pubRes);

  return ar.get();
}

async function handleReportState(event) {
    const endpointId = event.directive.endpoint.endpointId;
    const token = event.directive.endpoint.scope.token;
    const correlationToken = event.directive.header.correlationToken;

    const deviceState = await getDeviceState(endpointId);
    if (deviceState.Item && deviceState.Item.state)
      currentState = deviceState.Item.state;

    const ar = new AlexaResponse({ correlationToken, token, endpointId, name: "StateReport" });
    ar.addContextProperty({namespace: "Alexa.LockController", name: "lockState", value: currentState});

    return ar.get();
}

async function setDeviceState(endpointId, state) {
  const now = new Date().toISOString();
  const items = [
    {
      PutRequest: {
        Item: {
          id: endpointId,
          timestamp: "latest",
          state
        }
      }
    },
    {
      PutRequest: {
        Item: {
          id: endpointId,
          timestamp: now,
          state
        }
      }
    }
  ];
  const params = { RequestItems: { [DDB_TABLE_NAME]: items }};

  return ddb.batchWrite(params).promise();
}

async function getDeviceState(endpointId) {
  const params = {
    TableName : DDB_TABLE_NAME,
    Key: {
      id: endpointId,
      timestamp: "latest"
    }
  };

  const res = await ddb.get(params).promise();

  return res;
}
