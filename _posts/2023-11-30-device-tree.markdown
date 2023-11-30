---
layout: post
title: "Device-Tree Explained"
date: 2023-11-30 13:00:00 -0700
categories: device-tree driver sys
---
In this post, I hope to give an overview of what Linux's device-tree is, and how it manages peripheral hardware.  Coming from a software development background with not a lot of experience or knowledge of hardware beyond the most basic CPU/memory model of typical computing, I found this to be at times excrutiating work.  Sometimes, very basic principles eluded me.  The sorts of things which are taken for granted beyond any introductory courses in circuits or hardware.  Other times, I simply couldn't make sense of terminology or wasn't clued in to what terms I should be looking into.

My hope with this post is two-fold: in some places, I plan to dive deep, using my own system as an example, to highlight some details that gave me "aha" moments.  In other areas, I'll aim to outline the big picture and some of the elementary insights that are often left out of more sophisticated explanations.

For the purposes of this post, I'll be analyzing output from my own system, running Kubuntu 22 on an AMD Ryzen cpu with the X570 chipset.  Additionally, I will assume conceptual knowledge just of the basics for how a driver works.  If the basics are new, I'd suggest having a look at the book "Linux Device Drivers" - it was a valuable resource for me.

# Roadmap

the device-tree

the root complex

basic PCIe principles

# Terminology




# The Device-Tree

The device-tree, which resides in the `/sys/devices/` directory, is the kernels way of organizing all the connected peripheral devices.  Conveniently, and intuitively, the filesystem's tree-structure mirrors the structure of all the hardware connected to a system.  However, while the device-tree is, at its simplest, conceptually a tree, it is also described as a giant web, because so many pieces link to other parts of the tree and to other directories outside the tree such as `/sys/bus/`, `/sys/dev/`, `/sys/class/`, and others for organizational purposes.  As a result, parsing the device-tree itself, as well as the output of some of the common command-line instructions used for inspecting peripherals, like `lspci`, can be confusing without knowing what to look for, and particularly without understanding how the hardware itself works.

Before we dive into how the kernel can map out the hardware to create the tree, we'll first need to cover some basics about the hardware itself and what it is that needs to be mapped.

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

The structure of a PCI bus fairly straightforward.  There is a bus that may have as many as 32 different devices plugged into.  The traffic on the bus, meaning the determination of which device can utilize the bus to send data, is overseen by the **PCI Bus Controller**.  While the controller can be seen as a facilitator amongst the devices on that shared channel, it also serves as a bridge from that bus to whatever bus is upstream of it - upstream refers to being closer to the CPU.  On the upstream side of the controller, the bus must be attached to another parent bus.  This parent bus (assuming it is PCI as well though it need not be), will have the same layout, and the child PCI Bus controller will appear as one of the devices on that parent bus.

the diagram in this ![link highlights](https://docs.oracle.com/cd/E19455-01/805-7378/hwovr-22/index.html) how these buses can be nested.  Note that the PCI Bus bridge in the middle is assigned a device number on Bus 0, while device numbers on the Bus 1 which it controls will begin from 0.



# PCIe differences

While PCI uses parallel buses which must be shared by all the devices on that bus, PCIe uses point-to-point serial communication, and can offer multiple channels for doing so.  What this enables is for different devices to communicate via different channels on that bus at the same time, because each device will only receive data when it is the intended target of that communication.  This is made practical by newer technology that offers higher communication speeds via an increased clock rate.  From a software perspective however, this is not especially relevant.

# PCIe switches

The particular aspect of PCIe that makes enumerating and parsing the device-tree different is in understanding how PCIe switches and Virtual Bridges are used to offer the same PCI bus abstraction.  With PCIe, the upstream connection to the parent bridge is the same.  However, internally, they create their own internal bus.  This internal bus connects all the downstream switch ports, which are called virtual bridges, and which are assigned device numbers the same way a PCI bus assigns device numbers.  Each virtual bridge, in turn, is assigned its own bus number which connects to a single device.  What this means is that any device connected to the downstream of a switch will necessarily be device 0 on its own bus.  In essence, the mediation of traffic is moved away from devices and encapsulated entirely within the switches.

This ![diagram](link) nicely illustrates the enumeration of a PCIe system

# Root Complex / Local Bus


# Mapping the devices at startup



