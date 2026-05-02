require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const client = require('./bot');

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  VERIFIED_ROLE_ID,
  UNVERIFIED_ROLE_ID,
  BASE_URL,
  PORT = 3000
} = process.env;

// Basic validation
const missing = [];
if (!DISCORD_CLIENT_ID) missing.push('DISCORD_CLIENT_ID');
if (!DISCORD_CLIENT_SECRET) missing.push('DISCORD_CLIENT_SECRET');
if (!DISCORD_BOT_TOKEN) missing.push('DISCORD_BOT_TOKEN');
if (!DISCORD_GUILD_ID) missing.push('DISCORD_GUILD_ID');
if (!VERIFIED_ROLE_ID) missing.push('VERIFIED_ROLE_ID');
if (missing.length) {
  console.error('[server] Missing required env vars:', missing.join(', '));
  console.error('Fill .env (see .env.example) then restart.');
  process.exit(1);
}

const app = express();
app.use(express.static(path.join(__dirname)));

const redirectUri = BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/callback` : `http://localhost:${PORT}/callback`;
console.log('[server] using redirectUri:', redirectUri);

app.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.join'
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

app.get('/auth/discord', (req, res) => res.redirect('/login'));

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userId = userRes.data.id;

    // Try to add/update via OAuth guilds.join
    try {
      const body = { access_token: accessToken };
      if (VERIFIED_ROLE_ID) body.roles = [VERIFIED_ROLE_ID];
      await axios.put(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
        body,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' } }
      );

      // remove unverified role via bot client if configured
      if (UNVERIFIED_ROLE_ID) {
        try {
          if (!client.isReady()) await new Promise((r) => client.once('ready', r));
          const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
          const member = await guild.members.fetch(userId);
          if (member.roles.cache.has(UNVERIFIED_ROLE_ID)) await member.roles.remove(UNVERIFIED_ROLE_ID);
        } catch (e) {
          console.warn('[server] non-fatal: failed to remove unverified role', e?.message || e);
        }
      }

      return res.redirect('/success');
    } catch (e) {
      // Fallback: use bot client for existing members
      try {
        if (!client.isReady()) await new Promise((r) => client.once('ready', r));
        const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
        const member = await guild.members.fetch(userId);
        if (VERIFIED_ROLE_ID && !member.roles.cache.has(VERIFIED_ROLE_ID)) await member.roles.add(VERIFIED_ROLE_ID);
        if (UNVERIFIED_ROLE_ID && member.roles.cache.has(UNVERIFIED_ROLE_ID)) await member.roles.remove(UNVERIFIED_ROLE_ID);
        return res.redirect('/success');
      } catch (err) {
        console.error('[server] role assignment failed', err?.message || err);
        return res.status(500).send('Failed to add/remove roles');
      }
    }
  } catch (err) {
    console.error('[server] oauth callback error', err?.response?.data || err?.message || err);
    return res.status(500).send('OAuth callback failed');
  }
});

app.get('/success', (req, res) => res.sendFile(path.join(__dirname, 'success.html')));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
