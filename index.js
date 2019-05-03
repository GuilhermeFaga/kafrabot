const { Client, RichEmbed, Discord } = require('discord.js');

const client = new Client()

const config = require("./config.json")

var imgur = require('imgur');
const Papa = require('papaparse')
const numeral = require('numeral');
const request = require('request')
const fs = require('fs')
var plotly = require('plotly')('GuilhermeFaga', 'TumvPeorJMx4AgP1eb1j');

const emojiDiscordGuilds = require("./emojiDiscordGuilds.json")

var emojiGuilds = []
const emojis = new Map()

// Initialize **or load** the server configurations
const Enmap = require('enmap');

// I attach settings to client to allow for modular bot setups
// In this example we'll leverage fetchAll:false and autoFetch:true for
// best efficiency in memory usage. We also have to use cloneLevel:'deep'
// to avoid our values to be "reference" to the default settings.
// The explanation for why is complex - just go with it.
client.guildsSettings = new Enmap({
  name: "guildsSettings",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: 'deep'
});

const defaultGuildsSettings = {
  prefix: "!",
  preferredServer: "global",
  etChannel: "null",
  botChannel: "null",
  exchangeChannel: "null",
  exchangeItems: [],
  linkEmbed: true
}

client.usersSettings = new Enmap({
  name: "usersSettings",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: 'deep'
});

const defaultUsersSettings = {
  level: 1,
  baseExp: 0
}

// Pegar mais informacoes dos itens // https://roexplorer.com/items_json/[itemId].json
// Pegar valor do item da exchange // https://www.romexchange.com/api?exact=true&item=Candle%20Blueprint&type=0
//console.log(encodeURIComponent("Piercing Staff [2]"))

const SetUserActivity = [
  () => {
    client.user.setPresence({
      game: {
        name: "Ragnarok M: Eternal Love",
        type: 'STREAMING',
        url: "https://www.twitch.tv/directory/game/Ragnarok%20M%3A%20Eternal%20Love"
      },
      status: 'online'
    })
  },
  () => {
    client.user.setPresence({
      game: {
        name: `${client.guilds.size} servers`,
        type: 'WATCHING'
      },
      status: 'online'
    })
  },
  () => {
    client.user.setPresence({
      game: {
        name: `with my poring`,
        type: 'PLAYING'
      },
      status: 'online'
    })
  },
  () => {
    client.user.setPresence({
      game: {
        name: `!k ? for help`,
        type: 'PLAYING'
      },
      status: 'online'
    })
  },
  () => {
    client.user.setPresence({
      game: {
        name: `!k help`,
        type: 'PLAYING'
      },
      status: 'online'
    })
  }
]

function ChangeUserActivity() {
  var x = Math.floor((Math.random() * SetUserActivity.length));
  SetUserActivity[x]()
}

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.

  // Set a loop to change the bot activity randomly every 5 minutes
  ChangeUserActivity()
  setInterval(ChangeUserActivity, 300000); // 300000 = 5min

  ReportLog(`${client.guildsSettings.count} Guilds Settings`)
  ReportLog(`${client.usersSettings.count} Users Settings`)

  emojiDiscordGuilds.guilds.forEach(guild => {
    emojiGuilds.push(client.guilds.get(guild))
  });
  try {
    for (let i = 0; i < emojiGuilds.length; i++) {
      const guild = emojiGuilds[i];
      const emoji = guild.emojis.map(v => v)
      for (let j = 0; j < emoji.length; j++)
        emojis.set(emoji[j].name, `<:${emoji[j].identifier}>`)
    }
    ReportLog(`Done loading ${emojis.size} Emojis`)
  }
  catch (error) { ReportError(error) }
  ReportLog(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds. <@283415253696512000>`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  ReportLog(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  ReportLog(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  // Removing an element uses `delete(key)`
  client.guildsSettings.delete(guild.id);
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

async function CreateEmbedForLink(message, id, monster) {
  try {
    var sBody
    var defaultEmbed
    let promise = new Promise((resolve) => {
      var embed = new RichEmbed()
        .setColor(16056092)
      if (monster) {
        request(`https://roexplorer.com/monsters_json/${id}.json`, { json: true }, (err, res, body) => {
          sBody = body
          embed.setAuthor(body.NameZh_EN, `https://roexplorer.com/imgs/original_${body.Icon}.png`, `https://roexplorer.com/monster/${body.id}`)
            .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com`, message.author.avatarURL)
            .setDescription(`*${body.Nature} ${body.monster_type}*   *Level ${body.Level}*`)
            .setThumbnail(`https://roexplorer.com/imgs/original_${body.Icon}.png`)
            .addField("Race", `${body.Race_EN}`, true)
          defaultEmbed = embed
          resolve(embed)
        })
      } else {
        request(`https://roexplorer.com/items_json/${id}.json`, { json: true }, (err, res, body) => {
          sBody = body
          embed.setAuthor(body.NameZh_EN, `https://roexplorer.com/imgs/original_${body.Icon}.png`, `https://roexplorer.com/monster/${body.id}`)
            .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com`, message.author.avatarURL)
            .setDescription(`*${body.category_EN}*`)
            .setThumbnail(`https://roexplorer.com/imgs/original_${body.Icon}.png`)
          if (body.equip_effect !== undefined && body.equip_effect !== "") {
            var string = body.equip_effect.replace(/<br>/g, "\n")
            embed.addField("Equip Effect", string, true)
          }
          defaultEmbed = embed
          resolve(embed)
        })
      }
    }).then(async embed => {
      message.channel.send({ embed })
        .then(msg => msg.react('➕'))
        .then(async mReaction => {
          const rf = (reaction, user) => reaction.emoji.name === '➕' && user.id === message.author.id;
          const rf2 = (reaction, user) => reaction.emoji.name === '➖' && user.id === message.author.id;
          const rf3 = (reaction, user) => reaction.emoji.name === '🔒' && user.id === message.author.id;
          var locked = false

          // createReactionCollector - responds on each react, AND again at the end.
          const collector = mReaction.message
            .createReactionCollector(rf, { time: 300000 });
          const shrink = mReaction.message
            .createReactionCollector(rf2, { time: 300000 });
          const locker = mReaction.message
            .createReactionCollector(rf3, { time: 300000 });

          // set collector events
          collector.on('collect', async r => {
            await CreateEmbedForResult(sBody.id, sBody.Icon.includes('item'), message, true).then(newEmbed => {
              r.message.edit(newEmbed)
              mReaction.message.clearReactions().then(_ => {
                mReaction.message.react('➖')
                mReaction.message.react('🔒')
              })
            })
            //mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
          });
          collector.on('end', collected => {
            mReaction.message.clearReactions()
            if (!locked) {
              r.message.edit(defaultEmbed)
            }
            //mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
          });
          shrink.on('collect', r => {
            r.message.edit(defaultEmbed)
            mReaction.message.clearReactions().then(_ => {
              mReaction.message.react('➕')
              locked = false
            })
          });
          locker.on('collect', r => {
            locked = true
          });
        })
    }).catch(error => ReportError(error))

  } catch (error) {
    ReportError(error)
  }
}

