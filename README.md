# LDA Verify — Discord OAuth2 Verification

This project implements a simple Discord OAuth2 verification flow that adds a "Verificado" role to users who authenticate.

Requirements
- Node.js 16+

Setup
1. Copy `.env.example` to `.env` and fill values:

- `DISCORD_CLIENT_ID` — OAuth2 client ID
- `DISCORD_CLIENT_SECRET` — OAuth2 client secret
- `DISCORD_BOT_TOKEN` — Bot token (the bot must be in the target guild)
- `DISCORD_GUILD_ID` — Guild (server) ID
- `VERIFIED_ROLE_ID` — Role ID to add (Verificado)
- `BASE_URL` — Public URL of your server (used as redirect URI), e.g. `https://example.com`
- `PORT` — optional

2. Install deps

```bash
npm install
```

3. Start

```bash
npm start
```

How it works
- The bot sends an embed with a Link button pointing to `${BASE_URL}/login`.
- The user signs-in with Discord (scopes `identify guilds.join`).
- The server exchanges the code for an access token and calls Discord API to add the user to the guild and set the `VERIFIED_ROLE_ID`.
- If adding via OAuth2 fails (user already in guild), the server tries to add the role using the bot client.

Embed button example (discord.js v14)

```js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const embed = new EmbedBuilder()
  .setTitle('Verificação externa')
  .setDescription('Clique para verificar sua conta com nosso site seguro');

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Verificar-se')
    .setStyle(ButtonStyle.Link)
    .setURL(`${process.env.BASE_URL}/login`)
);

channel.send({ embeds: [embed], components: [row] });
```

Notes
- The bot needs `Manage Roles` permission and must have a role higher than `VERIFIED_ROLE_ID` to assign it.
- If using privileged intents (Guild Members), enable them in the developer portal.
- Ensure `BASE_URL` is the same redirect URI registered in the OAuth2 app settings.
