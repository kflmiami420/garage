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
relayChannel = int(os.environ['RELAY_CHANNEL'])
shadowName = os.environ['IOT_CLIENT_ID']
iotEndpoint = os.environ['IOT_ENDPOINT']
iotThingName = os.environ['IOT_THING_NAME']
GPIO.setmode(GPIO.BCM)
GPIO.setup(switchChannel, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(relayChannel, GPIO.OUT)
# p = GPIO.PWM(relayChannel, 0.5)
# p.start(1)

certsPath = Path.cwd().joinpath('src', 'iot', 'certs')
rootCA = str(certsPath.joinpath("AmazonRootCA1.pem"))
privateKey = str(certsPath.joinpath("private.pem.key"))
certFile = str(certsPath.joinpath("certificate.pem.crt"))

class IoTConn:
  def __init__(self, thingName, iotEndpoint, rootCA, privateKey, certFile):
    self.rootCA = rootCA
    self.privateKey = privateKey
    self.certFile = certFile
    self.iotEndpoint = iotEndpoint
    self.thingName = thingName
    self.shadowClient = AWSIoTMQTTShadowClient(self.thingName)

  def connect(self):
    self.shadowClient.configureEndpoint(iotEndpoint, 8883)
    self.shadowClient.configureCredentials(self.rootCA, self.privateKey, self.certFile)
    self.shadowClient.configureConnectDisconnectTimeout(10)
    self.shadowClient.configureMQTTOperationTimeout(5)
    self.shadowClient.connect()

  def getShadowClient(self):
    return self.shadowClient

  def getDeviceShadow(self):
    self.deviceShadow = self.shadowClient.createShadowHandlerWithName(self.thingName, True)

    return self.deviceShadow

  def getMQTT(self):
    return self.shadowClient.getMQTTConnection()


class Garage:
  def __init__(self, conn, name, switchChannel, relayChannel):
    self.previousRealState = ''
    self.currentRealState = ''
    self.name = name
    self.switchChannel = switchChannel
    self.relayChannel = relayChannel
    self.lockStateMapping = {}
    self.lockStateMapping[GPIO.HIGH] = "unlocked"
    self.lockStateMapping[GPIO.LOW] = "locked"
    self.conn = conn
    self.conn.connect()
    self.mqtt = self.conn.getMQTT()
    self.shadow = self.conn.getDeviceShadow()

  def lock(self):
    print('locking...')
    # p = GPIO.PWM(self.relayChannel, 0.5)
    # p.start(1)
    GPIO.output(self.relayChannel, not GPIO.input(relayChannel))

  def unlock(self):
    print('unlocking...')
    # p = GPIO.PWM(self.relayChannel, 0.5)
    # p.start(1)
    GPIO.output(self.relayChannel, GPIO.LOW)

  def onShadowDelta(self, payload, responseStatus, token):
    payload = json.loads(payload)
    desiredState = payload["state"]["status"]
    print("shadow delta: new desired state: {}".format(desiredState))
    if desiredState == 'locked': self.lock()
    elif desiredState == 'unlocked': self.unlock()

  def onShadowUpdate(self, payload, responseStatus, token):
    # print("shadow update status: {}, payload: {}".format(responseStatus, payload))
    if (responseStatus != "accepted"):
      print("Problem with shadow update: {}".format(responseStatus))

  def onShadowGet(self, payload, responseStatus, token):
    payload = json.loads(payload)
    if "reported" in payload and "status" in payload["reported"]:
      self.previousRealState = payload["reported"]["status"]

  def getShadowState(self):
    self.shadow.shadowGet(self.onShadowGet, 5)

  def updateShadow(self, desiredState):
    payload = {
      "state": {
        "reported": {
          "status": desiredState,
          "iot_id": shadowName
        }
      }
    }
    self.shadow.shadowUpdate(json.dumps(payload), self.onShadowUpdate, 5)

  def init(self):
    self.getShadowState()
    self.currentRealState = self.lockStateMapping[GPIO.input(self.switchChannel)]
    if self.currentRealState != self.previousRealState:
      print("init: sync state: {}".format(self.currentRealState))
      self.updateShadow(self.currentRealState)

  def monitor(self):
    print('monitoring for new state')
    self.shadow.shadowRegisterDeltaCallback(self.onShadowDelta)

    while True:
      self.currentRealState = self.lockStateMapping[GPIO.input(switchChannel)]
      if self.currentRealState != self.previousRealState:
        try:
          self.updateShadow(self.currentRealState)
          print("switch channel current state: {}, previous state: {}".format(self.currentRealState, self.previousRealState))
          self.previousRealState = self.currentRealState
        except Exception as e:
          print("Problem updating shadow state", e)
      time.sleep(1)

if __name__ == "__main__":
  conn = IoTConn(thingName=iotThingName, iotEndpoint=iotEndpoint, rootCA=rootCA, privateKey=privateKey, certFile=certFile)
  garage = Garage(conn=conn, name=shadowName, switchChannel=switchChannel, relayChannel=relayChannel)
  garage.init()
  garage.monitor()