client.on("message", async message => {
  try {
    // This event will run on every single message received, from any channel or DM.
    if (message.guild !== undefined && message.guild !== null) {
      const guildConf = client.guildsSettings.ensure(message.guild.id, defaultGuildsSettings)
      if (guildConf.linkEmbed === undefined) client.guildsSettings.set(message.guild.id, true, "linkEmbed")
      const userConf = client.usersSettings.ensure(message.author.id, defaultUsersSettings)

      if (guildConf.linkEmbed) {
        if (message.content.includes('roexplorer.com/')) {
          if (message.content.includes('/monster/')) {
            var a = message.content.replace(/(?:.*\/monster\/)(?=.*)/g, "")
            var c = ""
            for (let i = 0; i < a.split("").length; i++) {
              const b = a.split("")[i];
              if (isNaN(b))
                break
              c += b
            }
            await CreateEmbedForLink(message, c, true)
          } else if (message.content.includes('/item/')) {
            var a = message.content.replace(/(?:.*\/item\/)(?=.*)/g, "")
            var c = ""
            for (let i = 0; i < a.split("").length; i++) {
              const b = a.split("")[i];
              if (isNaN(b))
                break
              c += b
            }
            await CreateEmbedForLink(message, c, false)
          }
          return
        }
        if (message.content.includes('roguard.net/db/')) {
          if (message.content.includes('/monsters/')) {
            var a = message.content.replace(/(?:.*\/monsters\/)(?=.*)/g, "")
            var c = ""
            for (let i = 0; i < a.split("").length; i++) {
              const b = a.split("")[i];
              if (isNaN(b))
                break
              c += b
            }
            await CreateEmbedForLink(message, c, true)
          } else if (message.content.includes('/items/')) {
            var a = message.content.replace(/(?:.*\/items\/)(?=.*)/g, "")
            var c = ""
            for (let i = 0; i < a.split("").length; i++) {
              const b = a.split("")[i];
              if (isNaN(b))
                break
              c += b
            }
            await CreateEmbedForLink(message, c, false)
          }
          return
        }
      }

      // It's good practice to ignore other bots. This also makes your bot ignore itself
      // and not get into a spam loop (we call that "botception").
      if (message.author.bot) return;
      const mention = !(message.content.indexOf(`<@${client.user.id}>`) !== 0) || !(message.content.indexOf(`<@!${client.user.id}>`) !== 0)

      // Also good practice to ignore any message that does not start with our prefix, 
      // which is set in the configuration file.
      if (message.content.indexOf(guildConf.prefix) !== 0 && !mention) return;

      // We can use ensure() to actually grab the default value for settings,
      // if the key doesn't already exist. 

      // Here we separate our "command" name, and our "arguments" for the command. 
      // e.g. if we have the message "!db master poring" , we'll get the following:
      // command = db
      // args = ["master", "poring"]
      var args, command, subCommand
      try {
        args = message.content.slice(guildConf.prefix).trim().split(/ +/g);
        if (mention) args.shift().toLowerCase();
        command = args.shift().toLowerCase();
        command = command.replace(guildConf.prefix, "")
        if (command !== 'db' && command !== 'et') {
          if (mention)
            subCommand = command;
          else
            subCommand = args.shift().toLowerCase();
        }
      } catch (error) {
        //SendHelpEmbed(message)
      }

      // Command to search the database with text from user
      // e.g. !db jellopy
      if (command === "db") {
        try {
          var searchText = ""
          args.forEach(function (element, index, aray) {
            searchText += args[index] + " "
          });
          var msgIDs = []
          if (message.guild !== null)
            message.channel.fetchMessage(message).then(msg => msg.delete().catch(error => message.reply(`Couldn't delete messages because of: ${error}, re-invite the bot with new permissions (https://discordapp.com/oauth2/authorize?client_id=545676714689167380&scope=bot&permissions=388160)`)));
          var searchMsgID
          const embedSearch = new RichEmbed()
            .setColor(16056092)
            .setDescription(`${emojiGuilds[0].emojis.find(emoji => emoji.name === "loading1")} ***Searching for***  \`${searchText}\``)
          message.channel.sendEmbed(embedSearch).then(result => { try { searchMsgID = result.id } catch (error) { ReportError(error) } })
          //message.channel.startTyping(10)

          await SearchDatabase(searchText).then(async (results) => {
            var noResults = results.length > 0 ? false : true
            var embed

            if (!noResults)
              await CreateResultsEmbed(message, results, searchText).then(async (value) => {
                embed = value
                message.channel.fetchMessage(searchMsgID).then(msg => msg.delete())
                message.channel.send({ embed }).then(result => msgIDs.push(result))

                //message.channel.stopTyping(true)
                try {
                  var response = await message.channel.awaitMessages(msg2 => msg2.author === message.author && msg2.content > 0 && msg2.content < results.length + 1, {
                    maxMatches: 1,
                    time: 15000,
                    errors: ['time']
                  })
                  msgIDs.push(response.first())
                } catch (err) {
                  console.error(err);
                  message.channel.fetchMessage(msgIDs[0]).then(msg => msg.delete().catch(console.error))
                  if (!noResults) {
                    const embedSearch = new RichEmbed()
                      .setColor(16056092)
                      .setDescription(`${emojiGuilds[0].emojis.find(emoji => emoji.name === "rag_exclamation")} No or invalid value entered, cancelling search results selection.`)
                      .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
                    try {
                      const msg_2 = await message.channel.sendEmbed(embedSearch);
                      return await msg_2.delete(10000);
                    }
                    catch (error) {
                      return ReportError(error);
                    }
                  }
                  return null
                }
                var itemResult = results[parseInt(msgIDs[1].content) - 1]

                await CreateEmbedForResult(itemResult._source.id, itemResult._source.super_cat === 'item' ? true : false, message)

                if (message.guild !== null)
                  msgIDs.map((msg1) => message.channel.fetchMessage(msg1).then(msg => msg.delete()))

              })
            else
              await CreateNoResultsEmbed(message, searchText).then(async (value) => {
                embed = value
                try { await message.channel.fetchMessage(searchMsgID).then(msg => msg.delete()) } catch (error) { ReportError(error) }
                message.channel.send({ embed }).then(msg => msg.delete(10000))

              })
          })
        }
        catch (error) { ReportError(error) }
      }

      if (command === 'et') {
        var bool = guildConf.preferredServer === 'SEA'
        if (args[0] === 'global')
          bool = false
        else if (args[0] === 'sea')
          bool = true
        await GetEmbedET(message, bool)
      }

      if (command === 'k' || mention) {
        if (subCommand === 'help' || subCommand === '?') {
          if (config.commands.includes(args[0])) { // * !k ? [command]

          } else { // * !k help
            SendHelpEmbed(message)
          }
        }

        if (subCommand === "prefix") {
          if (args.length === 0) {
            var embed = new RichEmbed()
              .setColor(16056092)
              .setDescription(`Bot prefix is \`${client.guildsSettings.get(message.guild.id).prefix}\``)
            message.channel.send({ embed })
            message.delete()
            return
          }
          let can_manage_guild = message.channel.permissionsFor(message.member).has("MANAGE_GUILD", false);
          if (can_manage_guild) {
            try {
              client.guildsSettings.set(message.guild.id, args[0], "prefix")
              var embed = new RichEmbed()
                .setColor(16056092)
                .setFooter(`Changed by ${message.author.username}`, message.author.avatarURL)
                .setDescription(`Bot prefix is now \`${client.guildsSettings.get(message.guild.id).prefix}\``)
              message.channel.send({ embed })
              message.delete()
            }
            catch (error) { ReportError(error) }
          } else {
            message.author.send("You don't have permission to use this command")
          }
        }

        if (subCommand === "server") {
          let can_manage_guild = message.channel.permissionsFor(message.member).has("MANAGE_GUILD", false);
          try {
            var embed = new RichEmbed()
              .setColor(16056092)
              .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
            if (can_manage_guild)
              embed.setDescription(`Guild preferred server is now \`${client.guildsSettings.get(message.guild.id).preferredServer}\`\n\nYou can change it by reacting the emojis below:`)
            else
              embed.setDescription(`Guild preferred server is now \`${client.guildsSettings.get(message.guild.id).preferredServer}\``)
            const m = message.channel.send({ embed })
              .then(msg => msg.react('❌'))
            if (can_manage_guild) {
              m.then(mReaction => mReaction.message.react('🌏'))
                .then(mReaction => mReaction.message.react('🇺🇸'))
                .then(mReaction => {
                  const rf = (reaction, user) => reaction.emoji.name === '🇺🇸' && user.id === message.author.id;
                  const rf2 = (reaction, user) => reaction.emoji.name === '🌏' && user.id === message.author.id;
                  const rf3 = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;

                  const newEmbed = new RichEmbed()
                    .setColor(16056092)
                    .setFooter(`Changed by ${message.author.username}`, message.author.avatarURL)

                  // createReactionCollector - responds on each react, AND again at the end.
                  const global = mReaction.message
                    .createReactionCollector(rf, { time: 300000 });
                  const sea = mReaction.message
                    .createReactionCollector(rf2, { time: 300000 });
                  const collector = mReaction.message
                    .createReactionCollector(rf3, { time: 300000 });

                  // set collector events
                  collector.on('collect', r => {
                    mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
                  });
                  collector.on('end', collected => {
                    //mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
                  });
                  sea.on('collect', r => {
                    client.guildsSettings.set(message.guild.id, 'SEA', "preferredServer")
                    newEmbed.setDescription(`Preferred server is now \`${client.guildsSettings.get(message.guild.id).preferredServer}\``)
                    r.message.edit(newEmbed)
                      .catch(error => ReportError(error)); // useful for catching errors
                    mReaction.message.clearReactions()
                  });
                  global.on('collect', r => {
                    client.guildsSettings.set(message.guild.id, 'GLOBAL', "preferredServer")
                    newEmbed.setDescription(`Preferred server is now \`${client.guildsSettings.get(message.guild.id).preferredServer}\``)
                    r.message.edit(newEmbed)
                      .catch(error => ReportError(error)); // useful for catching errors
                    mReaction.message.clearReactions()
                  });
                })
            }
            message.delete()
          }
          catch (error) { ReportError(error) }
        }

        if (subCommand === "links" || subCommand === "link") {
          let can_manage_guild = message.channel.permissionsFor(message.member).has("MANAGE_GUILD", false);
          try {
            var embed = new RichEmbed()
              .setColor(16056092)
              .setFooter(`Requested by ${message.author.username}`, message.author.avatarURL)
            if (can_manage_guild)
              embed.setDescription(`Embed Links is now \`${client.guildsSettings.get(message.guild.id).linkEmbed ? "ENABLED" : "DISABLED"}\`\n\nYou can change it by reacting the emojis below:`)
            else
              embed.setDescription(`Embed Links is now \`${client.guildsSettings.get(message.guild.id).linkEmbed ? "ENABLED" : "DISABLED"}\``)
            const m = message.channel.send({ embed })
              .then(msg => msg.react('❌'))
            if (can_manage_guild) {
              m.then(mReaction => mReaction.message.react('✅'))
                .then(mReaction => mReaction.message.react('🔴'))
                .then(mReaction => {
                  const rf = (reaction, user) => reaction.emoji.name === '🔴' && user.id === message.author.id;
                  const rf2 = (reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id;
                  const rf3 = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;

                  const newEmbed = new RichEmbed()
                    .setColor(16056092)
                    .setFooter(`Changed by ${message.author.username}`, message.author.avatarURL)

                  // createReactionCollector - responds on each react, AND again at the end.
                  const disable = mReaction.message
                    .createReactionCollector(rf, { time: 300000 });
                  const enable = mReaction.message
                    .createReactionCollector(rf2, { time: 300000 });
                  const collector = mReaction.message
                    .createReactionCollector(rf3, { time: 300000 });

                  // set collector events
                  collector.on('collect', r => {
                    mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
                  });
                  collector.on('end', collected => {
                    //mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
                  });
                  enable.on('collect', r => {
                    client.guildsSettings.set(message.guild.id, true, "linkEmbed")
                    newEmbed.setDescription(`Embed Links is now \`${client.guildsSettings.get(message.guild.id).linkEmbed ? "ENABLED" : "DISABLED"}\``)
                    r.message.edit(newEmbed)
                      .catch(error => ReportError(error)); // useful for catching errors
                    mReaction.message.clearReactions()
                  });
                  disable.on('collect', r => {
                    client.guildsSettings.set(message.guild.id, false, "linkEmbed")
                    newEmbed.setDescription(`Embed Links is now \`${client.guildsSettings.get(message.guild.id).linkEmbed ? "ENABLED" : "DISABLED"}\``)
                    r.message.edit(newEmbed)
                      .catch(error => ReportError(error)); // useful for catching errors
                    mReaction.message.clearReactions()
                  });
                })
            }
            message.delete()
          }
          catch (error) { ReportError(error) }
        }

        if (subCommand === 'error') {
          var msg = args.toString().replace(/,/g, " ")
          client.channels.get('550102049371586591').send(`**@${message.author.tag} sent: **` + msg)
          message.author.send("Thanks for reporting an error!\n\nDon't forget do enter our Discord Server to check out news and all bot features!\nhttps://discord.gg/8tUbHsV")
        }

        if (subCommand === 'suggestion') {
          var msg = args.toString().replace(/,/g, " ")
          client.channels.get('550101218605924353').send(`**@${message.author.tag} sent: **` + msg)
          message.author.send("Thanks for making a suggestion!\n\nDon't forget do enter our Discord Server to check out news and all bot features!\nhttps://discord.gg/8tUbHsV")
        }

        if (subCommand === "purge" && message.author.id === '283415253696512000') { // * !k purge [number]
          // This command removes all messages from all users in the channel, up to 100.

          // get the delete count, as an actual number.
          const deleteCount = parseInt(args[0], 10);

          // Ooooh nice, combined conditions. <3
          if (!deleteCount || deleteCount < 2 || deleteCount > 100)
            return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

          // So we get our messages, and delete them. Simple enough, right?
          const fetched = await message.channel.fetchMessages({ limit: deleteCount });
          message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`Couldn't delete messages because of: ${error}, re-invite the bot with new permissions (https://discordapp.com/oauth2/authorize?client_id=545676714689167380&scope=bot&permissions=388160)`));
        }
      }
    }
    else { SendHelpEmbed(message) }
  } catch (error) { ReportError(error) }
});

