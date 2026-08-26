const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

let client = null;
const secretCache = new Map();

function getClient() {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

/**
 * Récupère la valeur d'un secret depuis Google Cloud Secret Manager (avec cache).
 * @param {string} secretName - Le nom du secret (ex: 'YOUTUBE_API_KEY')
 * @param {string} [projectId] - ID du projet GCP
 * @returns {Promise<string>}
 */
async function getSecret(secretName, projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'lumina-analytics-kd-2026') {
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  if (process.env[secretName]) {
    secretCache.set(secretName, process.env[secretName]);
    return process.env[secretName];
  }

  try {
    const smClient = getClient();
    const name = 'projects/' + projectId + '/secrets/' + secretName + '/versions/latest';
    const [version] = await smClient.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString('utf8');

    if (!payload) {
      throw new Error('Secret ' + secretName + ' is empty or unreadable.');
    }

    secretCache.set(secretName, payload);
    return payload;
  } catch (error) {
    console.warn('[SecretManager] Avertissement: Impossible de lire ' + secretName + ':', error.message);
    return process.env[secretName] || '';
  }
}

module.exports = {
  getSecret
};
