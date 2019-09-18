import RPi.GPIO as GPIO
import time
import os
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTShadowClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

switchChannel = int(os.environ['SWITCH_CHANNEL'])
shadowName = os.environ['IOT_CLIENT_ID']
iotEndpoint = os.environ['IOT_ENDPOINT']

GPIO.setmode(GPIO.BCM)
currentState = ''
GPIO.setup(switchChannel, GPIO.IN, pull_up_down=GPIO.PUD_UP)

CERTS_PATH = Path.cwd().joinpath('src', 'iot', 'certs')
ROOT_CA = str(CERTS_PATH.joinpath("AmazonRootCA1.pem"))
PRIVATE_KEY = str(CERTS_PATH.joinpath("private.pem.key"))
CERT_FILE = str(CERTS_PATH.joinpath("certificate.pem.crt"))
SHADOW_HANDLER = "garage"

# Automatically called whenever the shadow is updated.
def myShadowUpdateCallback(payload, responseStatus, token):
  print('UPDATE: $aws/things/' + SHADOW_HANDLER +
    '/shadow/update/#')
  print("payload = " + payload)
  print("responseStatus = " + responseStatus)
  print("token = " + token)

shadowClient = AWSIoTMQTTShadowClient(shadowName)
shadowClient.configureEndpoint(iotEndpoint, 8883)
shadowClient.configureCredentials(ROOT_CA, PRIVATE_KEY, CERT_FILE)
shadowClient.configureConnectDisconnectTimeout(10)
shadowClient.configureMQTTOperationTimeout(5)
shadowClient.connect()

deviceShadow = shadowClient.createShadowHandlerWithName(SHADOW_HANDLER, True)

while True:
    switchVal = GPIO.input(switchChannel)
    if currentState != switchVal:
        currentState = switchVal
        if currentState == GPIO.HIGH:
            print('garage open')
        else:
            print('garage close')
        # deviceShadow.shadowUpdate('{"state":{"reported":{"door_X":"open"}}}', myShadowUpdateCallback, 5)

    time.sleep(0.5)
