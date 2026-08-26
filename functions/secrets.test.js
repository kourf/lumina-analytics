import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSecret, setClient, clearSecretCache } from './secrets';

describe('functions/secrets.js', () => {
  let mockAccessSecretVersion;

  beforeEach(() => {
    clearSecretCache();
    delete process.env.TEST_ENV_SECRET;
    delete process.env.VALID_SECRET;
    delete process.env.EMPTY_SECRET;
    delete process.env.NON_EXISTENT_SECRET;

    mockAccessSecretVersion = vi.fn();
    setClient({
      accessSecretVersion: mockAccessSecretVersion
    });
  });

  it('devrait retourner le secret depuis la variable d\'environnement si disponible', async () => {
    process.env.TEST_ENV_SECRET = 'env_val_456';
    const secret = await getSecret('TEST_ENV_SECRET');
    expect(secret).toBe('env_val_456');
  });

  it('devrait récupérer le secret depuis GCP Secret Manager avec succès', async () => {
    mockAccessSecretVersion.mockResolvedValue([
      { payload: { data: Buffer.from('secret_value_123') } }
    ]);

    const secret = await getSecret('VALID_SECRET');
    expect(secret).toBe('secret_value_123');
    expect(mockAccessSecretVersion).toHaveBeenCalledTimes(1);
  });

  it('devrait s\'appuyer sur la mise en cache mémoire pour les appels ultérieurs', async () => {
    mockAccessSecretVersion.mockResolvedValue([
      { payload: { data: Buffer.from('secret_value_123') } }
    ]);

    const secret1 = await getSecret('VALID_SECRET');
    const secret2 = await getSecret('VALID_SECRET');
    expect(secret1).toBe('secret_value_123');
    expect(secret2).toBe('secret_value_123');
    expect(mockAccessSecretVersion).toHaveBeenCalledTimes(1);
  });

  it('devrait lever une erreur pour un nom de secret invalide', async () => {
    await expect(getSecret('')).rejects.toThrow('Invalid secret name requested');
  });

  it('devrait gérer proprement les échecs GCP sans faire fuiter de clé dans l\'erreur', async () => {
    mockAccessSecretVersion.mockRejectedValue(new Error('GCP API Error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const secret = await getSecret('NON_EXISTENT_SECRET');
    expect(secret).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SecretManager] Avertissement: Impossible d\'accéder au secret [NON_EXISTENT_SECRET]')
    );
    consoleSpy.mockRestore();
  });
});
