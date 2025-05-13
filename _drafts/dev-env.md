---
---


Work done using:
- Linux consoles
- Tmux
- Vim

Schemes:
- solarized color palette



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