// 
// Functions //
//

function SendHelpEmbed(message) {
  try {
    var helpEmbed = new RichEmbed()
      .setAuthor('Bot commands', 'https://cdn0.iconfinder.com/data/icons/free-social-media-set/24/discord-512.png', 'https://discordbots.org/bot/545676714689167380')
      .setThumbnail('https://cdn.discordapp.com/avatars/545676714689167380/5c9ab8430eebd5704bf14fe0f84d67bc.png?size=128')
      .setColor(16056092)
      .setDescription(`[DiscordBots](https://discordbots.org/bot/545676714689167380) | [Support me on Patreon](https://www.patreon.com/kafrabot) | [Invite me](https://discordapp.com/oauth2/authorize?client_id=545676714689167380&scope=bot&permissions=388160) | [Discord Server](https://discord.gg/8tUbHsV)` + "\n󠀡")
      .setFooter('Bot made by Faga#3522', 'https://cdn.discordapp.com/avatars/283415253696512000/3ffa8ae3ccfdb08aa74adb7b937bcbfb.png?size=128')
      .addField('`!db [text]`', 'Search database for an item or monster and return the results\n***e.g.** !db anolian*' + "\n󠀡")
      .addField('`!et` or `!et [sea/global]`', 'Shows the endless tower MVPs list\n***e.g.** !et*' + "\n󠀡")
      .addField('`!k prefix [new prefix]` or `@Kafra-Bot prefix`', 'Change or check the bot prefix in the guild\n***e.g.** @Kafra-Bot prefix ->*' + "\n󠀡")
      .addField('`!k server`', 'Change or check the guild\'s preferred server *(SEA or Global)*\n***e.g.** !k server*' + "\n󠀡")
      .addField('`!k links`', 'Enable or disable embed messages for some database links\n***e.g.** !k links*' + "\n󠀡")
      .addField('`!k error [message]`', 'Make a report of an error to the dev, please use moderately\n***e.g.** !k error This is a error: https://i.imgur.com/Jy35v5h.png*' + "\n󠀡")
      .addField('`!k suggestion [message]`', 'Make a suggestion of an idea to the dev, please use moderately\n***e.g.** !k suggestion Add Apex Legends items!*' + "\n󠀡")
      .addField("Reactions Description", "`❌` - deletes the message\n`🔒` - the message won't be auto deleted\n`🔄` - swaps the message page\n`💴` - calculates the price of items upgrades\n`📊` - shows an exchange chart of the item\n***Reactions disappears after 5 minutes***\n\n***You can always mention the bot to trigger a command***\n***e.g.** @Kafra-Bot [command] [?arg]*" + "\n󠀡")
    message.author.sendEmbed(helpEmbed)
    if (message.guild !== undefined && message.guild !== null)
      message.channel.fetchMessage(message).then(msg => msg.delete())
  } catch (error) { ReportError(error) }
}

