# smart-garage

Control your garage using Alexa using Raspberry Pi.

## Live Demo

https://youtu.be/kkG1skNiGRY

## Required Hardwares

1) Raspberry Pi Zero W for about $5
2) Relay switch for about $10

## Install

```shell
npm i
```

## Setup Raspi Zero

```shell
ssh-copy-id pi@raspi_zero_ip
sudo apt-get update
sudo wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v.last.sh | bash
sudo curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get install yarn git vim nmap htop -y
git clone https://github.com/kienpham2000/garage.git

# Disable the ACT LED on the Pi Zero, edit file: /boot/config.txt
dtparam=act_led_trigger=none
dtparam=act_led_activelow=on
```
