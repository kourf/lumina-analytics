import assert from 'node:assert';
import { 
  sanitizeTikTokUsername, 
  validateTrueLiveCondition, 
  verifyTikTokLiveStatus, 
  clearTikTokLiveCache, 
  LIVE_STATUS 
} from '../src/services/tiktokLiveService.js';

console.log('=== RUNNING TIKTOK LIVE DETECTION VERIFICATION SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

async function testAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
  }
}

// 1. Sanitization tests
test('sanitizeTikTokUsername strips leading @ and handles URLs', () => {
  assert.strictEqual(sanitizeTikTokUsername('@jkaram'), 'jkaram');
  assert.strictEqual(sanitizeTikTokUsername('@@jkaram'), 'jkaram');
  assert.strictEqual(sanitizeTikTokUsername('https://www.tiktok.com/@jkaram?lang=fr'), 'jkaram');
  assert.strictEqual(sanitizeTikTokUsername('https://tiktok.com/@karam.drame#live'), 'karam.drame');
  assert.strictEqual(sanitizeTikTokUsername('  JKARAM  '), 'jkaram');
  assert.strictEqual(sanitizeTikTokUsername(null), '');
});

// 2. True Live Condition tests
test('validateTrueLiveCondition validates status === 2 strictly', () => {
  assert.strictEqual(validateTrueLiveCondition({ roomId: '12345678', status: 2 }), true);
  assert.strictEqual(validateTrueLiveCondition({ roomId: '12345678', status: 4 }), false); // Stream ended
  assert.strictEqual(validateTrueLiveCondition({ roomId: '12345678', status: 0 }), false);
  assert.strictEqual(validateTrueLiveCondition({ roomId: '', status: 2 }), false);
  assert.strictEqual(validateTrueLiveCondition({ roomId: 'unknown', status: 2 }), false);
  assert.strictEqual(validateTrueLiveCondition({ status: 2 }), false);
  assert.strictEqual(validateTrueLiveCondition(null), false);
  assert.strictEqual(validateTrueLiveCondition({}), false);
});

// 3. API Error Handling Tests
await testAsync('verifyTikTokLiveStatus: 429 Rate Limit defaults to STATUS_UNKNOWN (NEVER LIVE)', async () => {
  clearTikTokLiveCache();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
  });

  try {
    const result = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(result.status, LIVE_STATUS.STATUS_UNKNOWN);
    assert.strictEqual(result.isLive, false); // CRITICAL: Must be false!
    assert.ok(result.error && result.error.includes('429'));
  } finally {
    global.fetch = originalFetch;
  }
});

await testAsync('verifyTikTokLiveStatus: 403 Forbidden defaults to STATUS_UNKNOWN (NEVER LIVE)', async () => {
  clearTikTokLiveCache();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 403,
    statusText: 'Forbidden',
  });

  try {
    const result = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(result.status, LIVE_STATUS.STATUS_UNKNOWN);
    assert.strictEqual(result.isLive, false); // CRITICAL: Must be false!
    assert.ok(result.error && result.error.includes('403'));
  } finally {
    global.fetch = originalFetch;
  }
});

await testAsync('verifyTikTokLiveStatus: Network timeout defaults to STATUS_UNKNOWN (NEVER LIVE)', async () => {
  clearTikTokLiveCache();
  const originalFetch = global.fetch;
  global.fetch = async () => {
    const err = new Error('Connection timed out');
    err.name = 'TimeoutError';
    throw err;
  };

  try {
    const result = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(result.status, LIVE_STATUS.STATUS_UNKNOWN);
    assert.strictEqual(result.isLive, false); // CRITICAL: Must be false!
  } finally {
    global.fetch = originalFetch;
  }
});

await testAsync('verifyTikTokLiveStatus: Confirmed active live stream returns LIVE with viewer metrics', async () => {
  clearTikTokLiveCache();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      room: {
        roomId: '789123456789',
        status: 2,
        user_count: 125,
        title: 'Session Live en Direct',
        owner: { nickname: 'JKaram' }
      }
    })
  });

  try {
    const result = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(result.status, LIVE_STATUS.LIVE);
    assert.strictEqual(result.isLive, true);
    assert.strictEqual(result.roomId, '789123456789');
    assert.strictEqual(result.viewerCount, 125);
    assert.strictEqual(result.displayName, 'JKaram');
    assert.strictEqual(result.error, null);
  } finally {
    global.fetch = originalFetch;
  }
});

await testAsync('verifyTikTokLiveStatus: Confirmed offline stream returns OFFLINE', async () => {
  clearTikTokLiveCache();
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      isLive: false,
      displayName: 'JKaram'
    })
  });

  try {
    const result = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(result.status, LIVE_STATUS.OFFLINE);
    assert.strictEqual(result.isLive, false);
    assert.strictEqual(result.roomId, null);
    assert.strictEqual(result.viewerCount, 0);
  } finally {
    global.fetch = originalFetch;
  }
});

// 4. SWR Caching Tests
await testAsync('SWR Cache: Serves fresh results from cache within 60s without duplicate requests', async () => {
  clearTikTokLiveCache();
  let networkCalls = 0;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    networkCalls++;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        room: {
          roomId: '5566778899',
          status: 2,
          user_count: 42
        }
      })
    };
  };

  try {
    // Call 1: Network call
    const res1 = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(res1.fromCache, false);
    assert.strictEqual(networkCalls, 1);

    // Call 2: SWR cache hit
    const res2 = await verifyTikTokLiveStatus('jkaram');
    assert.strictEqual(res2.fromCache, true);
    assert.strictEqual(res2.viewerCount, 42);
    assert.strictEqual(networkCalls, 1); // No second network call

    // Call 3: Forced refresh bypasses cache
    const res3 = await verifyTikTokLiveStatus('jkaram', { forceRefresh: true });
    assert.strictEqual(res3.fromCache, false);
    assert.strictEqual(networkCalls, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error(`⚠️ ${totalTests - passedTests} test(s) failed.`);
  process.exit(1);
}
