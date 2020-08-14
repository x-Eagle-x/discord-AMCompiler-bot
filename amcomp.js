/*
    AMCompiler - a Discord bot for compiling AMXX/SP plugins.
    Written by thEsp, version 1.0
	
    Published under GPL-3 license.
    https://github.com/x-Eagle-x/discord-AMCompiler-bot
*/

const Discord = require("discord.js");
const FS = require("fs");
const Exec = require("child_process").exec;
const MySQL = require("mysql");
const Auth = require("./auth.json");

const OnLinux = false;

const AMXXCompiler = OnLinux ? `./AMXX/amxxpc` : `"AMXX/amxxpc.exe"`;
const SPCompiler = OnLinux ? `./SP/spcomp` : `"SP/spcomp.exe"`;

const AMXXVersion = "1.9";
const SPVersion = "1.10";

const CP = "$"; // command prefix. 
const CodeRegex = /```(.*?)```/s;

const DBConnection = MySQL.createConnection({host: Auth.Host, user: Auth.User, password: Auth.Pass, database: Auth.Database});
DBConnection.connect(function(Error) {
    if (Error)
        throw Error;
});

let ActiveCalls = new Array();
let BotChannels = new Array();

const HelpEmbed = {
    color: 0x0000FF,
    fields: [
        {
            name: `${CP}info`,
            value: "Prints the information about this bot."
        },
        {
            name: `${CP}invite`,
            value: "Prints an invitation."
        },
        {
            name: `${CP}botchannel`,
            value: "**[ADMIN ONLY]** Changes the bot (commands) channel. Enter the channel ID to set/change it, elsewise leave blank for removing it."
        },
        {
            name: `${CP}compile`,
            value: `Compiles the given code as either AMXX or SP.\nThe syntax is as follows:\n> ${CP}compile amxx **{space}**\`\`\`code (new lines allowed)\`\`\``
        }
    ]
};

const InfoEmbed = {
    color: 	0x0000FF,
    title: "AMCompiler 1.0",
    description: "Written by thEsp.",
    fields: [
        {
            name: "AMXX version",
            value: AMXXVersion
        },
        {
            name: "SP version",
            value: SPVersion
        }
    ],
};

const InviteEmbed = {
    color: 0xFFFF00,
    title: "Invitation link",
    fields: [
        {
            name: "Invite us!",
            value: "https://discord.com/oauth2/authorize?client_id=741008465647894552&scope=bot&permissions=60480"
        }
    ]
};

const InvalidCodeEmbed = {
    color: 0xF70000,
    fields: [
        {
            name: "Invalid command!",
            value: "Please check your code formatting (\\```code\\```) and/or compilation type (AMXX / SP)."
        }
    ]
};

const WrongEmbed = {
    color: 0xF70000,
    fields: [
        {
            name: "Something went wrong.",
            value: "Please wait and then try again."
        }
    ]
};

const ChannelChangedEmbed = {
    color: 0xFFFF00,
    fields: [
        {
            name: "Done",
            value: "The bots (commands) channel has been updated. Please undo this if it was a mistake."
        }
    ]
};

const InsufficentRightsEmbed = {
    color: 0xF70000,
    fields: [
        {
            name: "Hey!",
            value: "Only the server owner can access this command!"
        }
    ]
};

const Bot = new Discord.Client({token: Auth.Token, autorun: true});
Bot.on("message", (Msg) => ReadCommand(Msg));

