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
 * Permet d'injecter ou remplacer l'instance du client SecretManager (utilisé pour les tests)
 */
function setClient(customClient) {
  client = customClient;
}

/**
 * Récupère la valeur d'un secret depuis Google Cloud Secret Manager (avec cache).
 * Les erreurs de lecture ne révèlent aucune valeur ou nom sensible dans les logs.
 * @param {string} secretName - Le nom du secret (ex: 'YOUTUBE_API_KEY')
 * @param {string} [projectId] - ID du projet GCP
 * @returns {Promise<string>}
 */
async function getSecret(secretName, projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'lumina-analytics-kd-2026') {
  if (typeof secretName !== 'string' || !secretName.trim()) {
    throw new Error('Invalid secret name requested');
  }

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
      throw new Error('Secret value is empty or unreadable');
    }

    secretCache.set(secretName, payload);
    return payload;
  } catch (error) {
    // Sanitisation des logs pour éviter toute fuite d'informations sensibles
    console.warn(`[SecretManager] Avertissement: Impossible d'accéder au secret [${secretName}]. Utilisation du fallback d'environnement si disponible.`);
    return process.env[secretName] || '';
  }
}

/**
 * Réinitialise le cache de secrets (utilisé pour les tests)
 */
function clearSecretCache() {
  secretCache.clear();
}

module.exports = {
  getSecret,
  setClient,
  clearSecretCache
};
