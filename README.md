# garage

Control garage using Alexa through raspi

## Live Demo

https://youtu.be/kkG1skNiGRY

## Setup Raspi Zero

```shell
ssh-copy-id pi@raspi_zero_ip
sudo apt-get update
sudo wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v.last.sh | bash
sudo curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get install yarn git vim -y
git clone https://github.com/kienpham2000/garage.git

# Disable the ACT LED on the Pi Zero, edit file: /boot/config.txt
dtparam=act_led_trigger=none
dtparam=act_led_activelow=on
```
