
# Installation

## With a OneRNG on a raspberry pi with Raspbian

### Install rasbian

Follow instructions on [Raspberry site](https://www.raspberrypi.org/documentation/installation/installing-images/linux.md)

First, put a ssh file in the boot partition to activate ssh in headless mode as stated [here](https://www.raspberrypi.org/documentation/remote-access/ssh/)

### Install common packages and clone project

```bash
    ssh pi@<your-raspberry-pi-ip>
    sudo apt-get install git rng-tools python-gnupg at wget
    git clone https://github.com/ChickenRand/RNG.git
```

### Install Nodejs

Nodejs version that comes with recent Raspbian (2018-06-27) is very very old (v4.8.2), so we need to install it manually by picking the Node's ARM v6 build that can be found [here](https://nodejs.org/dist/).

Note : those instructions come from [here](http://raspberrypi.stackexchange.com/a/37976) and [here](http://raspberrypi.stackexchange.com/a/48313).

```bash
    # We use LTS version of node
    wget https://nodejs.org/dist/latest-v8.x/node-v8.11.3-linux-armv6l.tar.gz
    tar -xzf node-v8.11.3-linux-armv6l.tar.gz
    cd node-v8.11.3-linux-armv6l/
    sudo cp -R * /usr/local/
    sudo ln -s /usr/local/bin/node /usr/bin/node
    sudo ln -s /usr/local/bin/npm /usr/bin/npm
```

### Install OneRNG packages

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

### Setup and launch systemd service

At this step, you can plug in your OneRNG key to the raspberry pi.

Then, install globally the rng application and launch the systemd service.

If everything is OK, the rng service should start directly on startup, this way you have nothing to do and can leave your rasperry pi alone.

```bash
    cd RNG/
    sudo npm install -g
    sudo cp rng.service /etc/systemd/system/rng.service
    sudo systemctl enable rng
    sudo systemctl start rng
    sudo systemctl status rng -l
```
