---
---


Work done using:
- Linux consoles
- Tmux
- Vim

Schemes:
- solarized color palette


# Setting up the Console Display

Getting the Linux Console Drivers to render my screen correctly wasn't something that required much additional configuration on my desktop. All I had to do was change the text size to what I prefer. On my laptop, however, I also needed to set kernel commandline options from GRUB during boot depending on whether I'd like to use my laptops built-in display or an external monitor.

### Font selection

Picking the font for an Ubuntu machine is easy enough using `dpkg-reconfigure console-setup`.

### Display sizing parameters

The Linux console enables you to pick for a given display the pixel-definition measurements from among a list of compatible values. This [stackoverflow post]() provides insights how this can be done. On my laptop, which is where I need to manually set these values, I opt simply to do them from GRUB each time I boot. By settings the following value in `/etc/default/grub`, every time I boot, I'm brought to the GRUB interface.

```
GRUB_TIMEOUT=-1
```



From there, I enter the grub commandline by entering `...`, and then just run the following bare-bones commands to bring up the kernel:

```


```

The commandline options relevant here are the parameters:
```
video=eDP-1:d video=HDMI-1:3440:1440@60
```
The first one tells the kernel to force off the usage of my laptop's built-in display. The second one tells it to use my external monitor with pixel dimensions of 3440 x 1440 and a refresh rate of 60Hz.

This [stackoverflow post]() does a good job of explaining how you can



prefer to change text sizes, or if you'd prefer to use an external monitor from a laptop, 


# Console Configuration

In order to enable solarized colors, it is necessary to change the color palette that the console is using away from its default. The default palette allows for only 16 colors, and these are set to basic colors like:
    - black: "

With only 16 colors available (and really only 8 because the second half are simply "bright" versions of the first 8), it's necessary to change the terminal color palette to reflect the colors in the solarized scheme.

This can be done by using escape sequences (the [console_codes]() man pages has more info on this). In particular, we need to use the sequence:

```
ESC ] P nrrggbb
```
The 16 possible colors (denoted below in hex) are often referred to by the actual name of the color they represent by default. For instance, 0 is black, 1 is red, 2 is green... These colors are the same ones that can be used with the escape code `ESC [` to change the color of text currently being printed to the console.

Here's an example of changing magenta (color #5) to the color "42f5ce" which is a light-blue green

```
printf "\033]P542f5ce"
```
- "\033" corresponds to the escape character `ESC`
- '] P' identifies the escape sequence to be used
- "542f5ce" is the parameter of the form `nrrggbb` where:
    - `5` identifies the color
    - `42f5ce` is the hexadecimal rgb value indicating the new color

In order to fully appreciate what's going on, try running these commands in your terminal (this may not produce the desired effect in a terminal emulator so make sure you're on a console)
```
printf "\033[45mHello world\n"
printf "\033]P542f5ce"
printf "\033[45mHello world\n"
```

You may then reset the coloring with
```
printf "\033[0m"
```



# Tmux Configuration



# Vim Configuration

### Changing the cursor

```
let t_SI = "\033[2 q"
let t_EI = "\033[1 q"
```


