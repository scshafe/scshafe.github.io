---
layout: post
title: "Device Model and System Topology"
date: 2023-11-30 13:00:00 -0700
categories: device-tree driver sys
---
Note: this article is still in progress.

In this post, I hope to give an overview of how to interpret a Linux system's peripheral topology.  I won't go into great detail in specific topics, but I hope to connect a number of topics that are typically tackled individually. For more detail on any one topic, the internet abounds with resources more informed than I can offer.  The purpose of this post is to help develop a mental model for "how things *acutally* work" at a high-level, by relating and *connecting* the basics of a number of topics, working up to a model of the overall layout of a Linux desktop's peripheral topology.

The basic roadmap is as follows:

- Startup
- Enumeration
- Root Complex
- PCIe
- sysfs and device-model
- lspci output



One thing to note going into this is that the terminology can sometime be befuddling because generic terms often apply to different things at different layers of the stack. Because the layers are often intermixed, confusion may abound.  For instance, a "device" may refer to a physical device (peripheral), a device controller (on the motherboard), a logical device (a software abstraction for either the peripheral), a struct called device (used in LKM development), or a device file (a filesystem abstraction controlled by a LKM).  To make matters worse, it's commonplace to see any of these referred to as just "device" for shorthand.

With that said, the spirit of this article will be to spell things out with abundant clarity with respect to terminology. If during the course of reading this article you wonder "but how does that work *specifically*?", my hope is that the surrounding context will provide you with the terminology to do a more in-depth search elsewhere.  However, if you're left wondering "what *specifically* is that referring to?" than that is a mistake on my part, so please reach out and let me know!

# Terminology

Here are a number of terms I'd like to clarify beforehand:

**Peripheral** - this is a bit of an umbrella term because it often refers to a "functionality" that the kernel utilizes.  It may refer to an "on-chip" peripheral, or to an "external" peripheral.  Generally speaking, a peripheral is any component that the kernel (which runs on CPU cores) controls via IO.  An "on-chip" peripheral might be another chip in the same CPU package designed to carry out a specific type of processing.  For example, a CPU may have integrated graphics, power controllers, clocks, or (especially for embedded system-on-chips) controllers for specific buses.  An "external" peripheral refers to the combination of a controller on a motherboard and its associated hardware.  For example, a USB peripheral is any piece of hardware that connect to the motherboard via USB.  It's also common to simply call a controller for that external hardware piece a controller

