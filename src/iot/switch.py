import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
pin = 21
currentState = GPIO.LOW

GPIO.setup(pin, GPIO.IN, initial=currentState, pull_up_down=GPIO.PUD_UP)

while True:
    val = GPIO.input(pin)
    if currentState != val:
        currentState = val
        print('val ', val)
    time.sleep(0.5)