const request_body = ['{"preference":"searchbox"}\n{"_source": ["NameZh_ragmobile", "super_cat", "category_ragmobile", "Icon" , "id", "Level"] ,"query":{"bool":{"must":[{"bool":{"must":{"bool":{"should":[{"multi_match":{"query":"',
  '","fields":["NameZh_ragmobile"],"type":"best_fields","operator":"or","fuzziness":1}},{"multi_match":{"query":"',
  '","fields":["NameZh_ragmobile"],"type":"phrase_prefix","operator":"or"}}],"minimum_should_match":"1"}}}}]}},"size":12}\n']

async function SearchDatabase(searchKey) {
  try {
    // Make the request to database (roexplorer.com)
    var results = []
    let promise = new Promise((resolve, reject) => {
      request.post(
        {
          headers: {
            'accept': 'accept: application/json',
            'Referer': `https://roexplorer.com/`,
            'Origin': 'https://roexplorer.com',
            'User-Agent': 'Kafra Bot',//'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
            'content-type': 'application/x-ndjson'
          },
          uri: 'https://search.roexplorer.com/explore/item/_msearch?',
          body: request_body[0] + searchKey + request_body[1] + searchKey + request_body[2],
          method: 'POST'
        },
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var jsonData = JSON.parse(body)
            var hits = jsonData.responses[0].hits.hits
            var fetch = hits.length
            if (fetch > 10) fetch = 10 // Displayed results limit
            var fetchedNames = []
            for (let i = 0; i < fetch; i++) {
              const hit = hits[i];
              // Remove all duplicate results (with same name)
              if (!fetchedNames.includes(hit._source.NameZh_ragmobile) || !fetchedNames.includes(hit._source.Icon)) {
                fetchedNames.push(hit._source.NameZh_ragmobile)
                results.push(hit)
              }
            }
            setTimeout(() => resolve(true), 200)
          }
          if (error !== null)
            ReportError(`${error}`)
          ReportLog(`StatusCode: ${response.statusCode}`)
          resolve(results)
        })
    }).catch((error) => {
      ReportError(error)
    });
    await promise.then((value) => { return value })
    let result = await promise;
    return results
  } catch (error) { ReportError(error) }
}

function GetEmoji(emojiName) {
  // Retrieve the specified emoji from the emoji Map
  var emojiToReturn = emojis.get('no_img')
  try {
    if (emojis.get(`original_${emojiName}`) !== undefined) {
      return emojis.get(`original_${emojiName}`)
    }
  } catch (error) {
    ReportError(error)
  }
  return emojiToReturn
}

async function CreateResultsEmbed(message, results, searchText) {
  try {
    // Make the embed message for the search results
    var tempDesc = ""
    var index = 0
    var embed
    let promise = new Promise((resolve, reject) => {
      embed = new RichEmbed()
        .setAuthor(`Search Results for:`, `https://roexplorer.com/theme/img/logos/logo.png`)
        .setTitle(`\`${searchText}\``)
        .setColor(16056092)
        .setThumbnail(`https://roexplorer.com/theme/img/logos/logo.png`)
        .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com`, message.author.avatarURL)
      tempDesc += `󠀡\n`
      for (let i = 0; i < results.length; i++) {
        const result = results[i]._source;
        tempDesc += `\`${++index} -\` `
        tempDesc += GetEmoji(result.Icon)
        if (result.super_cat === "monster")
          tempDesc += ` [${result.NameZh_ragmobile}](https://roexplorer.com/monster/${result.id}) *Level ${result.Level}*\n`
        else
          tempDesc += ` [${result.NameZh_ragmobile}](https://roexplorer.com/item/${result.id}) *${result.category_ragmobile}*\n`
      }
      resolve(embed)
      setTimeout(() => resolve(true), 100)
    }).catch((error) => {
      ReportError(error)
    });
    await promise.then(async (value) => {
      embed.addField(`󠀡\n**Please provide a value to select one of the search results ranging from 1 *to* ${results.length}.**`, `󠀡\nMessage will expire in:${emojiGuilds[0].emojis.find(emoji => emoji.name === "countdown")}`)
      embed.setDescription(tempDesc)
      let result = await promise;
      return value
    })
    let result = await promise;
    return embed
  } catch (error) { ReportError(error) }
}

