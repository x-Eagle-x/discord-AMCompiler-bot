# AMCompiler
A Discord bot written in JavaScript for compiling SM/AMXX plugins.

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
- Download AMXX and SP from the official websites and copy the compilers (folder **"scripting"**) to folders **"AMXX"** and **"SP"** respectively.
