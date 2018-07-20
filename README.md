
# Installation

## With a OneRNG on a raspberry pi with Raspbian

Install rasbian.

First, put a ssh file in the boot partition to activate ssh in headless mode

Then :

```bash
    ssh pi@<your-raspberry-pi-ip>
    sudo apt-get install git rng-tools python-gnupg at nodejs npm wget
    git clone https://github.com/ChickenRand/RNG.git
```


Get the lastest onerng version and then install it on the raspberry pi as follow

```bash
    # On the raspberry pi machine
    wget http://moonbaseotago.com/onerng/onerng_3.6-1_all.deb
    # Then on the raspberry
    sudo dpkg -i onerng_3.6-1_all.deb
    # Edit onerng conf to enable avalanche raw mode
    sudo nano /etc/onerng.conf
    # And change
    # ONERNG_MODE_COMMAND="cmd1" instead of ONERNG_MODE_COMMAND="cmd0"
```

Setup the systemd service

```bash
    cd RNG/
    sudo npm install -g
    sudo cp rng.service /etc/systemd/system/rng.service
    sudo systemctl enable rng
    sudo systemctl start rng
    sudo systemctl status rng -l
```
