import gpio4.GPIO as GPIO
import time
import wiringpi

GPIO.setmode(GPIO.BCM)

pin1 = 23
pin2 = 21

GPIO.setup([pin1, pin2], GPIO.IN)

while True:
    GPIO.input([pin1, pin2])
    time.sleep(1)
