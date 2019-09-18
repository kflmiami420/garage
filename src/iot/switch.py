import RPi.GPIO as GPIO
import time
import os
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTShadowClient
from dotenv import load_dotenv

load_dotenv()

switchChannel = int(os.environ['SWITCH_CHANNEL'])
shadowName = os.environ['IOT_CLIENT_ID']
iotEndpoint = os.environ['IOT_ENDPOINT']

GPIO.setmode(GPIO.BCM)
currentState = ''
GPIO.setup(switchChannel, GPIO.IN, pull_up_down=GPIO.PUD_UP)

ROOT_CA = "certs/AmazonRootCA1.pem"
PRIVATE_KEY = "private.pem.key"
CERT_FILE = "certificate.pem.crt"
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
    val = GPIO.input(pin)
    if currentState != val:
        currentState = val
        if currentState == GPIO.HIGH:
            print('garage open')
        else:
            print('garage close')
        # deviceShadow.shadowUpdate('{"state":{"reported":{"door_X":"open"}}}', myShadowUpdateCallback, 5)

    time.sleep(0.5)
