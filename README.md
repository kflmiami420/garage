# smart-garage

Control your garage using Alexa using Raspberry Pi.

## Live Demo

https://youtu.be/kkG1skNiGRY

## Required Hardwares

1) Raspberry Pi Zero W for about $5
2) Relay switch for about $10

## How does this work?

User talk to Alexa: Alexa, lock the garage. This will trigger a smart home lock skill that trigger a lambda. This Lambda will publish its desired state to AWS IoT to update device and shadow state. The raspi is also subscribe to the same IoT topic, it will trigger its GPIO pin which open / close the garage.

## Install

```shell
npm i
```

## Setup Raspi Zero

```shell
ssh-copy-id pi@raspi_zero_ip
sudo apt-get update
sudo wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v.last.sh | bash
sudo apt-get install yarn git vim htop python3-pip -y
git clone https://github.com/kienpham2000/garage.git

# Disable the ACT LED on the Pi Zero, edit file: /boot/config.txt
dtparam=act_led_trigger=none
dtparam=act_led_activelow=on
```
