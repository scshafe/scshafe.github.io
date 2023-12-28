---
layout: post
title: "Device Model and System Topology"
date: 2023-11-30 13:00:00 -0700
categories: device-tree driver sys
---
Note: this article is still in progress.

In this post, I hope to give an overview of how to interpret a Linux system's peripheral topology.  This post is inspired by my own initial struggles to understand how all of this works when I first encountered the concept of the Linux **Device-model** while trying to learn the basics of driver writing.

As I tried to make sense of this topic, I went down many rabbit holes that approached understanding the topology of a Linux system from different angles.  I'll aim to trace my own path and highlight how these topics led from one to another, and how they fit into the big picture of the peripheral topology.  I'll also try to explain each topic at a high-level, but will by no means explore any item exhaustively.

<!-- It's important to understand that all 3 of the above items (`/sys`, `lspci`, and the device-model) are different things, but they are all related to a Linux system's topology.

Linux's device-model and system topology work in order to better understand how Linux manages peripheral hardware.  Coming from a software development background with not a lot of experience or knowledge of hardware beyond the most basic CPU/memory model of typical computing, I found learning the basics to be at times excrutiating work.  Sometimes, very basic principles eluded me.  The sorts of things which are taken for granted beyond any introductory courses in circuits or hardware.  Other times, I simply couldn't make sense of terminology or wasn't clued in on what terms I should be looking into.

My hope with this post is two-fold: in some places, I plan to dive deep, using my own system as an example, to highlight some details that gave me "a-ha" moments.  In other areas, I'll aim to outline the big picture and some of the elementary insights that are often left out of more sophisticated explanations. -->

For the purposes of this post, I'll be analyzing output of a Beaglebone as well as my own system, running Kubuntu 22 on an AMD Ryzen cpu with the X570 chipset.  Additionally, I will assume conceptual knowledge just of the basics for how a driver works.  If the basics are new, I'd suggest having a look at the book "Linux Device Drivers" - it was a valuable resource for me.

# Roadmap

Topology overview

the device-tree vs ACPI

the root complex

basic PCIe principles

# Terminology



# System Topology

The overall topology of a Linux system can be found in the `/sys` directory.  In this directory, the kernel exposes information about all the hardware components in a system, from modules within the CPU itself to all the peripherals attached to buses like PCI or USB.  

The **device-model** is Linux's conceptual name for its internal organization of logical devices.  Even though the underlying structure of the peripherals in a system is inherently tree-like (with the root of the tree being closest to the CPU), the device-model is commonly described as a giant web because a number of the directories within `/sys` are not representative of the tree-like structure of _actual_ devices, but are _organizational_ directories, in the sense that they will contain references (in the form of symbolic links) to all the devices that fit whatever criteria that directory describes.  For example, the `/sys/bus` directory will have directories for each bus in the system, and have symbolic links to the corresponding directory in `/sys/devices/...`.  Another example, in driver development, you can create a class of driver, such as gpio.  The `/sys/class/gpio` directory will then have a directory linking to each gpio device in `/sys/devices/...` wherever that gpio device exists in the overall directory.

The `/sys/devices/` directory is the primary directory that describes the _actual_ layout of peripheral devices, and contains the entries that are _linked to_ from other directires like `/sys/bus` and `/sys/class`.  The key aspect to regard all things within this directory, is the notion that each device has a parent device which also happens to be represented by the parent directory.  The highest level devices are ones that are exposed directly to the CPU by the architecture of the system.  One common device at this level is a root complex which is the root for a PCI/PCIe hierarchy that will connect a tree of buses and peripheral devices (this will be the focus of analyzing peripherals in this post).

## Quick break from goal towards analyzing system topology

Before carrying on in the process of making sense of the topology of the system, I want to address 2 relavant ideas that will make analyzing the system more compelling.

# The Device-Tree vs ACPI

The first is in understanding the device-tree and ACPI.  These are 2 common approaches for the same thing: discovering the system topology for the devices that are a part of the system's underlying hardware itself.  This is in contrast to devices which are plugged into a computer's hardware ports, like USB ports or audio jacks or even PCI ports on the motherboard itself.  One way to think of this is as outlining a system's not-hot-pluggable devices, although the simplification isn't totally accurate because not all devices which are plugged in (such as PCI) are actually hot-pluggable.

The two common approaches for discovering these devices and logically organizing the system are by using a device-tree or ACPI.  ACPI is the approach used by x86 systems, and involves kernel code querying the motherboard's firmware to find out what the hardware layout is each time the system boots.

