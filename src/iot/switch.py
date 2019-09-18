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

GPIO.setmode(GPIO.BCM)
currentState = ''
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

deviceShadow = shadowClient.createShadowHandlerWithName(iotTopicPrefix, True)

def shadowUpdateCallback(payload, responseStatus, token):
  print("shadow update status: {}, payload: {}".format(responseStatus, payload))
  if (responseStatus != "accepted"):
    print("problem with shadow update")

while True:
  shadowPayload = {
    "iot_id": shadowName, # for DDB v2 to save as primary hash
    "datetime": datetime.now().isoformat(),
    "state": {
        "reported": {
            "status": "",
            "iot_id": shadowName
        }
    }
  }
  switchVal = GPIO.input(switchChannel)
  if currentState != switchVal:
    currentState = switchVal
    if currentState == GPIO.HIGH:
      print('garage open')
      shadowPayload["state"]["reported"]["status"] = "open"
    else:
      shadowPayload["state"]["reported"]["status"] = "close"
      print('garage close')

    try:
      deviceShadow.shadowUpdate(json.dumps(shadowPayload), shadowUpdateCallback, 5)
    except Exception as e:
      print('Problem updating shadow state', e)

  time.sleep(0.5)
