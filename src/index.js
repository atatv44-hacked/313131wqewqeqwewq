import chalk from "chalk";
import webhooks from "./helpers/webhooks.js";
import WebSocket from "ws";
import cfonts from "cfonts";
import functions from "./helpers/functions.js";
import config from "./helpers/config.js";
const guilds = {};
const info = (str) =>
  console.log(`${chalk.hex("#ed2d8d")("[BILGI]")} ${chalk.hex("#fff")(str)}`);
const error = (str) =>
  console.log(`${chalk.hex(`#f00a0d`)("[HATA]")} ${chalk.hex("#fff")(str)}`);
const statusCodes = {
  400: `URL Alınamadı`,
  429: "Rate Limited",
  403: "Yetki Yok",
  401: "Token Patlamıs",
};

cfonts.say("BLANDY X JUSTICE", {
  font: "chrome", // define the font face
  align: "center", // define text alignment
  colors: ["candy", "#ed2d8d"], // define all colors
  background: "transparent", // define the background color, you can also use `backgroundColor` here as key
  letterSpacing: 1, // define letter spacing
  lineHeight: 1, // define the line height
  space: true, // define if the output text should have empty lines on top and on the bottom
  maxLength: "16", // define how many character can be on one line
  gradient: true, // define your two gradient colors
  independentGradient: true, // define if you want to recalculate the gradient for each new line
  transitionGradient: true, // define if this is a transition between colors directly
});

cfonts.say(
  "Sniper worked successfully",
  {
    font: "console", // define the font face
    align: "center", // define text alignment
    colors: ["#ed2d8d"], // define all colors
  }
);
const ws = new WebSocket(`wss://gateway-us-east1-b.discord.gg`);

ws.on("open", () => {
  info("Sniper Basladı");
  ws.on("message", async (message) => {
    const { d, op, t } = JSON.parse(message);
    if (t === "GUILD_UPDATE") {
      const getGuild = guilds[d.guild_id];
      if (typeof getGuild === "string" && getGuild !== d.vanity_url_code) {
        await functions
          .snipeVanityUrl(getGuild)
          .then(async () => {
            await webhooks.success(
              `@everyone 
**## Sniper succesfully sniped**\ndiscord.gg/${getGuild} `
            );
            return delete guilds[d.guild_id];
          })
          .catch(async (err) => {
            await webhooks.error(
              `**## Hata Kodu: ${err} (\`${statusCodes[`${err}`]}\`)**\ndiscord.gg/${getGuild}`
            );
            await functions.leaveGuild(d.guild_id);
            delete guilds[d.guild_id];
            await functions
              .joinGuild(getGuild)
              .then(async ({ guild_id }) => {
                await webhooks.info(
                  `discord.gg/${getGuild} URL'si alınamadıgı icin eski sunucudan cıkıldı ve yeni sunucuya girildi.`
                );
                guilds[guild_id] = getGuild;
                return;
              })
              .catch(
                async (err) =>
                  await webhooks.error(
                    `discord.gg/${getGuild} URL'si alınamadıgı icin eski sunucudan cıkıldı ama yeni sunucuya girilemedi Durum Kodu: ${err}. \`${statusCodes[`${err}`]
                    }\``
                  )
              );
          });
      }
    } else if (t === "GUILD_DELETE") {
      const getGuild = guilds[d.id];
      if (getGuild) {
        await functions
          .snipeVanityUrl(getGuild)
          .then(async () => {
            await webhooks.success(
              `@everyone 
**### - Sniper succesfully sniped**

discord.gg/${getGuild} 
(Sunucu kapansada alırız urlsini :D)`
            );
            return delete guilds[d.id];
          })
          .catch(async (err) => {
            await webhooks.error(
              `**## Hata Kodu: ${err} (\`${statusCodes[`${err}`]}\`)**\nSunucudan atıldım, banlandım veya boost dustu.\ndiscord.gg/${getGuild}`
            );
            await functions
              .joinGuild(getGuild)
              .then(async ({ guild_id }) => {
                await webhooks.info(
                  `discord.gg/${getGuild} URLSİ Alınamadı, Yeni Sunucuya Girildi.`
                );
                guilds[guild_id] = getGuild;
                return;
              })
              .catch(
                async (err) =>
                  await webhooks.error(                   
                 )
              );
          });
      }
    } else if (t === "READY") {
      info(`Sniper Online Oldu`);
      d.guilds
        .filter((e) => e.vanity_url_code)
        .forEach((guild) => (guilds[guild.id] = guild.vanity_url_code));
      return await webhooks.info(`**[BİLGİ] Connected to Discord**\n**[BİLGİ] Sniper worked successfully**\n\n**Vanitys**: 
\`\`\`
${d.guilds
          .filter((e) => e.vanity_url_code)
          .map((guild) => `${guild.vanity_url_code}`)
          .join(", ")}
\`\`\`
        `);
    }
    if (op === 10) {
      ws.send(
        JSON.stringify({
          op: 2,
          d: {
            token: config.listenerToken,
            intents: 1,
            properties: {
              os: "linux",
              browser: "firefox",
              device: "firefox",
            },
          },
        })
      );
      setInterval(
        () =>
          ws.send(JSON.stringify({ op: 1, d: {}, s: null, t: "heartbeat" })),
        d.heartbeat_interval
      );
    } else if (op === 10) {
      info(`Tekrar baslatılıyor`);
      return process.exit();
    }
  });
  ws.on("close", (code) => {
    if (code === 4004) {
      error(`Sunuculara sokulacak olan hesabın tokeni yanlıs girildi.`);
    }
    return process.exit();
  });
});