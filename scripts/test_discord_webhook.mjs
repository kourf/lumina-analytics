const webhookUrl = 'https://discord.com/api/webhooks/1540098204714930319/w71fW-1Am_A4LVtIFg-2-b8s9J5Vryi32q_0LwTB76kX_j-yRQMhFMVRYt8wpiPqwPa9';

async function testPayloads() {
  console.log('Testing Discord Webhook formatting...');
  
  const ytPayload = {
    username: 'Karam Live',
    avatar_url: 'https://p16-common-sign.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no/0ace94e1ff2808e8032a8a8af1799c75~tplv-tiktokx-cropcenter:1080:1080.jpeg',
    content: '@everyone 🔴 **Karamokho est actuellement EN DIRECT sur YouTube !**',
    embeds: [{
      title: '🔴 [DIRECT] REJOINDRE LE LIVE STREAM SUR YOUTUBE',
      url: 'https://www.youtube.com/@karamdrm/live',
      description: '🚀 **Karamokho DRAMÉ (@karamdrm)** est en live !\n\nRejoignez la session en direct pour échanger, poser vos questions et participer.\n\n👉 **[🔴 CLIQUEZ ICI POUR REJOINDRE LE LIVE YOUTUBE ↗](https://www.youtube.com/@karamdrm/live)**',
      color: 16711680,
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: '📺 Chaîne', value: '[Karamokho DRAMÉ (@karamdrm)](https://www.youtube.com/@karamdrm)', inline: true },
        { name: '⚡ Statut', value: '🔴 EN DIRECT', inline: true },
        { name: '🔗 Lien d\'accès direct', value: '[**youtube.com/@karamdrm/live**](https://www.youtube.com/@karamdrm/live)', inline: false }
      ],
      footer: {
        text: 'Lumina Analytics • Alerte Live YouTube'
      },
      timestamp: new Date().toISOString()
    }]
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ytPayload)
  });

  console.log('YouTube Webhook HTTP Status:', res.status);
  if (!res.ok) {
    console.error('Error response:', await res.text());
  } else {
    console.log('Webhook Discord YouTube envoye avec succes !');
  }
}

testPayloads();
