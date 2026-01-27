---
layout: post
title: "Terminal Device Walkthrough"
date: 2023-12-1 13:00:00 -0700
toc: true
categories: tty
---
<!-- In this post, I will walkthrough a few practical aspects of how a terminal application starts up and runs a command.  In my own path to understanding this topic, I came across a number of resources that did an excellent job of explaining the underlying concepts of command-line applications as well as some of the history that helps establish how and why this working model came to be. However, some of the practical elements of how it works in practice eluded me and made it difficult to grasp the big picture.  Additionally, I felt it was useful to connect this material to how input is sent from keyboard and connecting hardware through the X window system (although I won't be diving deeply into details of how these work).  After connecting some of these dots to the theory and history, I felt much more confident in my understanding.  This post is my attempt to highlight the basic practical steps of how setting up and interacting with a 'terminal application' works in the hope that it makes it easier to make sense of the underlying theory. -->

Learning about the tty is an interesting topic because it offers such amazing context about how information travels within a computer. For me, comparing operating a system through a tty offers a great comparison to more convention means of operation as using graphical interface programs, text editing programs such as vim, as well as by remotely accessing a computer by means such as ssh.

Mention how if you use vim from the linux console, periodically messages about "MMMIO read error..." will appear where the cursor is. Why?

# Valuable Sources

If you are new to this topic, here are a few sources that I relied on in understanding the theory and which explain it far better than I can:

[TTY Demystified][tty-demystified] - I've widely seen this article linked and referred to as the holy graily for understanding tty devices. It's a must-read and the perfect place to start!!

[pty responsibilies][pty-responsibilities] - Multiple insightful answers that offer additional insights into the components that a tty driver implements

[Chapter 18 - TTY Drivers][linux-device-drivers] from the book "Linux Device Drivers, 3rd edition".  Though a bit dated, this is an excellent book for learning all about how Linux drivers work, and I would highly recommend it to those feeling hung up on this topic.

---

# Vocabulary

Before we dive into it, a number of terms are often used loosely to describe technically distinct but similar things.  To avoid confusion, throughout this article, I will use the following terms:

**console** - the shell interface for directly interacting with a system without using an graphical environment.

**xterm** - an example of a graphical terminal application used to simulate the functionality of the console. It interfaces with the master pty device. Other terminal applications (e.g. gnome-terminal, konsole, alacrity. "gnome-terminal" is the default on Ubuntu)

**tty** - refers to both tty drivers (aka LKM's, meaning the code itself) as well as the logical devices (aka character device in the `/dev` folder)

**master pty** - the device file, i.e. the **instance** of pty driver code actively running, interfaced from the xterm application

**slave pty** the device file created when xterm being interfaced from the shell and command applications.  Note: in the `/dev` diretory, pty devices are listed under `/dev/pts`

**shell** - a program that offers a scripting environment to run commands and interface with the system. Common ones include:
- bash (default on Ubuntu)
- sh
- zsh (default on macOS)

<!-- **hardware device** - the above "devices" refer to instances of running software.  This is a physical hardware device that exists on the motherboard.

**logical device** - -->

---

# The Console and TTY

In order to understand how an application like xterm operates under the hood, it's useful to first understand what it's emulating, i.e. the "console". Additionally, as we'll see later, this system underpins any running Linux system so it's useful in this case to start from the bottom-up.

# The Console

If you boot a Linux system that is *not* configured to start-up any sort of graphical environment, then when the system fully loads, you will see on the screen the what looks to be a "full-screen" terminal, called the **virtual console**, or simply the console.  The console is part of the linux kernel

> Quick Aside: A **typical** graphical environment a software stack that includes a display server (X11 or Wayland), display manager (LXDM, GDM, ...), and a desktop environment (KDE, Gnome, ...).  Desktop Environments also make use of window managers (Kwin, i3).
> 
> However, really any graphical application can be run at system boot by configuring systemd to run it.

The console is essentially the lowest level of operation a user interacts with the system from.  It is also called the virtual console because it itself is intended to emulate the hardware which historically was used to connect a physical terminal station to a computer.  The physical terminals of past included all the functionality necessary to receive a byte stream and display characters on a screen, as well as to transmit keyboard inputs to the computer.  Modern keyboards and screens may now use a variety of technologies, and its the console's responsibility to interface between the hardware drivers and the **TTY** that the virtual console is connected to.

## TTY

the TTY is a "serial device" which at the simplest level, just forwards input from the console to whatever program attempts to read from the tty device (which can be found in the `/dev` directory).  The first program that is started will vary linux distribution to distribution, (on Arch it is a getty, on Kubuntu it is a login shell), but both will be started so that their standard inputs/outputs are matched up to the appropriate TTY device file, and these inputs/outputs will be passed to child processes they spawn.  Namely, they will start a bash process (or some similar shell).  These bash process running on that device will read and write to the TTY so that when you type in a command and hit enter, the bash process will read in the characters from that command including the enter character, and begin the process of executing that command by forking, running necessary setup on the child process, and finally excecuting the `exec` system call with the desired command.

### Example Command at the TTY

Suppose you've logged into your computer via the console (again: this means not using any userspace graphical interface), and run the command:

```bash
$ echo "Hello world!"
```

As you typed each character, the keyboard sends a signal to the computer where it was received by a physical device controller attached to the motherboard.  The controller sends the information to memory through the PCIe topology (or whatever other hardware peripheral topology your computer uses). At this point, the **device driver** for the keyboard peripheral is able to make the input signals available to the console.  The console (and the line discipline) will then make characters readable from the TTY device after an enter character is processed.

The bash process that is initialized after logging in will be waiting on a listen system call, and when it receives the command, it will begin the above mentioned process of starting that command as a child process.  The child process itself will begin reading/writing to/from the TTY until it completes.

***

# XTerm and PTY

The previous section describes how commands are run when interacting with the plain old console, but more often than not, we are running much more convenient and capable graphical environments that makes running many of the tasks we use our computers for, such as opening internet browsers and reading blog articles, a more pleasant experience.  So how is this different?

## System Start-up

When the Linux system boots with a graphical interface, there are still multiple virtual consoles made available to the user.  What's different is that the default virtual console is configured to begin a **display manager** instead of a login or getty process.(most modern systems use systemd for initializing and managing services but systemd is a massive separate topic out of the scope of this article).

The display manager sits at the base of the graphical environment stack which comes in all shapes and sizes, but for the purposes of this article, I will assume it at least utilizes an Xorg **display server**

> Trying to customize your own graphical environment by testing out different display managers, desktop environments, or window managers is a fun treasure-hunt and a worthwhile learning experience in itself.  I would recommend trying out a window manager such as i3 without a desktop environment, if only to develop a greater appreciation for different types of environments and the utilities they offer.

The display manager will initialize the display server which will begin reading from the TTY.  At this point, any process that requires running graphics will need to register as a client to the Xorg server.  The Xorg server will read all input that comes through the TTY, and pass it on in the form of a **keysym event** to whatever program is designated the **active window**.

The display manager registers as a client in order to display its graphical login interface (the sort of login screen most desktop computer users are familiar with), and after a user has logged in, the display manager will start the desktop environment.

It's important to note that the desktop environment is a child process of the display manager in the same way a command like `echo` is a child process of the bash shell when operating via the console. However! While the echo process may receive inputs directly from the TTY device, the desktop environment (and all of its child processes henceforth) will receive IO via the Xorg server keysym events.

## Xterm

At this point, you are freshly logged in to a desktop environment and you click on the icon to open an Xterm application.  A number of things will happen with this:

1.  The previously mentioned functionality of forking, setup, and executing the new Xterm process will be performed.

2.  Xterm will make a request for its own window to the Xorg server.

3. The Xterm process will establish a new **pseudo-terminal device**, aka a PTY.


## Setting up the PTY

First, Xterm will run the syscall **posix_openpt**.  This will establish a connection between a **master device** for a pseudo-terminal and return a file descriptor `filedes` for that device.  At this point, the terminal application will fork.  The parent fork will continue to operate as the Xterm application.

The child process, which will ultimately operate as the shell process, needs to run the system call **ptsname**, passing `filedes` as input to the system call.  This function will return a pointer to a `char*` that contains the pathname for the slave pseudo-terminal device associated with that master pseudo-terminal device. Note: while the slave pty device will be listed in the `/dev/pts` directory, the master file descriptor will not be listed anywhere, and is intended only for use by the application that called `posix_openpt`.


## Running echo via XTerm

When you run:

```bash
$ echo "Hello World!"
```

from Xterm, the underlying functionality that makes the console work is still used.  The difference begins with the Xorg Server reading the input from the TTY (instead of the bash shell directly).

From there, the Xorg server will send keysym events to the active window (whichever window is in the foreground) [CAVEAT-window manager intercepting keysyms].  In this case, Xterm will interpret these keysym events and pass the corresponding characters in to the master PTY device which it opened and that only it has access to.  The PTY master will make these characters accessible at the slave PTY device, from which the shell that is running will be blocked on a listen call until it receives that input.  Finally, once the shell has read the command, it can itself fork, setup, and execute the command.  That command may receive further input via the PTY slave and can write its output to that device as well.


***
***
---


## Starting at the Beginning:

# Setup

You've just logged into your computer and you're about to click open a 'terminal application' which I'll call the console.  When you click to open a console, much in the same way that a shell will create and run a new process by forking itself and running `exec` with the desired program, the desktop manager will launch the desired console application.  Further details below.

When the application begins, it will make a request for its own window display.  The application's window is the **active window** when it is the application that the user is currently interacting with.  This means further keyboard inputs will be forwarded through the X window system running in the kernel layer, and finally to the console application (more on this below)

The other essential part of setup that occurs is establishing the pty master device and starting the shell process, i.e. bash, ksh, sh, etc.

First, the console will run the syscall **posix_openpt**.  This will establish a connection between a **master device** for a pseudo-terminal and return a file descriptor `filedes` for that device.  At this point, the terminal application will fork.  The parent fork will continue to operate as the console application.

The child process, which will ulimtately operate as the shell process, needs to run the system call **ptsname**, passing `filedes` as its input.  This function will return a pointer to a `char*` that contains the pathname for the slave pseudo-terminal device associated with that master pseudo-terminal device.  Note: while the slave pty device will be listed in the `/dev/pts` directory, the master file descriptor will not be listed anywhere, and is intended only for use by the application that called `posix_openpt`.

At this point, the child process will call `exec`, passing as the argument `path` the pathname of the shell which will begin running, e.g. `/bin/bash`.  The shell program will close its file descriptor for the master pseudo-terminal device, and will setup its stdin, stdout, stderr to be reading and writing to the slave pty device.  At this point, it will wait for commands to be made available.

![image](/assets/terminal-devices/terminal-diagram.png)

# Running commands

Now that the console and the shell are ready, it's time to run a command.  You type the following: 

`$ echo "Hello world!"`

As you type each character, the keyboard sends each signal to whatever **hardware device** connects your keyboard to the rest of your computer.  One possibility is that your keyboard is plugged into a USB port in which case it will be sent to a **USB device**, which itself will reside on a **USB bus**.  All of these hardware devices and buses make up your computer's **chipset**, the technical term for the hardware that resides on your computer's motherboard.  At the top of this hierarchy is the **root complex**, the name for the device that the CPU interfaces with directly in order to allow the kernel to manage the hardware.

As an aside, here's an exceedingly brief (and reductive) overview of what lies between the X window system and the hardware.  The **Device Model** is the name of the tree-like structure which models all of the hardware that is connected to your computer, and which is presented to the user in `sys/devices/`.  Conceptually, what underlies this structure is a collection of drivers layered on top of one another, each managing either a bus or a device connected to a bus. When a USB device has input, it will send it up this tree to where it will be directly accessible to the CPU.  From there, a portion of the X window system which resides in the kernel layer and is called the **X window server** will ultimately receive this input and forward it to the console (called **X window client** in X parlance), because it is designated as the **active window**.  

Interestingly, the console does not directly display the characters in its window, but instead directly forwards it to the master pty device.  At the same time, the console will be reading from the master pty device, and will display only output it receives from the master pty.  The reason for this, as Linus Akesson state's in his article, is in keeping with the UNIX design philosophy of making applications simple, thus moving the complexity to the **line discipline** which resides in the master pty device.  See [his article][tty-demystified] and this [stack exchange post][pty-responsibilities] for more on the line discipline.

The line discipline, upon receiving a return character signaling the end of the input, will then make the command available to the slave pty.  The slave pty will then make the command available to be read by the shell.  

At this point, the shell has the entire command, and is ready to execute it.  First, the shell will fork.  The parent will remain as the shell process, while the child will call `exec` passing as input the pathname of the program `echo` (likely found by exploring the directories in the $PATH variable) along with the argument `"Hello world!"`.  In this case, the echo program will simply write the inputted argument to its standard output, which points back to the slave pty.  `echo` will then complete and exit, destroying the process.

![image](/assets/terminal-devices/terminal-diagram-echo.png)

The slave pty will forward the output back to the master pty, where the console will read it and display the output in its window.  

```
$ echo "Hello world!"
Hello world!
```

At this point, the state of the console, pty devices, and the shell will have returned to there default states, awaiting further operations by the user.


# Conclusion

I hope this walkthrough may have helped in connecting the pieces that work together to make console applications run.  While it wasn't my intention to provide in-depth explanations of the various components, I do hope that highlighting some of the technical terms might serve as a springboard for exploring these areas.  Additionally, I intend to do another write-up of the device-tree.





[tty-demystified]: https://www.linusakesson.net/programming/tty/

[pty-responsibilities]: https://unix.stackexchange.com/questions/117981/what-are-the-responsibilities-of-each-pseudo-terminal-pty-component-software

[linux-device-drivers]: https://www.oreilly.com/library/view/linux-device-drivers/0596005903/ch18.html
