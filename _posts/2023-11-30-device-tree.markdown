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

A PCI bus may up to 32 different devices plugged into.  The traffic on the bus, meaning the determination of which device can utilize the bus to send data, is overseen by the **PCI Bus Controller**.  While the controller can be seen as a facilitator amongst the devices on that shared channel, it also resides on the bus upstream of it - upstream refers to being closer to the CPU - and so it may also be referred to as a bridge.  The PCI Bus Controller/Bridge for the lower bus will itself appear as a device on the upstream bus, and will need to adhere to the upstream Bus controller's traffic facilitation.  The parent bus may be another PCI bus (meaning the PCI buses are nested), or it may be another type of bridge.

the diagram in this ![link highlights](https://docs.oracle.com/cd/E19455-01/805-7378/hwovr-22/index.html) how these buses can be nested.  Note that the PCI Bus bridge in the middle is assigned a device number on Bus 0, while device numbers on the Bus 1 which it controls will be assigned from a new pool of device numbers.



# PCIe differences

While PCI uses parallel buses which must be shared by all the devices on that bus, PCIe uses point-to-point serial communication, and can offer multiple channels for doing so.  What this enables is for different devices to communicate via different channels on that bus at the same time, because each device will only receive data when it is the intended target of that communication.  This is made practical by newer technology that offers higher communication speeds via an increased clock rate.  From a software perspective however, this is not especially relevant.

# PCIe switches and Virtual Bridges

The particular aspect of PCIe that makes enumerating and parsing the device-tree different is in understanding how PCIe switches and Virtual Bridges are used to offer the same PCI bus abstraction.  With PCIe, the upstream connection of a PCIe switch is analogous to the upstream connection of a PCI bridge, meaning it will be assigned a device number on the parent bus.  However, internally and downstream they differ.  PCIe switches create their own internal bus.  This internal bus assigns device numbers to all the downstream switch ports, which are called virtual bridges.  Each virtual bridge, in turn, is assigned its own downstream bus.  Although buses are allowed up to 32 devices in theory, the buses downstream of a virtual bridge physically only connect to individual devices. which connects to a single device.  What this means is that any device connected to the downstream of a virtual bridge connected to a switch will necessarily be device 0 on its own bus.  In essence, the mediation of traffic is moved away from devices and encapsulated entirely within the switches.

This ![diagram](link) nicely illustrates the enumeration of a PCIe system

# Root Complex / Local Bus

While PCI and PCIe are great for connecting the many peripherals a computer uses, the bus closest to the CPU is seldom, if ever, one of these.  The bus that sits closest to the CPU is typically designed in close conjunction with the CPU and computer architecture itself and is sometimes referred to as a local bus.  It is common for memory to reside on this bus for fast access, and sometimes other devices that need high throughput as well such as graphics cards.  The name for the controller of this bus will also typically be determined by the specific chipset in use.  My AMD Ryzen and X570 chipset system refers to it as the **Root Complex**.  The Root complex at the most basic conceptual level is similar to a PCI bus controller, although it will also probably be designed to optimize overall system performance by treating different attached components with different priorities.  e.g. CPU memory reads/writes would likley have priority over PCIe peripherals, or certain endpoints like for instance one dedicated for a network card might have higher priority than others.

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