async function CreateNoResultsEmbed(message, searchText) {
  try {
    // Same as the function above, but for when have no results on the search
    var embed
    let promise = new Promise((resolve, reject) => {
      embed = new RichEmbed()
        .setAuthor(`Search Results for: ${searchText}`, `https://roexplorer.com/theme/img/logos/logo.png`)
        .setDescription(`󠀡*Requested by* <@${message.author.id}>

  **No results.. :(**
  󠀡`)
        .setColor(16056092)
        .setThumbnail(`https://roexplorer.com/theme/img/logos/logo.png`)
        .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com`, message.author.avatarURL)
      resolve(embed)
    }).catch((error) => {
      ReportError(error)
    });
    promise.then(async (value) => {
      let result = await promise;
      return value
    })
    let result = await promise;
    return embed
  } catch (error) { ReportError(error) }
}

function ReportError(error) {
  try{
    // Log an error on console and on a specified channel on Discord
    console.log(`ERROR: ${error.stack}`)
    client.channels.get('547460398983544844').send(`ERROR: ${error.stack} \n<@283415253696512000>`);
  }catch(error){console.log(error)}
}

function ReportLog(log) {
  try{
    // Log a message on console and on a specified channel on Discord
    console.log(`LOG: ${log}`)
    client.channels.get('547955479914217482').send(`LOG: ${log}`);
  } catch(error){console.log(error)}
}

async function CreateEmbedForResult(id, isItem, message, returnEmbed = false) {
  try {
    // Make the embed message for the item searched and chosen

    if (isItem) {
      // Embed for items

      var sBody, hasExchange = false
      let promise = new Promise((resolve, reject) => {
        try {
          request(`https://roexplorer.com/items_json/${id}.json`, { json: true }, (err, res, body) => {
            if (err) { return ReportError(err); }
            var embed = new RichEmbed()
              .setAuthor(`${body.NameZh_EN}`, `https://roexplorer.com/imgs/original_${body.Icon}.png`, `https://roexplorer.com/item/${body.id}`)
              .setDescription(`*${body.category_EN}*` + "\n󠀡")
              .setThumbnail(`https://roexplorer.com/imgs/original_${body.Icon}.png`)
              .setColor(16056092)
              .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com & romexchange.com`, message.author.avatarURL)

            var quantity = 0
            sBody = body
            // Equip Effect
            try {
              if (body.equip_effect !== undefined && body.equip_effect !== "") {
                var string = body.equip_effect.replace(/<br>/g, "\n")
                embed.addField("Equip Effect", string, true)
              }
            } catch (error) { ReportError(error) }
            // Equip Special Effect
            try {
              if (body.equip_uniq_effect !== undefined && body.equip_uniq_effect !== "") {
                var string = body.equip_uniq_effect.replace(/<br>/g, "\n")
                embed.addField("Equip Special Effect", string + "󠀡", true)
              }
            } catch (error) { ReportError(error) }
            // Equip Bonus
            try {
              if (body.equip_desc !== undefined && body.equip_desc !== "") {
                var string = body.equip_desc.replace(/<br>/g, "\n") + "\n󠀡"
                embed.addField("Equip Bonus", string) // Reset inline fields
              }
            } catch (error) { ReportError(error) }
            try {
              if (body.card_effect !== undefined && body.card_effect.length > 0 && body.card_effect !== "") {
                var string = ""
                body.card_effect.map(effect => string += effect + "\n")
                embed.addField("Card Effect", string + "󠀡", true)
              }
            } catch (error) { ReportError(error) }
            try {
              if (body.card_deposit_reward !== undefined && body.card_deposit_reward.length > 0 && body.card_deposit_reward !== "") {
                var string = ""
                body.card_deposit_reward.map(effect => string += effect + "\n")
                embed.addField("Card Deposit Reward", string + "󠀡", true)
              }
            } catch (error) { ReportError(error) }
            try {
              if (body.card_unlock_reward !== undefined && body.card_unlock_reward.length > 0 && body.card_unlock_reward !== "") {
                var string = ""
                body.card_unlock_reward.map(effect => string += effect + "\n")
                embed.addField("Card Unlock Reward", string + "󠀡")
              }
            } catch (error) { ReportError(error) }
            var inline_fields = 0
            // Dropped by
            try {
              if (body.dropped_by !== undefined && body.dropped_by.length > 0) {
                var s = ""
                var q = 0
                body.dropped_by.length > 8 ? quantity = 8 : quantity = body.dropped_by.length
                body.dropped_by.length > 8 ? q = 8 : q = body.dropped_by.length
                for (let i = 0; i < q; i++) {
                  const mob = body.dropped_by[i];
                  s += `${GetEmoji(mob.icon)}[${mob.mob_name_EN}](https://roexplorer.com/monster/${mob.mob_id}) ${mob.rate === 0 ? "??" : (mob.rate * 100.0).toFixed(2)}%\n`
                }
                //s += "\n󠀡"
                embed.addField("Dropped by", s + "󠀡", true)
                //quantity = body.dropped_by.length
                inline_fields++
              }
            } catch (error) { ReportError(error) }
            // Obtain by Crafting
            try {
              if (body.composed !== undefined && body.composed !== "" && body.composed.length > 0) {
                var string = body.composed.map(item => `${numeral(item.num).format('0,0')} x ${GetEmoji(`item_${item.id}`)}[${item.name}](https://roexplorer.com/item/${item.id})`).join("\n")
                if (body.composed_npc_map_desc !== undefined && body.composed_npc_map_desc !== "" && body.composed_npc_name !== undefined && body.composed_npc_name !== "")
                  string += `\n**NPC:** ${body.composed_npc_name} (${body.composed_npc_map_desc})`
                embed.addField("Obtain by Crafting", string + "\n󠀡", true)
                inline_fields++
              }
            } catch (error) { ReportError(error) }
            // Used to craft
            try {
              if (body.crafts !== undefined && body.crafts.length > 0) {
                if (quantity < 5) quantity = 5
                if (quantity > body.crafts.length) quantity = body.crafts.length
                var string = ""
                for (let i = 0; i < quantity; i++) {
                  const item = body.crafts[i]
                  string += (`${GetEmoji(item.icon)}[${item.name}](https://roexplorer.com/item/${item.id}) (${numeral(item.num).format('0,0')}x)\n`)
                }
                embed.addField("Used to craft", string + "󠀡", true)
                inline_fields++
              }
            } catch (error) { ReportError(error) }
            // Can be upgraded to
            try {
              if (body.equip_upgrade_product !== undefined && body.equip_upgrade_product !== "" && body.equip_upgrade_product.length > 0) {
                var id = body.equip_upgrade_product.split('item/').pop().split('">')[0] // same as '.replace(/.*item\/|">.*/g, "")'
                var string = `${GetEmoji(`item_${id}`)} [${body.equip_upgrade_product.replace(/<a.*">|<.*>/g, "")}](https://roexplorer.com/item/${id})` + "\n󠀡"
                embed.addField("Can be upgraded to", string, true)
                inline_fields++
              }
              if (inline_fields % 2 !== 0) {
                embed.addField("󠀡", "󠀡", true)
              }
            } catch (error) { ReportError(error) }
            // Upgrade 1,2,3...      
            try {
              if (body.equip_upgrade !== undefined && body.equip_upgrade !== "" && body.equip_upgrade.length > 0) {
                for (let i = 0; i < body.equip_upgrade.length; i++) {
                  const upgrade = body.equip_upgrade[i].materials.split('\n');
                  var string = ""
                  for (let j = 0; j < upgrade.length - 1; j++) {
                    const material = upgrade[j];
                    var name = material.replace(/.*X |<a.*">|<.*>/g, "") // Steel
                    var id = material.replace(/.*item\/|">.*/g, "") // 52402
                    var num = material.replace(/ X.*/g, "") // 15
                    string += `${numeral(num).format('0,0')} x ${GetEmoji(`item_${id}`)} [${name}](https://roexplorer.com/item/${id})\n`
                  }
                  if (i > 1) string += "󠀡"
                  embed.addField(`Upgrade ${i + 1}`, string, true)
                }
                var descString = ""
                for (let i = 0; i < body.equip_upgrade.length; i++) {
                  const desc = body.equip_upgrade[i].desc
                  descString += `\n**Upgrade ${i + 1}**\n` + desc + "\n"
                }
                embed.addField("Upgrades Descriptions", descString + "󠀡")
              }
            } catch (error) { ReportError(error) }
            // Exchange
            try {
              request(`https://www.romexchange.com/api?exact=true&sort_dir=desc&sort_range=week&item=${encodeURIComponent(body.NameZh_EN)}`, { json: true }, (err, res, body2) => {
                if (body2[0] !== undefined && body2 !== []) {
                  hasExchange = true
                  try {
                    var diffG = body2[0].global.week.change.toString()
                    var diffS = body2[0].sea.week.change.toString()
                    embed.addField("Exchange (Latest price)", `**Global:** ${GetEmoji("item_100")} ${numeral(body2[0].global.latest).format('0,0')} \`${diffG.startsWith('-') ? `${diffG}% 📉` : `+${diffG}% 📈`}\`\n**SEA:** ${GetEmoji("item_100")} ${numeral(body2[0].sea.latest).format('0,0')} \`${diffS.startsWith('-') ? `${diffS}% 📉` : `+${diffS}% 📈`}\`` + "\n󠀡")
                  } catch (error) { ReportError(error) }
                }
                if (body.Desc_EN !== undefined && body.Desc_EN !== "") embed.addField("Description", body.Desc_EN + "\n󠀡")
                resolve({ embed, body2 })
              })
            } catch (error) { ReportError(error) }
          })
        } catch (error) { ReportError(error) }
      }).catch((error) => {
        ReportError(error)
      });
      promise.then((value) => {
        var a = message.channel.sendEmbed(value.embed).then(msg => msg.react('❌'))
          .then(mReaction => mReaction.message.react('🔒'))
        // if (hasExchange)
        //   a.then(mReaction => mReaction.message.react('📊'))
        if (sBody.equip_upgrade !== undefined && sBody.equip_upgrade !== "" && sBody.equip_upgrade.length > 0)
          a.then(mReaction => mReaction.message.react('💴'))
        a.then(mReaction => {
          const reactionFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
          const reactionFilter2 = (reaction, user) => reaction.emoji.name === '🔒' && user.id === message.author.id;
          const reactionFilter3 = (reaction, user) => reaction.emoji.name === '📊' && user.id === message.author.id;
          const reactionFilter4 = (reaction, user) => reaction.emoji.name === '💴' && user.id === message.author.id;
          var locked = false
          var enabledExchange = false
          var enabledCalc = false

          // createReactionCollector - responds on each react, AND again at the end.
          const collector = mReaction.message
            .createReactionCollector(reactionFilter, { time: 300000 });
          const locker = mReaction.message
            .createReactionCollector(reactionFilter2, { time: 300000 });
          const exchangeChart = mReaction.message
            .createReactionCollector(reactionFilter3, { time: 300000 });
          const upgradeCalc = mReaction.message
            .createReactionCollector(reactionFilter4, { time: 300000 });

          // set collector events
          collector.on('collect', r => {
            mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
          });
          collector.on('end', r => {
            if (!locked)
              mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
            mReaction.message.clearReactions()
          });
          locker.on('collect', r => {
            locked = true
          });
          exchangeChart.on('collect', async (r) => {
            if (!enabledExchange) {
              enabledExchange = true
              ExchangeChartEmbed(message, value, sBody, mReaction)
            }
          });
          upgradeCalc.on('collect', r => {
            if (!enabledCalc) {
              //Do something
              enabledCalc = true
              UpgradesPriceEmbed(message, sBody, mReaction)
            }
          });
        })
      })
    } else if (!isItem) {
      // Embed for monsters
      var results
      let promise = new Promise((resolve, reject) => {
        try {
          request(`https://roexplorer.com/monsters_json/${id}.json`, { json: true }, (err, res, body) => {
            if (err) { return ReportError(err); }
            var embed = new RichEmbed()
              .setAuthor(`${body.NameZh_EN}`, `https://roexplorer.com/imgs/original_${body.Icon}.png`, `https://roexplorer.com/monster/${body.id}`)
              .setImage(`https://roexplorer.com/imgs/${body.Icon}.jpg`)
              .setColor(16056092)
            !
              embed.setDescription(`*${body.monster_type}*` + "\n󠀡")
                .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com`, message.author.avatarURL)
                .addField("Level", `${body.Level}`, true)
                .addField("Zone", `${body.Zone}`, true)
                .addField("Shape", `${body.Shape}`, true)
                .addField("Race", `${body.Race_EN}`, true)
                .addField("Nature", `${body.Nature}`, true)
                .addField("Passive Level", `${body.PassiveLv}`, true)
                .addField("Base Exp points", `${numeral(body.BaseExp).format('0,0')}`, true)
                .addField("Job Exp points", `${numeral(body.JobExp).format('0,0')}` + "\n󠀡", true)
                .addField("󠀡", "󠀡", true)
                .addField("HP", `${numeral(body.Hp).format('0,0')}`, true)
                .addField("ATK", `${numeral(body.Atk).format('0,0')}`, true)
                .addField("MATK", `${numeral(body.MAtk).format('0,0')}`, true)
                .addField("DEF", `${numeral(body.Def).format('0,0')}`, true)
                .addField("MDEF", `${numeral(body.MDef).format('0,0')}` + "\n󠀡", true)
                .addField("󠀡", "󠀡", true)
                .addField("Hit", `${numeral(body.Hit).format('0,0')}`, true)
                .addField("Flee", `${numeral(body.Flee).format('0,0')}`, true)
                .addField("Move Speed", `${numeral(body.MoveSpd).format('0,0')}`, true)
                .addField("ASPD", `${numeral(body.AtkSpd).format('0,0')}` + "\n󠀡", true)
                .addField("󠀡", "󠀡", true)
                .addField("󠀡", "󠀡", true)

            if (body.drops !== undefined && body.drops !== []) {
              var col = (body.drops.length / 2).toFixed(0) // e.g.: 9 / 2 = 5
              for (let i = 1; i < 3; i++) {
                var string = ""
                for (let j = col * (i - 1); j < col * i; j++) {
                  const drop = body.drops[j];
                  if (drop !== undefined) {
                    string += `${GetEmoji(drop.item_icon)} [${drop.item_name_EN}](https://roexplorer.com/item/${drop.item_id}) `
                    drop.rate === 0 ? string += "?%" : string += `${(drop.rate * 100.0).toFixed(2)}%`
                    string += '\n'
                  }
                }
                var title = ""
                i === 1 ? title = "Drops" : title = "󠀡"
                embed.addField(title, string + "󠀡", true)
              }
            }

            if (body.Desc_EN !== "" && body.Desc_EN !== undefined) embed.addField("Description", `${body.Desc_EN}` + "\n󠀡", false)
            if (body.appears_in !== undefined) embed.addField("Can be found at", `${body.appears_in.map(map => map.map_name).join('\n')}` + "\n󠀡", false)
            results = embed
            resolve(embed)
          })
        } catch (error) { ReportError(error) }
      }).catch((error) => {
        ReportError(error)
      });
      if (returnEmbed) {
        await promise.then((value) => { return value })
        let result = await promise;
        return results
      }
      promise.then((embed) => {
        message.channel.sendEmbed(embed)
          .then(msg => msg.react('❌'))
          .then(mReaction => mReaction.message.react('🔒'))
          .then(mReaction => {
            const reactionFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
            const reactionFilter2 = (reaction, user) => reaction.emoji.name === '🔒' && user.id === message.author.id;
            var locked = false

            // createReactionCollector - responds on each react, AND again at the end.
            const collector = mReaction.message
              .createReactionCollector(reactionFilter, { time: 300000 });
            const locker = mReaction.message
              .createReactionCollector(reactionFilter2, { time: 300000 });

            // set collector events
            collector.on('collect', r => {
              mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
            });
            collector.on('end', collected => {
              if (!locked)
                mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
              mReaction.message.clearReactions()
            });
            locker.on('collect', r => {
              locked = true
            });
          })
      })
    }
  } catch (error) { ReportError(error) }
}

