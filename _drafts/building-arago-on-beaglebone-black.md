
# General outline of what's needed

TI maintains its own Yocto reference distribution called "Arago" (instead of Poky) which can be used to build a custom image for the BBB. This simplifies the process considerably for getting an image up and running on the board, however, the base image will still be missing a few important details for making this project work. Extra configuration is necessary to get the LCD display to work.

These extra steps include:
- customizing the linux build configuration
- overlaying the device tree with the LCD cape

The steps below outline the process I followed to achieve this, from cloning the repo all the way through to flashing the image onto an SD card and then booting from it.

Note: I am using version 09.01.00.00 of the Arago reference distribution.


# Customizing kernel Configuration

https://e2e.ti.com/support/processors-group/processors/f/processors-forum/1108928/am625-how-to-create-a-custom-defconfig-under-yocto-compilation/4113982#4113982




######################





BBB_BOOT_DIR="/media/$(whoami)/BOOT"
BBB_ROOT_DIR="/media/$(whoami)/ROOT"


# Add files to the boot and root directories

## Boot

sudo cp MLO $BBB_BOOT_DIR
sudo cp u-boot.img $BBB_BOOT_DIR
sudo cp zImage $BBB_ROOT_DIR
sudo cp am335x-boneblack.dtb $BBB_ROOT_DIR

## Root

sudo tar -xf core-image-minimal-am335x-evm-20250610021848.rootfs.tar.xz -C $BBB_ROOT_DIR





# Booting with the SD Card

When booting from the SD card, u-boot should be automatically loaded and executed. Press a key to stop the automatic boot sequence and then enter the following commands on the u-boot command line:

```
setenv bootargs "earlyprintk console=ttyO0,115200n8 root=/dev/mmcblk0p2 rootwait ro rootfstype=ext4"
fatload mmc 0:1 0x80008000 zimage
fatload mmc 0:1 0x81000000 merged-boneblack.dtb
fatload mmc 0:1 0x81000000 am335x-boneblack.dtb
fatload mmc 0:1 0x81000000 am335x-boneblack-uboot-univ.dtb
fatload mmc 0:1 0x81f00000 overlays/BB-BONE-4D4R-01-00A1.dtbo
fdt addr 0x81000000
fdt resize 8192
fdt apply 0x81f00000
bootz 0x80008000 - 0x81000000
```

```
setenv fdtaddr 