function ReadCommand(Msg)
{
    if (!Msg.content.startsWith(CP) || ActiveCalls[Msg.author.id] || !InBotsChannel(Msg.guild.id, Msg.channel.id))
        return;

    const Message = Msg.content.substr(CP.length);
    const Command = Message.split(' ')[0].toLowerCase();
    let Arguments = StrSplitOnce(Message, 1);

    switch (Command)
    {
        case "help":
            Msg.channel.send({embed: HelpEmbed});    
            break;

        case "info":
            Msg.channel.send({embed: InfoEmbed});
            break;

        case "invite":
            Msg.channel.send({embed: InviteEmbed});
            break;

        case "botchannel":
            if (Msg.author.id != Msg.guild.ownerID)
                return Msg.channel.send({embed: InsufficentRightsEmbed});

            const NewChannel = StrSplitOnce(Message, 1);
            ChangeBotsChannel(Msg.guild.id, NewChannel);

            Msg.channel.send({embed: ChannelChangedEmbed});
            break;

        case "botchannel":
            if (Msg.author.id != Msg.guild.ownerID)
                return Msg.channel.send({embed: InsufficentRightsEmbed});

            ChangeBotsChannel(Msg.guild.id, NewChannel);
            Msg.channel.send({embed: ChannelChangedEmbed});
            break;

        case "compile":
            if (Arguments.includes('\n```'))
                Arguments = Arguments.replace("\n```", " ```");

            const Type = Arguments.split(' ')[0].toLowerCase();
            const Code = StrSplitOnce(Message, 2);

            if (Type == "amxx")
                Compile(Msg.channel, Msg.author, Code);
            else if (Type == "sp")
                Compile(Msg.channel, Msg.author, Code, 0);
            else
                Msg.channel.send({embed: InvalidCodeEmbed});
            break;
    }
}

function StrSplitOnce(Str, Part = 0, Delim = ' ')
{
    return Str.split(Delim).slice(Part).join(Delim);
}

function ChangeBotsChannel(ServerId, NewChannelId, Erase = 0)
{
    DBConnection.query(`delete from AMCompiler where ServerId = ${ServerId};`);
    if (!Erase)
        DBConnection.query(`insert into AMCompiler values (${ServerId}, ${NewChannelId});`);

    BotChannels[ServerId] = Erase ? undefined : NewChannelId;
}

function InBotsChannel(ServerId, ChannelId, Output)
{
    if (BotChannels[ServerId] == undefined)
        return true;
    else
        if (BotChannels[ServerId] != ChannelId)
            return false;

    return true;
}

(function LoadSettings()
{
    DBConnection.query(`select * from AMCompiler;`, (Error, Results) => {
        Results.forEach(Result => {
            BotChannels[Result.ServerId] = Result.BotChannel;
        });
    });
}());

function Compile(Channel, Author, Code, AMXX = 1)
{
    ActiveCalls[Author.id] = true;
    Code = Code.match(CodeRegex);

    if (Code == null || Code[1] == null)
        return Channel.send({embed: InvalidCodeEmbed});

    Code = Code[1];
    while (Code[0] == '\n')
    {
        // trim new lines. helps to understand the errors properly
        Code = Code.substr(1);
    }

    const ScriptFile = AMXX ? `${Author.id}.sma` : `${Author.id}.sp`;
    const BinaryFile = AMXX ? `${Author.id}.amxx` : `${Author.id}.smx`;
    const Compiler = AMXX ? `${AMXXCompiler}` : `${SPCompiler}`;

    FS.writeFile(ScriptFile, Code, (Error) => {
        if (Error)
            return Channel.send({embed: WrongEmbed});

        var CompilationResult;
        Exec(`${Compiler} ${ScriptFile}`, (Error, StdOut, StdErr) => {
            CompilationResult = StdOut;
        });

        setTimeout(() => {
            OutputScript(Channel, Author, CompilationResult, AMXX);
        }, 2500);
        setTimeout(() => {
            FS.unlinkSync(ScriptFile);
            if (FS.existsSync(BinaryFile))
                FS.unlinkSync(BinaryFile);
        }, 4000);
    });
}

function OutputScript(Channel, Author, CompilationResult, AMXX = 1)
{
    const BinaryFile = AMXX ? `${Author.id}.amxx` : `${Author.id}.smx`;
    const CompilationEmbed = new Discord.MessageEmbed()
        .setColor("#00FF00")
        .setTitle("Compilation results")
        .setDescription(`\`\`\`${CompilationResult}\`\`\``)
        .setFooter(`Requested by ${Author.username}`);

        if (FS.existsSync(BinaryFile))
        {
            CompilationEmbed.attachFiles(BinaryFile);
            CompilationEmbed.addField("Success", "Compilation completed. Please rename the output.");
        }
        else
        {
            CompilationEmbed.setColor("#00F70000");
            CompilationEmbed.addField("Fail", "Compilation failed. Please check the errors.");
        }

    Channel.send(CompilationEmbed);
    ActiveCalls[Author.id] = false;
}

Bot.login(Auth.Token);