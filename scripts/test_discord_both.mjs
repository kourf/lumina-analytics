const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';

async function sendPreview(platform, liveUrl) {
  const isYouTube = platform === 'YouTube';
  const payload = {
    username: 'Karam Live',
    avatar_url: 'https://p16-common-sign.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no/0ace94e1ff2808e8032a8a8af1799c75~tplv-tiktokx-cropcenter:1080:1080.jpeg',
    content: '@everyone 🔴 **Karamokho est actuellement EN DIRECT sur ' + platform + ' !**',
    embeds: [{
      title: '🔴 [DIRECT] REJOINDRE LE LIVE STREAM SUR ' + platform.toUpperCase(),
      url: liveUrl,
      description: '🚀 **Karamokho DRAMÉ (@' + (isYouTube ? 'karamdrm' : 'karam.drame') + ')** a démarré une session live !\n\nVenez échanger, poser vos questions et participer au stream en direct dès maintenant.\n\n👉 **[🔴 REJOINDRE LE DIRECT EN UN CLIC ↗](' + liveUrl + ')**',
      color: isYouTube ? 16711680 : 2487534,
      thumbnail: {
        url: isYouTube ? 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' : 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png'
      },
      fields: [
        { name: '📺 Plateforme', value: platform + ' Live', inline: true },
        { name: '⚡ Statut', value: '🔴 EN DIRECT', inline: true },
        { name: '👤 Créateur', value: '@' + (isYouTube ? 'karamdrm' : 'karam.drame'), inline: true },
        { name: '🔗 Lien direct', value: '[**' + liveUrl.replace('https://', '') + '**](' + liveUrl + ')', inline: false }
      ],
      footer: {
        text: 'Lumina Analytics • Alerte Automatique ' + platform + ' Live'
      },
      timestamp: new Date().toISOString()
    }]
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log(platform + ' Webhook status:', res.status);
}

async function run() {
  await sendPreview('YouTube', 'https://www.youtube.com/@karamdrm/live');
  await sendPreview('TikTok', 'https://www.tiktok.com/@karam.drame/live');
}

run();
