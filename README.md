# AMCompiler
A Discord bot written in JavaScript for compiling SM/AMXX plugins. Type "$help" for seeing the available commands.

## Installation

- Install the Discord bot library for NodeJS
>       npm install discord.js

- Create a MySQL server and execute this query:
>       create table AMCompiler
>       (
>	       ServerId varchar(32),
>	       BotChannel varchar(32)
>       );

- Edit the configuration file (**"auth.json"**)
- If you are running the bot on Linux, change the variable **OnLinux** (line #15) to true.
- By default there's no need but you may download AMXX and SP from the official websites and copy the compilers (folder **"scripting"**) to folders **"AMXX"** and **"SP"** respectively.



AmxModX downloads:
- https://www.amxmodx.org/downloads-new.php
  or
- https://www.amxmodx.org/downloads.php

SourcePawn downloads:
- https://www.sourcemod.net/downloads.php?branch=stable
  or
- https://www.sourcemod.net/downloads.php?branch=dev
