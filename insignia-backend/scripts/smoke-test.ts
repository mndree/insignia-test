/**
 * Automated Smoke-Test Workflow for Crypto Wallet REST API
 * Verifies all 6 Stoplight specification endpoints:
 * 1. POST /user (Register Alice & Bob, capture tokens)
 * 2. POST /topup (Top up Alice with 100 -> HTTP 204)
 * 3. GET /balance (Verify Alice = 100, Bob = 0)
 * 4. POST /transfer (Transfer 25 from Alice to Bob -> HTTP 204)
 * 5. GET /balance (Verify Alice = 75, Bob = 25)
 * 6. GET /top_transactions_per_user (Verify counterparty ranking for Alice & Bob)
 * 7. GET /top_users (Verify overall top users excluding 0 outgoing)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';

const uid = Date.now().toString().slice(-5);
const aliceUsername = `alice_smoke_${uid}`;
const bobUsername = `bob_smoke_${uid}`;

function logSuccess(step: string, details?: string) {
  console.log(`\x1b[32m✔ [PASS]\x1b[0m ${step}${details ? ` -> ${details}` : ''}`);
}

function logError(step: string, error: unknown) {
  console.error(`\x1b[31m✖ [FAIL]\x1b[0m ${step}`);
  console.error(error);
  process.exit(1);
}

async function run() {
  console.log('='.repeat(65));
  console.log(`🚀 Starting Automated Smoke Test against: ${BASE_URL}`);
  console.log(`👤 Test users: ${aliceUsername}, ${bobUsername}`);
  console.log('='.repeat(65));

  let aliceToken = '';
  let bobToken = '';

  // 1. REGISTER ALICE
  try {
    const res = await fetch(`${BASE_URL}/user`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: aliceUsername }),
    });
    if (res.status !== 201) throw new Error(`Expected HTTP 201, got ${res.status}`);
    const data = (await res.json()) as { token: string };
    if (!data.token) throw new Error('Missing token in response');
    aliceToken = data.token;
    logSuccess('1. Register Alice', `HTTP 201, token captured (${aliceToken.slice(0, 15)}...)`);
  } catch (err) {
    logError('1. Register Alice', err);
  }

  // 2. REGISTER BOB
  try {
    const res = await fetch(`${BASE_URL}/user`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: bobUsername }),
    });
    if (res.status !== 201) throw new Error(`Expected HTTP 201, got ${res.status}`);
    const data = (await res.json()) as { token: string };
    if (!data.token) throw new Error('Missing token in response');
    bobToken = data.token;
    logSuccess('2. Register Bob', `HTTP 201, token captured (${bobToken.slice(0, 15)}...)`);
  } catch (err) {
    logError('2. Register Bob', err);
  }

  // 3. TOPUP ALICE (100)
  try {
    const res = await fetch(`${BASE_URL}/topup`, {
      method: 'POST',
      headers: {
        'Authorization': aliceToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 100 }),
    });
    if (res.status !== 204) throw new Error(`Expected HTTP 204, got ${res.status}`);
    logSuccess('3. Topup Alice (amount: 100)', 'HTTP 204 No Content');
  } catch (err) {
    logError('3. Topup Alice', err);
  }

  // 4. CHECK ALICE BALANCE (100)
  try {
    const res = await fetch(`${BASE_URL}/balance`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': aliceToken,
      },
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = (await res.json()) as { balance: number };
    if (data.balance !== 100) throw new Error(`Expected balance 100, got ${data.balance}`);
    logSuccess('4. Verify Alice Balance', `HTTP 200, balance: ${data.balance}`);
  } catch (err) {
    logError('4. Verify Alice Balance', err);
  }

  // 5. TRANSFER 25 FROM ALICE TO BOB
  try {
    const res = await fetch(`${BASE_URL}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': aliceToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to_username: bobUsername, amount: 25 }),
    });
    if (res.status !== 204) throw new Error(`Expected HTTP 204, got ${res.status}`);
    logSuccess('5. Transfer 25 to Bob', 'HTTP 204 No Content');
  } catch (err) {
    logError('5. Transfer 25 to Bob', err);
  }

  // 6. VERIFY POST-TRANSFER BALANCES (Alice = 75, Bob = 25)
  try {
    const resAlice = await fetch(`${BASE_URL}/balance`, {
      headers: { 'Accept': 'application/json', 'Authorization': aliceToken },
    });
    const aliceData = (await resAlice.json()) as { balance: number };
    if (aliceData.balance !== 75) throw new Error(`Expected Alice balance 75, got ${aliceData.balance}`);

    const resBob = await fetch(`${BASE_URL}/balance`, {
      headers: { 'Accept': 'application/json', 'Authorization': bobToken },
    });
    const bobData = (await resBob.json()) as { balance: number };
    if (bobData.balance !== 25) throw new Error(`Expected Bob balance 25, got ${bobData.balance}`);

    logSuccess('6. Verify Post-Transfer Balances', `Alice = ${aliceData.balance}, Bob = ${bobData.balance}`);
  } catch (err) {
    logError('6. Verify Post-Transfer Balances', err);
  }

  // 7. VERIFY TOP TRANSACTIONS FOR ALICE (expect counterparty bob with -25)
  try {
    const res = await fetch(`${BASE_URL}/top_transactions_per_user`, {
      headers: { 'Accept': 'application/json', 'Authorization': aliceToken },
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = (await res.json()) as Array<{ username: string; amount: number }>;
    const item = data.find((t) => t.username === bobUsername);
    if (!item || item.amount !== -25) {
      throw new Error(`Expected [{ username: '${bobUsername}', amount: -25 }], got ${JSON.stringify(data)}`);
    }
    logSuccess('7. Top Transactions for Alice', `Found { username: '${item.username}', amount: ${item.amount} }`);
  } catch (err) {
    logError('7. Top Transactions for Alice', err);
  }

  // 8. VERIFY TOP TRANSACTIONS FOR BOB (expect counterparty alice with +25)
  try {
    const res = await fetch(`${BASE_URL}/top_transactions_per_user`, {
      headers: { 'Accept': 'application/json', 'Authorization': bobToken },
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = (await res.json()) as Array<{ username: string; amount: number }>;
    const item = data.find((t) => t.username === aliceUsername);
    if (!item || item.amount !== 25) {
      throw new Error(`Expected [{ username: '${aliceUsername}', amount: 25 }], got ${JSON.stringify(data)}`);
    }
    logSuccess('8. Top Transactions for Bob', `Found { username: '${item.username}', amount: ${item.amount} }`);
  } catch (err) {
    logError('8. Top Transactions for Bob', err);
  }

  // 9. VERIFY TOP USERS (Alice transacted_value: 25, Bob excluded)
  try {
    const res = await fetch(`${BASE_URL}/top_users`, {
      headers: { 'Accept': 'application/json', 'Authorization': aliceToken },
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = (await res.json()) as Array<{ username: string; transacted_value: number }>;
    const aliceRank = data.find((u) => u.username === aliceUsername);
    const bobRank = data.find((u) => u.username === bobUsername);

    if (!aliceRank || aliceRank.transacted_value !== 25) {
      throw new Error(`Expected Alice with transacted_value 25, got ${JSON.stringify(data)}`);
    }
    if (bobRank) {
      throw new Error(`Bob should be excluded (0 outgoing transfers), but found in top_users`);
    }
    logSuccess('9. Top Users Ranking', `Alice transacted_value = 25, Bob excluded as required`);
  } catch (err) {
    logError('9. Top Users Ranking', err);
  }

  console.log('='.repeat(65));
  console.log('\x1b[32m🎉 ALL 9 SMOKE TEST ACCEPTANCE CHECKS PASSED!\x1b[0m');
  console.log('='.repeat(65));
}

run();
