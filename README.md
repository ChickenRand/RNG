
# Installation

## With a OneRNG on a raspberry pi with Raspbian

### Install rasbian

Follow instructions on [Raspberry site](https://www.raspberrypi.org/documentation/installation/installing-images/linux.md)

First, put a ssh file in the boot partition to activate ssh in headless mode as stated [here](https://www.raspberrypi.org/documentation/remote-access/ssh/)

### Install common packages and clone project

```bash
    ssh pi@<your-raspberry-pi-ip>
    sudo apt-get install git rng-tools python3-gnupg at wget openssl
    git clone https://github.com/ChickenRand/RNG.git
```

### Install Nodejs

Nodejs doesn't support ARMv6 architecture anymore, but there is unoffical build and the last available version is Node 20.19.0 (2025/03/13).

Note : Install instructions come from [here](http://raspberrypi.stackexchange.com/a/37976) and [here](http://raspberrypi.stackexchange.com/a/48313) hope they are still valid in 2025.

```bash
    # We use LTS version of node
    wget https://unofficial-builds.nodejs.org/download/release/v20.19.0/node-v20.19.0-linux-armv6l.tar.gz
    tar -xzf node-v20.19.0-linux-armv6l.tar.gz
    cd node-v20.19.0-linux-armv6l/
    sudo cp -R * /usr/local/
    sudo ln -s /usr/local/bin/node /usr/bin/node
    sudo ln -s /usr/local/bin/npm /usr/bin/npm
```

### Install OneRNG packages

OneRNG package is not updated anymore, I fixed the dependancies and store it in this repo.

```bash
    # Then on the raspberry
    wget https://github.com/OneRNG/onerng.github.io/blob/master/sw/onerng_3.7-1_all.deb?raw=true
    sudo dpkg -i onerng_3.7-1_all.deb
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
