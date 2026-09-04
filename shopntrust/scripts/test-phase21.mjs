// scripts/test-phase21.mjs
// Comprehensive Acceptance Verification for Phase 21: Commerce Reliability & Campaign Attribution

import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function testApi(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING PHASE 21 ACCEPTANCE VERIFICATION');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // PART 1: P0 — ADD_TO_BAG STRUCTURED ACTION FALLBACK
  // ----------------------------------------------------
  console.log('--- PART 1: P0 — ADD_TO_BAG ACTION FALLBACK ---');

  // Test 1.1: "Add option 1" with session recommended IDs
  try {
    const res = await testApi('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Add option 1',
        sessionId: 'test-p21-session',
        context: {
          session: {
            viewedProductIds: [],
            cartProductIds: [],
            recommendedProductIds: ['P101', 'P106'],
          },
        },
      }),
    });

    assert.strictEqual(res.status, 200);
    const addAction = res.data.actions?.find((a) => a.type === 'ADD_TO_BAG');
    assert(addAction, 'Expected an ADD_TO_BAG action');
    assert.strictEqual(addAction.productIds?.[0], 'P101', 'Expected P101 for option 1');
    assert.strictEqual(addAction.quantity, 1, 'Expected quantity 1');
    console.log('  -> PASS [Test 1.1]: "Add option 1" successfully resolved to canonical P101');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.1]:', err.message);
    failed++;
  }

  // Test 1.2: "Add option 2" with session recommended IDs
  try {
    const res = await testApi('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Add option 2',
        sessionId: 'test-p21-session',
        context: {
          session: {
            viewedProductIds: [],
            cartProductIds: [],
            recommendedProductIds: ['P101', 'P106'],
          },
        },
      }),
    });

    assert.strictEqual(res.status, 200);
    const addAction = res.data.actions?.find((a) => a.type === 'ADD_TO_BAG');
    assert(addAction, 'Expected an ADD_TO_BAG action');
    assert.strictEqual(addAction.productIds?.[0], 'P106', 'Expected P106 for option 2');
    console.log('  -> PASS [Test 1.2]: "Add option 2" successfully resolved to canonical P106');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.2]:', err.message);
    failed++;
  }

  // Test 1.3: "Add P106" direct product ID
  try {
    const res = await testApi('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Add P106',
        sessionId: 'test-p21-session',
      }),
    });

    assert.strictEqual(res.status, 200);
    const addAction = res.data.actions?.find((a) => a.type === 'ADD_TO_BAG');
    assert(addAction, 'Expected an ADD_TO_BAG action');
    assert.strictEqual(addAction.productIds?.[0], 'P106', 'Expected P106 for direct add');
    console.log('  -> PASS [Test 1.3]: "Add P106" directly emitted structured ADD_TO_BAG for P106');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.3]:', err.message);
    failed++;
  }

  // Test 1.4: Invalid product ID "Add P999" must NEVER generate ADD_TO_BAG
  try {
    const res = await testApi('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Add P999',
        sessionId: 'test-p21-session',
      }),
    });

    assert.strictEqual(res.status, 200);
    const addAction = res.data.actions?.find((a) => a.type === 'ADD_TO_BAG');
    assert(!addAction, 'Invalid product ID P999 must NOT trigger ADD_TO_BAG action');
    console.log('  -> PASS [Test 1.4]: Invalid product ID P999 rejected safely (no action emitted)');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.4]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // PART 2: P1 — CAMPAIGN ATTRIBUTION PIPELINE
  // ----------------------------------------------------
  console.log('\n--- PART 2: P1 — CAMPAIGN REVENUE ATTRIBUTION ---');

  let activeCampaign = null;

  // Test 2.1: Retrieve active campaign from /api/campaigns/active
  try {
    const res = await testApi('/api/campaigns/active');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.campaigns) && res.data.campaigns.length > 0, 'Must have at least one active campaign');
    activeCampaign = res.data.campaigns[0];
    assert(typeof activeCampaign.ordersDriven === 'number', 'Campaign must have numeric ordersDriven');
    assert(typeof activeCampaign.attributedRevenue === 'number', 'Campaign must have numeric attributedRevenue');
    console.log(`  -> PASS [Test 2.1]: Active campaign "${activeCampaign.name}" loaded with ordersDriven: ${activeCampaign.ordersDriven}, attributedRevenue: ₹${activeCampaign.attributedRevenue}`);
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.1]:', err.message);
    failed++;
  }

  const initialOrdersDriven = activeCampaign?.ordersDriven || 0;
  const initialAttributedRevenue = activeCampaign?.attributedRevenue || 0;
  const targetProductId = activeCampaign?.productIds?.[0] || 'P152';

  // Test 2.2: Create a completed order attributed to the active campaign
  const testOrderId = `ord_test_p21_${Date.now()}`;
  const testOrderPrice = 49990;
  try {
    const orderPayload = {
      orderId: testOrderId,
      items: [
        {
          product: { product_id: targetProductId, name: 'Campaign Test Product', price: testOrderPrice },
          quantity: 1,
          addedVia: 'manual',
          campaignId: activeCampaign.id,
        },
      ],
      total: testOrderPrice,
      currency: 'INR',
      customerInfo: {
        name: 'Attribution Test User',
        email: 'attribution@shopntrust.com',
        phone: '+919876543210',
        address: '123 Test Lane',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
      },
      paymentStatus: 'successful',
      campaignId: activeCampaign.id,
    };

    const res = await testApi('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    assert(res.status === 201 || res.status === 200, 'Order creation must return 201 Created or 200 OK');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.order.campaignId, activeCampaign.id, 'Order must persist campaignId');
    assert.strictEqual(res.data.order.items[0].campaignId, activeCampaign.id, 'Order item must persist campaignId');
    console.log('  -> PASS [Test 2.2]: Order created and successfully persisted campaign attribution metadata.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.2]:', err.message);
    failed++;
  }

  // Test 2.3: Verify active campaign reflects incremented ordersDriven and attributedRevenue
  try {
    const res = await testApi('/api/campaigns/active');
    assert.strictEqual(res.status, 200);
    const updatedCamp = res.data.campaigns.find((c) => c.id === activeCampaign.id);
    assert(updatedCamp, 'Active campaign must exist');
    assert.strictEqual(
      updatedCamp.ordersDriven,
      initialOrdersDriven + 1,
      `Expected ordersDriven to increment to ${initialOrdersDriven + 1}, got ${updatedCamp.ordersDriven}`
    );
    assert.strictEqual(
      updatedCamp.attributedRevenue,
      initialAttributedRevenue + testOrderPrice,
      `Expected attributedRevenue to increment by ₹${testOrderPrice}`
    );
    console.log(`  -> PASS [Test 2.3]: Active campaign card metrics dynamically updated -> Orders Driven: ${updatedCamp.ordersDriven}, Attributed Revenue: ₹${updatedCamp.attributedRevenue}`);
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.3]:', err.message);
    failed++;
  }

  // Test 2.4: Verify merchant analytics route calculates campaignRevenue and campaignOrders
  try {
    const res = await testApi('/api/merchant/analytics?range=all');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(typeof res.data.analytics.revenue.campaignRevenue === 'number', 'Analytics must have campaignRevenue');
    assert(res.data.analytics.revenue.campaignRevenue >= testOrderPrice, 'campaignRevenue must reflect paid campaign order');
    assert(typeof res.data.analytics.orders.campaignOrders === 'number', 'Analytics must have campaignOrders');
    assert(res.data.analytics.orders.campaignOrders >= 1, 'campaignOrders must be >= 1');
    console.log(`  -> PASS [Test 2.4]: /api/merchant/analytics reports campaignRevenue: ₹${res.data.analytics.revenue.campaignRevenue}, campaignOrders: ${res.data.analytics.orders.campaignOrders}`);
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.4]:', err.message);
    failed++;
  }

  // Test 2.5: Fake campaign ID must be rejected/sanitized safely
  try {
    const fakeOrderId = `ord_fake_${Date.now()}`;
    const res = await testApi('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: fakeOrderId,
        items: [
          {
            product: { product_id: 'P101', name: 'Standard Product', price: 19999 },
            quantity: 1,
            addedVia: 'manual',
            campaignId: 'fake-non-existent-campaign-id',
          },
        ],
        total: 19999,
        currency: 'INR',
        customerInfo: {
          name: 'Spoof Test',
          email: 'spoof@test.com',
          phone: '+919876543210',
          address: '456 Test Ave',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        paymentStatus: 'successful',
        campaignId: 'fake-non-existent-campaign-id',
      }),
    });

    assert(res.status === 201 || res.status === 200, 'Order creation must return 201 Created or 200 OK');
    assert.strictEqual(res.data.success, true);
    // Arbitrary fake campaign ID must be stripped
    assert(!res.data.order.campaignId, 'Fake campaign ID must be sanitized to undefined');
    assert(!res.data.order.items[0].campaignId, 'Fake item campaign ID must be sanitized to undefined');
    console.log('  -> PASS [Test 2.5]: Arbitrary/untrusted campaign ID sanitized and stripped safely.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.5]:', err.message);
    failed++;
  }

  // Test 2.6: Unpaid / failed order must NOT contribute to campaign revenue
  try {
    const campBefore = (await testApi('/api/campaigns/active')).data.campaigns.find((c) => c.id === activeCampaign.id);
    const revBefore = campBefore.attributedRevenue;

    const failedOrderId = `ord_failed_${Date.now()}`;
    await testApi('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: failedOrderId,
        items: [
          {
            product: { product_id: targetProductId, name: 'Campaign Item', price: 50000 },
            quantity: 1,
            addedVia: 'manual',
            campaignId: activeCampaign.id,
          },
        ],
        total: 50000,
        currency: 'INR',
        customerInfo: {
          name: 'Failed Payment User',
          email: 'failed@test.com',
          phone: '+919876543210',
          address: '789 Failed Rd',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India',
        },
        paymentStatus: 'failed',
        campaignId: activeCampaign.id,
      }),
    });

    const campAfter = (await testApi('/api/campaigns/active')).data.campaigns.find((c) => c.id === activeCampaign.id);
    assert.strictEqual(
      campAfter.attributedRevenue,
      revBefore,
      'Failed payment must NOT increment attributedRevenue'
    );
    console.log('  -> PASS [Test 2.6]: Failed/unpaid order strictly excluded from campaign revenue.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.6]:', err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`PHASE 21 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