async function GetEmbedET(message, sea) {
  try {
    var et = []
    var requestURL = `https://surgatekno.com/wp-content/tables/endless-tower-global-weekly.csv`
    if (sea)
      requestURL = `https://surgatekno.com/wp-content/tables/endless-tower-weekly.csv`
    request(requestURL, { json: true }, (err, res, body) => {
      if (body[0] !== undefined && body !== []) {
        var json = Papa.parse(body)

        for (let i = 1; i < json.data.length; i++) {
          var channel = []
          const channels = json.data[i];
          for (let j = 1; j < channels.length; j++) {
            const floors = channels[j];
            var floor = []
            var c = floors.replace(/(mvp\/)(.*?)(\.png)/g, function (match, submatch1, submatch2) {
              floor.push(submatch2)
              return ""
            })
            string += " "
            channel.push(floor)
          }
          et.push(channel)
        }
        var embed = new RichEmbed()
          .setAuthor(`Endless Tower ${sea ? 'SEA' : 'Global'} MVP list`, "https://i2.wp.com/surgatekno.com/wp-content/uploads/2018/12/favicon.png?fit=32%2C32&ssl=1", sea ? "https://surgatekno.com/endless-tower/" : "https://surgatekno.com/endless-tower-global/")
          .setColor(16056092)
          .setFooter(`Requested by ${message.author.username} | Powered by surgatekno.com`, message.author.avatarURL)
          .setDescription("󠀡")

        for (let i = 0; i < et.length / 2 - 1; i++) {
          const channel = et[i];
          var string = ""
          for (let j = 0; j < channel.length; j++) {
            const floor = channel[j];
            if (j === 6) string += "\n"
            string += `**${j * 10 + 10}F:** `
            for (let z = 0; z < floor.length; z++) {
              const mob = floor[z];
              string += `${GetEmoji(mob)}`
            }
            string += " "
          }
          embed.addField(`Channel ${i === 9 ? '0' : i + 1}`, string + "\n󠀡")
        }

        message.channel.send({ embed })
          .then(msg => msg.react('🔄'))
          .then(mReaction => mReaction.message.react('❌'))
          .then(mReaction => mReaction.message.react('🔒'))
          .then(mReaction => {
            const reactionFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
            const reactionFilter2 = (reaction, user) => reaction.emoji.name === '🔒' && user.id === message.author.id;
            const reactionFilter3 = (reaction, user) => reaction.emoji.name === '🔄' && user.id === message.author.id;
            var locked = false
            var page = true

            // createReactionCollector - responds on each react, AND again at the end.
            const collector = mReaction.message
              .createReactionCollector(reactionFilter, { time: 300000 });
            const locker = mReaction.message
              .createReactionCollector(reactionFilter2, { time: 300000 });
            const changePage = mReaction.message
              .createReactionCollector(reactionFilter3, { time: 300000 });

            // set collector events
            collector.on('collect', r => {
              mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
            });
            collector.on('end', r => {
              if (!locked)
                mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
              mReaction.message.clearReactions()
            });
            locker.on('collect', r => {
              locked = true
            });
            changePage.on('collect', r => {
              page = !page
              var index = 0
              var l = et.length / 2 - 1
              if (!page) {
                index = Math.ceil(et.length / 2 - 1)
                l = et.length
              }
              // create new embed with old title & description, new field
              const newEmbed = new RichEmbed({
                author: embed.author,
                color: embed.color,
                description: embed.description,
                footer: embed.footer
              });
              for (let i = index; i < l; i++) {
                const channel = et[i];
                if (!channel.length > 0) continue
                var string = ""
                for (let j = 0; j < channel.length; j++) {
                  const floor = channel[j];
                  if (j === 6) string += "\n"
                  string += `**${j * 10 + 10}F:** `
                  for (let z = 0; z < floor.length; z++) {
                    const mob = floor[z];
                    string += `${GetEmoji(mob)}`
                  }
                  string += " "
                }
                newEmbed.addField(`Channel ${i === 9 ? '0' : i + 1}`, string + "\n󠀡")
              }

              // edit message with new embed
              // NOTE: can only edit messages you author
              r.message.edit(newEmbed)
                .catch(error => ReportError(error)); // useful for catching errors
            })
          })
        message.channel.fetchMessage(message).then(msg => msg.delete())
      }
    })
  } catch (error) { ReportError(error) }
}

