---
layout: post
title: "Terminal Device Walkthrough"
date: 2023-11-29 13:00:00 -0700
categories: tty
---
In this post, I will walkthrough a few practical aspects of how a terminal application starts up and runs a command.  In my own path to understanding this topic, I came across a number of resources that did an excellent job of explaining the underlying concepts of command-line applications as well as some of the history that helps establish how and why this working model came to be. However, some of the practical elements of how it works in practice eluded me and made it difficult to grasp the big picture.  Additionally, I felt it was useful to connect this material to how input is sent from keyboard and connecting hardware through the X window system (although I won't be diving deeply into details of how these work).  After connecting some of these dots to the theory and history, I felt much more confident in my understanding.  This post is my attempt to highlight the basic practical steps of how setting up and interacting with a 'terminal application' works in the hope that it makes it easier to make sense of the underlying theory.

# Valuable Sources

If you are new to this topic, here are a few sources that I relied on in understanding the theory and which explain it far better than I can:

[TTY Demystified][tty-demystified] - I've widely seen this article linked and referred to as the holy graily for understanding tty devices. It's a must-read and the perfect place to start!!

[pty responsibilies][pty-responsibilities] - Multiple insightful answers that offer additional insights into the components that a tty driver implements

[Chapter 18 - TTY Drivers][linux-device-drivers] from the book "Linux Device Drivers, 3rd edition".  Though a bit dated, this is an excellent book for learning all about how Linux drivers work, and I would highly recommend it to those feeling hung up on this topic.

---

# Vocabulary

Before we dive into it, a number of terms are often used loosely to describe technically distinct but similar things.  To avoid confusion, throughout this article, I will use the following terms:

**xterm/console** - the application which manages the window you view when you interact with "the command line".  I'll primarily use console in this post.

**master pty** - the device file, i.e. the **instance** of pty driver code actively running, interfaced by the console application

**slave pty** the device file being interfaced from the shell and command applications.  Note: in the `/dev` diretory, pty devices are listed under `/dev/pts`

**shell** - a command-line interpreter that can be used to interface with the operating system and run programs

**hardware device** - the above "devices" refer to instances of running software.  This is a physical hardware device that exists on the motherboard.

**terminal** - (not used in this post) The old-fashioned hardware system used to interact with a computer

**tty** - (not discussed in this post) The drivers/devices associated with old terminal hardware. Note: in the /dev folder.

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

As an aside, here's an exceedingly brief (and reductive) overview of what lies between the X window system and the hardware.  The **device tree** is the name of the tree-like structure which models all of the hardware that is connected to your computer, and which is presented to the user in `sys/devices/`.  Conceptually, what underlies this structure is a collection of drivers layered on top of one another, each managing either a bus or a device connected to a bus. When a USB device has input, it will send it up this tree to where it will be directly accessible to the CPU.  From there, a portion of the X window system which resides in the kernel layer and is called the **X window server** will ultimately receive this input and forward it to the console (called **X window client** in X parlance), because it is designated as the **active window**.  

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