The device-tree is the approach used by ARM systems and involves manually writing a device tree file (commonly using a .dtb file-extension "device-tree-binary", or using a .dts file extension for the human-readable version).  This file contains only data describing the particular system it is written for, and is read by the kernel at start-up.

Whether ACPI or the device-tree is used, the result will ultimately be the same: all baked-in peripheral devices will be organized into a tree-like hierarchy where the top of the tree indicates a closer logical distance to the CPU.

This is the tree which resides in the `/sys/devices/` directory.


# Device-Model

This, to be clear is separate from the **device-model** which is commonly described as a giant web.  The **device-model** is the framework that Linux uses to register devices internally, and so all the logical devices which represent physical devices indicated in the device-tree, as they are initialized, will be added into the overall web that is the device-model.  This usually entails being added into the `/sys` directory in 2 ways.  First, it will have its entry added into the `/sys/devices` hierarchy as a sub-directory of its parent.  For instance, PCI devices' parents will be the device representing the PCI bus that the PCI device resides on.  Second, it will have its entry added into whatever organizational directories it matches, and links from the organizational sub-directory will point to its `/sys/devices` directory.

The underlying implementation of this device-model framework is primarily composed of **kobject**s which are struct that are members of **struct device**s which kernel modules initialize while they are being set up.  The `/sys` directory itself is not actually a file system in the same way that your `/home` file system is a collection of directories and files (supported by inodes), but is a virtual filesystem that is intended to offer file-system interface to this web of kobjects.


# PCI

At this point, I turn my sights towards PCI, because after I got a taste of how the device-model worked, I wanted to get a sense for how my own system was mapping my peripherals.  On my system, as well as most x86 PC's, the back-bone of the peripheral topology is likely to be a PCIe hierarchy.  

# Basics - PCI addressing

The very first thing to be understood about the device tree is the system for numbering each device on the tree.  The notation for a devices ID is provided by the Bus:Device.Function (BDF) notation.  An example: 

```
$: lspci
...
03:00.1 Audio device: Advanced Micro Devices, Inc. [AMD/ATI] Navi 21 HDMI Audio [Radeon RX 6800/6800 XT / 6900 XT]
...
```

The Bus number is 03, the device number is 00 (numbering of all buses, devices, and functions begins at 0), and the function number is 1. 

A PCI system supports up to 256 buses, 32 devices to each bus, and 8 functions to each device.  Functions are essentially different addresses at each device that the hardware device can make available for different functionalities.  While the world is moving away from PCI in favor of its successor PCIe, and PCIe can make available a greater number of buses, the basics are the same.  In fact, PCIe was designed to be compatitble with PCI.

# Basics - PCI bus structure

A PCI bus may up to 32 different devices plugged into.  The traffic on the bus, meaning the determination of which device can utilize the bus to send data, is overseen by the **PCI Bus Controller**.  While the controller can be seen as a facilitator amongst the devices on that shared channel, it also resides on the bus upstream of it - upstream refers to being closer to the CPU - and so it may also be referred to as a bridge.  The PCI Bus Controller/Bridge for the lower bus will itself appear as a device on the upstream bus, and will need to adhere to the upstream Bus controller's traffic facilitation.  The parent bus may be another PCI bus (meaning the PCI buses are nested), or it may be another type of bridge.