async function UpgradesPriceEmbed(message, sBody, mReaction) {
  try {
    const embedSearch = new RichEmbed()
      .setColor(16056092)
      .setDescription(`${emojiGuilds[0].emojis.find(emoji => emoji.name === "loading1")} ***Fetching exchange prices and calculating...***`)
    let searchMsg
    message.channel.sendEmbed(embedSearch).then(msg => {
      searchMsg = msg.id
      message.channel.startTyping(10)
    })

    var embed = new RichEmbed()
      .setAuthor(`Showing upgrades price of ${sBody.NameZh_EN}`, `https://roexplorer.com/imgs/original_${sBody.Icon}.png`, `https://roexplorer.com/item/${sBody.id}`)
      .setColor(16056092)
      .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com & romexchange.com`, message.author.avatarURL)
    var names = [[[]]]
    names.shift()
    for (let i = 0; i < sBody.equip_upgrade.length; i++) {
      const upgrade = sBody.equip_upgrade[i].materials.split('\n');
      var string = ""
      var upgradeA = [[]]
      upgradeA.shift()
      for (let j = 0; j < upgrade.length - 1; j++) {
        const material = upgrade[j];
        var name = material.replace(/.*X |<a.*">|<.*>/g, "") // Steel
        var id = material.replace(/.*item\/|">.*/g, "") // 52402
        var num = material.replace(/ X.*/g, "") // 15
        if (name === "Zeny")
          upgradeA.push([num, name, id, 1])
        else
          upgradeA.push([num, name, id])
      }
      names.push(upgradeA)
      //if (i > 1) string += "󠀡"
      //embed.addField(`Upgrade ${i + 1}`, string + "󠀡", true)
    }

    let promise2 = new Promise((resolve2) => {
      var prices = 0
      var priceble = 0
      for (let i = 0; i < names.length; i++) {
        const element = names[i];
        for (let j = 0; j < element.length; j++) {
          const name = element[j][1];
          //if (name !== "Zeny")
          priceble++
        }
      }

      for (let i = 0; i < names.length; i++) {
        const element = names[i];
        for (let j = 0; j < element.length; j++) {
          const name = element[j][1];
          let promise = new Promise((resolve) => {
            var g = 0
            var s = 0
            for (let q = 0; q < names.length; q++) {
              const element = names[q];
              for (let p = 0; p < element.length; p++) {
                const element2 = element[p];
                if (name !== 'Zeny' && element2 === name && element2[3] !== undefined && element2[3] !== 0) {
                  resolve([element12[3], element22[3]])
                }
              }
            } // TODO: Use Roexplorer as first option source (shows item volume)
            //names[0].map(n => n.map(u => { if (u[1] === name && u[3] !== undefined && u[3] !== 0) resolve(u[3]) }))
            request(`https://www.romexchange.com/api?exact=true&sort_dir=desc&sort_range=week&item=${encodeURIComponent(name)}`, { json: true }, (err, res, body2) => {
              if (body2 !== undefined && body2[0] !== undefined && body2 !== []) {
                try {
                  g = body2[0].global.latest
                  s = body2[0].sea.latest
                } catch (error) {
                  g = 0
                  s = 0
                  ReportError(error)
                }
              }
              resolve([g, s])
            })
          })
          promise.then((value) => {
            names[i][j].push(value[0]) // value[0] = GLOBAL // value[1] = SEA
            names[i][j].push(value[1]) // value[0] = GLOBAL // value[1] = SEA
            prices++
            if (prices === priceble)
              resolve2(names)
          })
        }
      }
    }).catch((error) => {
      ReportError(error)
    });
    promise2.then((value) => {
      const guildConf = client.guildsSettings.ensure(message.guild.id, defaultGuildsSettings)
      var totaltotal = 0
      var index = guildConf.preferredServer === "GLOBAL" ? 0 : 1
      embed.setDescription(index === 0 ? "*Global*" : "*SEA*")
      for (let i = 0; i < value.length; i++) {
        const element = value[i];
        var string = ""
        var total = 0
        for (let j = 0; j < element.length; j++) { // element2[0] = quantity / element2[1] = name / element2[2] = id / element2[3] = price
          const element2 = element[j];

          string += `${numeral(element2[0]).format('0,0')} x ${GetEmoji(`item_${element2[2]}`)} [${element2[1]}](https://roexplorer.com/item/${element2[2]}) ${element2[2] !== '100' ? (`= ${numeral(numeral(element2[0]).value() * numeral(element2[3 + index]).value()).format('0,0')}`) : ""}\n`
          total += numeral(element2[0]).value() * numeral(element2[3 + index]).value()
        }
        string += `**Total:** ${GetEmoji("item_100")} ${numeral(total).format('0,0')}\n`
        totaltotal += total
        if (i > 1) string += "󠀡"
        embed.addField(`Upgrade ${i + 1}`, string + "󠀡", true)
      }
      embed.addField("Total Sum", `${GetEmoji('item_100')} ${numeral(totaltotal).format('0,0')}` + "\n󠀡")

      message.channel.fetchMessage(searchMsg).then(msg => msg.delete())
      message.channel.stopTyping(true)
      mReaction.message.channel.send({ embed })
        .then(msg => msg.react('🔄'))
        .then(mReaction => mReaction.message.react('🔒'))
        .then(mReaction => mReaction.message.react('❌'))
        .then(mReaction => {
          const reactionFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
          const reactionFilter2 = (reaction, user) => reaction.emoji.name === '🔒' && user.id === message.author.id;
          const reactionFilter3 = (reaction, user) => reaction.emoji.name === '🔄' && user.id === message.author.id;
          var locked = false

          // createReactionCollector - responds on each react, AND again at the end.
          const collector = mReaction.message
            .createReactionCollector(reactionFilter, { time: 300000 });
          const locker = mReaction.message
            .createReactionCollector(reactionFilter2, { time: 300000 });
          const changePage = mReaction.message
            .createReactionCollector(reactionFilter3, { time: 300000 });

          // set collector events
          collector.on('collect', r => {
            mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
          });
          collector.on('end', r => {
            if (!locked)
              mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
            mReaction.message.clearReactions()
          });
          locker.on('collect', r => {
            locked = true
          });
          changePage.on('collect', r => {
            index = index === 1 ? 0 : 1
            var desc = index === 0 ? "*Global*" : "*SEA*"

            // create new embed with old title & description, new field
            const newEmbed = new RichEmbed({
              author: embed.author,
              color: embed.color,
              description: desc,
              footer: embed.footer
            });

            var totaltotal = 0
            for (let i = 0; i < value.length; i++) {
              const element = value[i];
              var string = ""
              var total = 0
              for (let j = 0; j < element.length; j++) { // element2[0] = quantity / element2[1] = name / element2[2] = id / element2[3] = price
                const element2 = element[j];

                string += `${numeral(element2[0]).format('0,0')} x ${GetEmoji(`item_${element2[2]}`)} [${element2[1]}](https://roexplorer.com/item/${element2[2]}) ${element2[2] !== '100' ? (`= ${numeral(numeral(element2[0]).value() * numeral(element2[3 + index]).value()).format('0,0')}`) : ""}\n`
                total += numeral(element2[0]).value() * numeral(element2[3 + index]).value()
              }
              string += `**Total:** ${GetEmoji("item_100")} ${numeral(total).format('0,0')}\n`
              totaltotal += total
              if (i > 1) string += "󠀡"
              newEmbed.addField(`Upgrade ${i + 1}`, string + "󠀡", true)
            }
            newEmbed.addField("Total Sum", `${GetEmoji('item_100')} ${numeral(totaltotal).format('0,0')}` + "\n󠀡")
            // edit message with new embed
            // NOTE: can only edit messages you author
            r.message.edit(newEmbed)
              .catch(error => ReportError(error)); // useful for catching errors
          })
        })
    })
  } catch (error) { ReportError(error) }
}

