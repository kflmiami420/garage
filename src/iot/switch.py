import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
pin = 21

GPIO.setup(pin,GPIO.IN,pull_up_down=GPIO.PUD_UP)

while True:
    val = GPIO.input(pin)
    print('val ', val)
    time.sleep(0.5)