the diagram in this ![link highlights](https://docs.oracle.com/cd/E19455-01/805-7378/hwovr-22/index.html) how these buses can be nested.  Note that the PCI Bus bridge in the middle is assigned a device number on Bus 0, while device numbers on the Bus 1 which it controls will be assigned from a new pool of device numbers.



# PCIe differences

While PCI uses parallel buses which must be shared by all the devices on that bus, PCIe uses point-to-point serial communication, and can offer multiple channels for doing so.  What this enables is for different devices to communicate via different channels on that bus at the same time, because each device will only receive data when it is the intended target of that communication.  This is made practical by newer technology that offers higher communication speeds via an increased clock rate.  From a software perspective however, this is not especially relevant.

# PCIe switches and Virtual Bridges

The particular aspect of PCIe that makes enumerating and parsing the device-tree different is in understanding how PCIe switches and Virtual Bridges are used to offer the same PCI bus abstraction.  With PCIe, the upstream connection of a PCIe switch is analogous to the upstream connection of a PCI bridge, meaning it will be assigned a device number on the parent bus.  However, internally and downstream they differ.  PCIe switches create their own internal bus.  This internal bus assigns device numbers to all the downstream switch ports, which are called virtual bridges.  Each virtual bridge, in turn, is assigned its own downstream bus.  Although buses are allowed up to 32 devices in theory, the buses downstream of a virtual bridge physically only connect to individual devices. which connects to a single device.  What this means is that any device connected to the downstream of a virtual bridge connected to a switch will necessarily be device 0 on its own bus.  In essence, the mediation of traffic is moved away from devices and encapsulated entirely within the switches.

This ![diagram](link) nicely illustrates the enumeration of a PCIe system

# Root Complex / Local Bus

While PCI and PCIe are great for connecting the many peripherals a computer uses, the bus closest to the CPU is seldom, if ever, one of these.  The bus that sits closest to the CPU is typically designed in close conjunction with the CPU and computer architecture itself and is sometimes referred to as a local bus.  It is common for memory to reside on this bus for fast access, and sometimes other devices that need high throughput as well such as graphics cards.  The name for the controller of this bus will also typically be determined by the specific chipset in use, but one of the main functionalities it will implement will be a PCIe **Root Complex**.  The Root complex at the most basic conceptual level is similar to a PCIe switch, although it offers more flexibility s for system optimization.  e.g. CPU memory reads/writes would likley have priority over PCIe peripherals, or certain endpoints like for instance one dedicated for a network card might have higher priority than others.

Here's a helpful diagram from wikipedia that shows a possible root complex design:

![root-complex](https://upload.wikimedia.org/wikipedia/commons/1/1c/Example_PCI_Express_Topology.svg)

In this diagram, the white rectangles attached to the bottom of the root complex are PCIe Virtual bridges.  The Root Complex will manage bus 0 (like a switch manages its own internal bridge), and each of bridges as well as memory would be assigned a device number on bus 0.

One interesting detail to note (and to keep in mind down the line) is that the root complex typically has a portion of the overall memory space hardcoded to be its configuration space.  The configuration space is the memory area that all devices have that allow the kernel to manage that device.  This differs from other devices and controllers because those are typically assigned memory address ranges dynamically at startup when the device enumeration procedure occurs.  This is simply because it is the controller closest to the CPU and needs to be discoverable from the get-go (it is all that the CPU can communicte with directly).

Additionally, because the root complex does not connect to any upstream bridge (it communicate directly with the CPU), the root complex will typically be assigned the first device number on Bus 0, which it itself manages (in contrast to PCI controllers and switches which have their device numbers assigned on the upstream buses).

# Example

Before going into how the enumeration process works, I think it might be helpful to view some information from an actual system.  Below is an editted readout (for readability) of the `lspci` and followed by the `lspci -t` command.
```
$ lspci
00:00.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne Root Complex
00:00.2 IOMMU: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne IOMMU
00:01.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe Dummy Host Bridge
00:01.1 PCI bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe GPP Bridge
00:01.2 PCI bridge: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne PCIe GPP Bridge
00:02.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe Dummy Host Bridge
...
01:00.0 PCI bridge: Advanced Micro Devices, Inc. [AMD/ATI] Navi 10 XL Upstream Port of PCI Express Switch (rev c0)
02:00.0 PCI bridge: Advanced Micro Devices, Inc. [AMD/ATI] Navi 10 XL Downstream Port of PCI Express Switch
03:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD/ATI] Navi 21 [Radeon RX 6800/6800 XT / 6900 XT] (rev c0)
03:00.1 Audio device: Advanced Micro Devices, Inc. [AMD/ATI] Navi 21 HDMI Audio [Radeon RX 6800/6800 XT / 6900 XT]
04:00.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse Switch Upstream
05:01.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:04.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:05.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:08.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:09.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:0a.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
...

$ lspci -t
-[0000:00]-+-00.0
           +-00.2
           +-01.0
           +-01.1-[01-03]----00.0-[02-03]----00.0-[03]--+-00.0
           |                                            \-00.1
           +-01.2-[04-0b]----00.0-[05-0b]--+-01.0-[06]----00.0
           |                               +-04.0-[07]----00.0
           |                               +-05.0-[08]----00.0
           |                               +-08.0-[09]--+-00.0
           |                               |            +-00.1
           |                               |            \-00.3
           |                               +-09.0-[0a]----00.0
           |                               \-0a.0-[0b]----00.0
           +-02.0
           +-08.0
...
```

# Device Enumeration



# Examples


# PCIe hot-plugging