async function ExchangeChartEmbed(message, value, sBody, mReaction) {
  try {
    const embedSearch = new RichEmbed()
      .setColor(16056092)
      .setDescription(`${emojiGuilds[0].emojis.find(emoji => emoji.name === "loading1")} ***Making the chart...***`)
    let searchMsg
    message.channel.sendEmbed(embedSearch).then(msg => {
      searchMsg = msg.id
      message.channel.startTyping(10)
    })

    // Do something
    let promise3 = new Promise(async (resolve3) => {
      body2 = value.body2
      // global.week.data[]
      if (body2[0] !== undefined && body2 !== []) {

        var globalPrices = {
          x: [],
          y: [],
          type: "scatter",
          name: "Global",
          marker: {
            color: "rgba(45, 132, 42, 1)"
          },
          line: {
            color: "rgba(45, 132, 42, 1)"
          }
        };
        var seaPrices = {
          x: [],
          y: [],
          type: "scatter",
          name: "SEA",
          marker: {
            color: "rgba(19, 27, 174, 1)"
          },
          line: {
            color: "rgba(19, 27, 174, 1)"
          }
        };

        for (let i = 0; i < body2[0].global.week.data.length; i++) {
          const globalDay = body2[0].global.week.data[i];
          const seaDay = body2[0].sea.week.data[i];
          if (globalDay !== undefined) {
            globalPrices.x.push(globalDay.time.slice(0, 10))
            globalPrices.y.push(globalDay.price)
          }
          if (seaDay !== undefined) {
            seaPrices.x.push(seaDay.time.slice(0, 10))
            seaPrices.y.push(seaDay.price)
          }
        }

        var figure = { 'data': [globalPrices, seaPrices] };

        var imgOpts = {
          format: 'png',
          width: 900,
          height: 450
        };
        plotly.getImage(figure, imgOpts, function (error, imageStream) {
          if (error) return console.log(error);
          console.log(imageStream)
          var fileStream = fs.createWriteStream(`./exchangeCharts/${sBody.id}.png`);
          imageStream.pipe(fileStream)
        })
        var loopCount = 0
        const intervalObj = setInterval(() => {
          imgur.setCredentials('firiguito@gmail.com', 'supergui123', '05fee49b282f221');
          imgur.uploadFile(`./exchangeCharts/${sBody.id}.png`)
            .then(function (json) {
              teste = false
              clearInterval(intervalObj)
              resolve3(json.data.link)
            })
            .catch(function (err) {
              console.error(err.message);
            });
          loopCount++
          if (loopCount > 4)
            clearInterval(intervalObj)
        }, 450)
      }
    }).catch((error) => {
      ReportError(error)
    });
    promise3.then((value3) => {
      if (value3 !== undefined) {
        try {
          var newEmbed = new RichEmbed()
            .setAuthor(`Exchange Chart of ${sBody.NameZh_EN}`, `https://roexplorer.com/imgs/original_${sBody.Icon}.png`, `https://roexplorer.com/item/${sBody.id}`)
            .setImage(value3)
            .setColor(16056092)
            .setFooter(`Requested by ${message.author.username} | Powered by roexplorer.com & romexchange.com`, message.author.avatarURL)
          message.channel.fetchMessage(searchMsg).then(msg => msg.delete())
          message.channel.stopTyping(true)
          message.channel.sendEmbed(newEmbed)
            .then(msg => msg.react('❌'))
            .then(mReaction => mReaction.message.react('🔒'))
            .then(mReaction => {
              const reactionFilter = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
              const reactionFilter2 = (reaction, user) => reaction.emoji.name === '🔒' && user.id === message.author.id;
              var locked = false

              // createReactionCollector - responds on each react, AND again at the end.
              const collector = mReaction.message
                .createReactionCollector(reactionFilter, { time: 300000 });
              const locker = mReaction.message
                .createReactionCollector(reactionFilter2, { time: 300000 });

              // set collector events
              collector.on('collect', r => {
                mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
              });
              collector.on('end', r => {
                if (!locked)
                  mReaction.message.channel.fetchMessage(mReaction.message).then(msg => msg.delete());
                mReaction.message.clearReactions()
              });
              locker.on('collect', r => {
                locked = true
              });
            })
            .catch(error => ReportError(error)); // useful for catching errors
          fs.unlinkSync(`./exchangeCharts/${sBody.id}.png`);
        } catch (err) { ReportError(err) }
      }
    })
  } catch (error) { ReportError(error) }
}

client.login(config.token);//token_beta