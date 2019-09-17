import RPi.GPIO as GPIO
import time

# use P1 header pin numbering convention
GPIO.setmode(GPIO.BOARD)

# Set up the GPIO channels - one input and one output
pin1 = 23
pin2 = 21

GPIO.setup(pin1, GPIO.IN)
GPIO.setup(pin2, GPIO.IN)

# Input from pin 11
while True:
    pin1_val = GPIO.input(pin1)
    pin2_val = GPIO.input(pin2)
    console.log(pin1_val, pin2_val)
    time.sleep(1)

# Output to pin 12
# GPIO.output(12, GPIO.HIGH)

# The same script as above but using BCM GPIO 00..nn numbers
# GPIO.setmode(GPIO.BCM)
# GPIO.setup(17, GPIO.IN)
# GPIO.setup(18, GPIO.OUT)
# input_value = GPIO.input(17)
# GPIO.output(18, GPIO.HIGH)