[ ### revise ###]




# Startup

I want to begin with an extremely reductive summary of the boot process, **beginning** with when the Linux kernel is loaded into memory, and contrast the embedded (namely, ARM) and desktop (x86) approaches for accomplishing this.  Know ahead of time that they accomplish the same thing - the difference is in the approach.

### Embedded (Device-Tree)

When embedded systems load a Linux kernel, they typically also load into memory a compiled file called the **device-tree**..  The device-tree is simply a map of all the hardware peripherals on a particular computer (that cannot be loaded dyanmically via plug-and-play), and it includes information such as the memory addresses owned by that peripheral and the driver required to operate it.

A fraction of the full memory address range on any CPU will be dedicated to working with peripheral devices, meaning when the OS attempts to access those memory addresses, the request will not actually go to the memory chip.  Instead, it will be identified and intercepted by the memory controller, and delivered to the corresponding peripheral. It's the PCB designers job to map the address ranges of a particular CPU's ports to the peripherals they are placing on the PCB, and create a device-tree file that contains all of this information.  This device-tree file is compiled (into a data structure), and made accessible to the bootloader, so that the bootloader can load it into memory and pass the memory address for the file to the kernel.  The kernel can then iterate over the data structure when it is starting to build up its own map of the hardware and load the necessary drivers.

### Desktop (ACPI)

When a desktop CPU loads a Linux kernel, this functionality is usually carried out by a much more comprehensive bootloader such as GRUB2.  In a desktop system, there is a standardized interface, **ACPI** that allows software to "ask" the on-motherboard firmware for details about the systems peripheral devices.  The code to handle this is built in to the kernel, the memory addresses used to communicate with the firmware are reserved by the computer architecture (i.e. x86), and the firmware of the system has hardcoded data structures that provide all the details of the system.  By querying the firmware, the OS can enumerate all the hardware.

### Addendum

Both types of systems, embedded and desktop, also often contain "on-chip" peripherals.  Conceptually, these operate the same as peripherals on the motherboard.  For embedded systems, these are also included in the device-tree.  For desktop systems, some of these devices have hardcoded addresses in the kernel (compiled into the kernel for the specific computer architecture).  The remaining ones are discovered through the bus, which can tell the operating system the devices that are attached to the bus it controls.  The kernel can then query those devices for ID's unqiue to that specific device, match those ID's to a mapping that associates all the drivers available in the kernel to those ID's, and then call that driver's probe function to initialize the device.  

This procedure is conceptually the same as the PCIe protocol, which is currently the mainstay of connecting peripherals on a motherboard to a system, and which I'll outline in greater detail below.

[ ### diagram of handshake here ###]


# The Root Complex and PCIe

## Root Complex

In order for a CPU to connect to external peripherals, the CPU has direct access to the **system bus** - all the components on the system bus are detected via the procedures above (i.e. ACPI / device-tree).  One of the entities on the system bus is the **root complex**.  The root complex implements a **host bridge** between the CPU and downstream peripherals (including memory).  While memory itself is not a PCIe peripheral, the root complex sits in between the CPU, memory, and downstream peripherals in order to facilitate DMA (so that peripherals can send data directly to memory).  When the CPU makes IO requests, the root complex will intercept them if the address indicates that they are intended for a peripheral device instead of memory and handle the communication from there.

The root complex connects to the downstream peripherals via **root ports**.  Root complexes are essentially just **virtual bridges** PCIe connections.

## PCIe

There is a lot to cover in PCIe to get a really full grasp of how it works, and there are lots of resources out there, so I'll simply provide a few links at the bottom of this section for a more in-depth exploration of the topic.  I'll simply cover the basics that will help formulate the overall structure.

Additionally, one thing to be aware of going into understanding PCIe is that it is intended to offer backward compatibility for software that utilized PCI (its predecessor).

With PCI, a PCI bridge would offer a connection to a downstream bus to which multiple peripherals might be attached.  As such, there might be multiple physical devices connected to a bus, all of them sharing the bus's bandwith for communication.  PCIe uses point-to-point communication, meaning any one physical connection is used exclusively between the 2 components attached to it on either end.

In order to enable PCIe to branch out, the **PCIe switch** was introduced.  A PCIe switch creates its own internal bus, and provides multiple virtual bridges (each a separate physical connection) to other PCIe devices.  Each **virtual bridge** then creates its own PCI bus (even though it only connects to one other downstream component).  As a result, each PCIe peripheral will reside on a unique bus and will be the *only* device on that bus (although it may be able to create 8 distinct PCIe functions for itself).

This [blog entry](https://codywu2010.wordpress.com/2015/11/29/how-modern-multi-processor-multi-root-complex-system-assigns-pci-bus-number/) provides a nice explanation and illustrations for the assignment of bus, device, and function numbers

## PCIe Enumeration

The kernel sets up this hierarchy through the **PCIe enumeration**.  The enumeration process is a depth-first search of all the connected peripherals in the PCIe hierarchy.  Beginning with the root complex, the kernel will query the **configuration space** of each peripheral device connected to a bus, where it will find information on what that peripheral is and what driver to assign to it.  The kernel will then match the peripheral to its required driver, create an instance of that module to control the peripheral, and the driver's probe function.  (Note: the reason Linux is called a **monolithic kernel** is because all of the potential drivers that it will use are contained in Linux).

If the newly added peripheral is a switch or another virtual bridge, it will iterate this process, assigning them new bus numbers.

### Resources





# sysfs (and the device-model)

## Adding a device

Let me preface this section by saying Linux's device-model is a truly complicated beast, and therefore I only intend to walk through a tiny aspect of it: that is, the way devices a pci device might be detected and added to the sysfs system.

To illustrate how the kernel builds the device-model, I'll zone in on what happens when a new device is detected on a PCI bus.

First, the controller for the phsyical device will send a signal upstream with information for identifying it.  The kernel will create a **device struct** to represent this new physical device.  This struct is used by the kernel to create a hierarchy for displaying devices in sysfs.

It will then call a function of the peripheral's parent called `match(struct device *dev, ...)` that will check the device information against a list of that bus's registered drivers (the match function is one that is implemented by drivers for a bus).  Assuming it returns true, the kernel will then add the new device to the parent's device struct's list of child devices.

Next, the kernel will call the `pci_get_device(struct device *dev,...)` function, which will create a **pci_dev struct** that includes a member pointer to the device struct.  The pci_dev struct is the structure that a pci driver will be passed in its probe function.

In the driver's probe function, the driver can call functions to register itself as a specific type of class.

## How it will appear in sysfs

Anytime a device struct is created, it will be added to its topologically defined place in the peripheral hierarchy in `/sys/devices`.  When switches and ports are detected, even though those implement buses, those too are still given a device struct which will give them a place in this directory.

The `/sys/class` directory contains a number of classes which are created when the system starts up (before peripherals are enumerated).  This provides a convenient way to interact with peripherals from the userspace, because rather than having to trace through the entire PCIe topology to find a peripheral, a user can navigate to `/sys/class`, find the class for the peripheral they are looking for (e.g. pci_bus, input, gpio, ...) and they will find symbolic links for each peripheral that is registered as that type of class to that peripheral's place in sysfs.

In this respect, sysfs and the device-model provide a web, offering multiple approaches to organizing the peripherals on a Linux system.



When a new peripheral is detected, the kernel creates a **device struct** to represent it.  It  

When a driver is loaded for a new peripheral, a **logical device** is added to Linux's **device-model**.  Concretely speaking, the kernel uses a trees of **device** structs and **Kobject** structs to accomplish this.



Every time a new peripheral is discovered, the kernel creates a Kobject for that peripheral, assigns it a pointer to its parent's Kobject (the upstream peripheral it was discovered from), and adds the new Kobject to the parent's list of child Kobjects.  The Kobject is then 



# lspci

If all you want to do is view connected PCI devices however, a simpler way to see the hierarchy is using the `lspci` command, appending the `-t` option formats it nicely in as a tree.

The following is output from my own system

```bash
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

$ lspci
00:00.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne Root Complex
00:00.2 IOMMU: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne IOMMU
00:01.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe Dummy Host Bridge
00:01.1 PCI bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe GPP Bridge
00:01.2 PCI bridge: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne PCIe GPP Bridge
00:02.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe Dummy Host Bridge
00:08.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Renoir PCIe Dummy Host Bridge
00:08.1 PCI bridge: Advanced Micro Devices, Inc. [AMD] Renoir Internal PCIe GPP Bridge to Bus
00:08.2 PCI bridge: Advanced Micro Devices, Inc. [AMD] Renoir Internal PCIe GPP Bridge to Bus
00:14.0 SMBus: Advanced Micro Devices, Inc. [AMD] FCH SMBus Controller (rev 51)
00:14.3 ISA bridge: Advanced Micro Devices, Inc. [AMD] FCH LPC Bridge (rev 51)
00:18.0 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 0
00:18.1 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 1
00:18.2 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 2
00:18.3 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 3
00:18.4 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 4
00:18.5 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 5
00:18.6 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 6
00:18.7 Host bridge: Advanced Micro Devices, Inc. [AMD] Cezanne Data Fabric; Function 7
01:00.0 PCI bridge: Advanced Micro Devices, Inc. [AMD/ATI] Navi 10 XL Upstream Port of PCI Express Switch (rev c0)
02:00.0 PCI bridge: Advanced Micro Devices, Inc. [AMD/ATI] Navi 10 XL Downstream Port of PCI Express Switch
03:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD/ATI] Navi 21 [Radeon RX 6800/6800 XT / 6900 XT] (rev c0)
03:00.1 Audio device: Advanced Micro Devices, Inc. [AMD/ATI] Navi 21/23 HDMI/DP Audio Controller
04:00.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse Switch Upstream
05:01.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:04.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:05.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:08.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:09.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
05:0a.0 PCI bridge: Advanced Micro Devices, Inc. [AMD] Matisse PCIe GPP Bridge
06:00.0 Non-Volatile memory controller: Samsung Electronics Co Ltd NVMe SSD Controller SM981/PM981/PM983
07:00.0 Network controller: Intel Corporation Wi-Fi 5(802.11ac) Wireless-AC 9x6x [Thunder Peak] (rev 29)
08:00.0 Ethernet controller: Realtek Semiconductor Co., Ltd. RTL8111/8168/8211/8411 PCI Express Gigabit Ethernet Controller (rev 26)
09:00.0 Non-Essential Instrumentation [1300]: Advanced Micro Devices, Inc. [AMD] Starship/Matisse Reserved SPP
09:00.1 USB controller: Advanced Micro Devices, Inc. [AMD] Matisse USB 3.0 Host Controller
09:00.3 USB controller: Advanced Micro Devices, Inc. [AMD] Matisse USB 3.0 Host Controller
0a:00.0 SATA controller: Advanced Micro Devices, Inc. [AMD] FCH SATA Controller [AHCI mode] (rev 51)
0b:00.0 SATA controller: Advanced Micro Devices, Inc. [AMD] FCH SATA Controller [AHCI mode] (rev 51)
0c:00.0 Non-Essential Instrumentation [1300]: Advanced Micro Devices, Inc. [AMD] Zeppelin/Raven/Raven2 PCIe Dummy Function (rev c9)
0c:00.1 Audio device: Advanced Micro Devices, Inc. [AMD/ATI] Renoir Radeon High Definition Audio Controller
0c:00.2 Encryption controller: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 10h-1fh) Platform Security Processor
0c:00.3 USB controller: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne USB 3.1
0c:00.4 USB controller: Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne USB 3.1
0c:00.6 Audio device: Advanced Micro Devices, Inc. [AMD] Family 17h/19h HD Audio Controller
0d:00.0 SATA controller: Advanced Micro Devices, Inc. [AMD] FCH SATA Controller [AHCI mode] (rev 81)

```

In the above, we see the first device on bus 00 is the root complex.  Below it sits multiple bridges (root compelx ports), although only device 01 is used. (Note: i this case, the port is multiplexed to provide two different PCI branches out of 2 different functions.  I didn't go into this)

Looking at the second branch 00:01.2, it connects to a swtich 04:00.0, which has several downstream ports (PCIe GPP Bridges on it).  Each of these bridges creates its own Bus (Bus numbers 06 through 0a), which PCIe endpoints reside on.


