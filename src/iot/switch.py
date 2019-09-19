import RPi.GPIO as GPIO
import time
import os
import json
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTShadowClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

load_dotenv()

switchChannel = int(os.environ['SWITCH_CHANNEL'])
shadowName = os.environ['IOT_CLIENT_ID']
iotEndpoint = os.environ['IOT_ENDPOINT']
iotTopicPrefix = os.environ['IOT_TOPIC_PREFIX']
iotThingName = os.environ['IOT_THING_NAME']
iotTopic = "{}\{}".format(iotTopicPrefix, iotThingName)

GPIO.setmode(GPIO.BCM)
GPIO.setup(switchChannel, GPIO.IN, pull_up_down=GPIO.PUD_UP)

CERTS_PATH = Path.cwd().joinpath('src', 'iot', 'certs')
ROOT_CA = str(CERTS_PATH.joinpath("AmazonRootCA1.pem"))
PRIVATE_KEY = str(CERTS_PATH.joinpath("private.pem.key"))
CERT_FILE = str(CERTS_PATH.joinpath("certificate.pem.crt"))

shadowClient = AWSIoTMQTTShadowClient(shadowName)
shadowClient.configureEndpoint(iotEndpoint, 8883)
shadowClient.configureCredentials(ROOT_CA, PRIVATE_KEY, CERT_FILE)
shadowClient.configureConnectDisconnectTimeout(10)
shadowClient.configureMQTTOperationTimeout(5)
shadowClient.connect()
lockStateMapping = {}
lockStateMapping[GPIO.HIGH] = "unlocked"
lockStateMapping[GPIO.LOW] = "locked"
deviceShadow = shadowClient.createShadowHandlerWithName(iotTopicPrefix, True)

mqttClient = shadowClient.getMQTTConnection()
iotTopic = "$aws/things/smart-garage/shadow/update"
# iotTopic = "$aws/things/smart-garage/shadow/update/accepted"

def handleDesiredStateChange(payload, status, token):
  print("handleDesiredStateChange", payload, status, token)

def handleShadowUpdateCallback(payload, responseStatus, token):
  print("shadow update status: {}, payload: {}".format(responseStatus, payload))
  if (responseStatus != "accepted"):
    print("problem with shadow update")

def run():
  currentState = ''
  shadowPayload = {
    "state": {
      "reported": {
        "status": "",
        "iot_id": shadowName
      }
    }
  }
  mqttClient.subscribe(iotTopic, 1, handleDesiredStateChange)

  while True:
    switchChannelVal = GPIO.input(switchChannel)
    if currentState != switchChannelVal:
      shadowPayload["state"]["reported"]["status"] = lockStateMapping[switchChannelVal]

      try:
        deviceShadow.shadowUpdate(json.dumps(shadowPayload), handleShadowUpdateCallback, 5)
        currentState = switchChannelVal
        print("switch channel val: {}, state: {}".format(currentState, lockStateMapping[switchChannelVal]))
      except Exception as e:
        print('Problem updating shadow state', e)

    time.sleep(1)

if __name__ == "__main__":
  run()
