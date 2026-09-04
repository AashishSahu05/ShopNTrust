// scripts/test-phase16.mjs
// Comprehensive verification script for Phase 16

import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(message, context = {}) {
  const res = await fetch(`${BASE_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId: 'test-phase-16',
      context,
    }),
  });
  if (!res.ok) {
    throw new Error(`Endpoint returned status ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function runTests() {
  console.log('========================================');
  console.log('STARTING PHASE 16 ACCEPTANCE VERIFICATION');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // PRIORITY 1: Structured AI Action Dispatcher
  // ----------------------------------------------------
  console.log('--- PRIORITY 1: STRUCTURED ACTION DISPATCHER ---');

  // Test 1: Add option 1
  try {
    const res1 = await testEndpoint('Add option 1', {
      session: { recommendedProductIds: ['P101', 'P106'] },
    });
    console.log('[Test 1.1] User: "Add option 1"');
    console.log('  Actions returned:', JSON.stringify(res1.actions));
    const addAction = res1.actions?.find((a) => a.type === 'ADD_TO_BAG');
    assert(addAction, 'Expected an ADD_TO_BAG action');
    assert(
      (addAction.productIds && addAction.productIds.length > 0) || (res1.recommendedProductIds && res1.recommendedProductIds.length > 0),
      'Expected resolved product ID for option 1'
    );
    console.log('  -> PASS: ADD_TO_BAG structured action present with canonical product ID');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.1]:', err.message);
    failed++;
  }

  // Test 2: Remove P106 from my bag
  try {
    const res2 = await testEndpoint('Remove P106 from my bag', {
      session: { cartProductIds: ['P106', 'P114'] },
    });
    console.log('[Test 1.2] User: "Remove P106 from my bag"');
    console.log('  Actions returned:', JSON.stringify(res2.actions));
    const removeAction = res2.actions?.find((a) => a.type === 'REMOVE_FROM_BAG');
    assert(removeAction, 'Expected REMOVE_FROM_BAG action');
    assert(removeAction.productIds?.includes('P106'), 'Expected productIds to contain P106');
    console.log('  -> PASS: REMOVE_FROM_BAG structured action for P106');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.2]:', err.message);
    failed++;
  }

  // Test 3: Set P106 quantity to 3
  try {
    const res3 = await testEndpoint('Set P106 quantity to 3', {
      session: { cartProductIds: ['P106'] },
    });
    console.log('[Test 1.3] User: "Set P106 quantity to 3"');
    console.log('  Actions returned:', JSON.stringify(res3.actions));
    const qtyAction = res3.actions?.find((a) => a.type === 'UPDATE_QUANTITY');
    assert(qtyAction, 'Expected UPDATE_QUANTITY action');
    assert(qtyAction.productIds?.includes('P106'), 'Expected productIds to contain P106');
    assert.strictEqual(qtyAction.quantity, 3, 'Expected quantity to be 3');
    console.log('  -> PASS: UPDATE_QUANTITY structured action for P106 with quantity 3');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.3]:', err.message);
    failed++;
  }

  // Test 4: Open my bag
  try {
    const res4 = await testEndpoint('Open my bag');
    console.log('[Test 1.4] User: "Open my bag"');
    console.log('  Actions returned:', JSON.stringify(res4.actions));
    const openCartAction = res4.actions?.find((a) => a.type === 'OPEN_CART');
    assert(openCartAction, 'Expected OPEN_CART action');
    console.log('  -> PASS: OPEN_CART structured action present');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.4]:', err.message);
    failed++;
  }

  // Test 5: Checkout
  try {
    const res5 = await testEndpoint('Checkout');
    console.log('[Test 1.5] User: "Checkout"');
    console.log('  Actions returned:', JSON.stringify(res5.actions));
    const checkoutAction = res5.actions?.find((a) => a.type === 'OPEN_CHECKOUT');
    assert(checkoutAction, 'Expected OPEN_CHECKOUT action');
    // Verify no payment link created
    assert(!res5.paymentLink, 'Payment link MUST NOT be returned or created');
    console.log('  -> PASS: OPEN_CHECKOUT action present without triggering payment');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1.5]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // PRIORITY 2: Direct Product ID Comparison
  // ----------------------------------------------------
  console.log('\n--- PRIORITY 2: DIRECT PRODUCT ID COMPARISON ---');

  // Test 2.1: Compare P106 and P114
  try {
    const res21 = await testEndpoint('Compare P106 and P114');
    console.log('[Test 2.1] User: "Compare P106 and P114"');
    console.log('  Comparison:', JSON.stringify(res21.comparison));
    assert(res21.comparison, 'Expected comparison object');
    assert(res21.comparison.enabled, 'Expected comparison to be enabled');
    assert(res21.comparison.productIds.includes('P106') && res21.comparison.productIds.includes('P114'), 'Expected P106 and P114 in comparison');
    assert(!res21.message.toLowerCase().includes("couldn't find"), 'Expected no negative "could not find" error');
    assert(!res21.message.toLowerCase().includes('54-product'), 'Expected no 54-product mentions');
    console.log('  -> PASS: Canonical comparison matrix created for P106 and P114');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.1]:', err.message);
    failed++;
  }

  // Test 2.2: Compare P101 and P166 (range endpoints)
  try {
    const res22 = await testEndpoint('Compare P101 and P166');
    console.log('[Test 2.2] User: "Compare P101 and P166"');
    console.log('  Comparison:', JSON.stringify(res22.comparison));
    assert(res22.comparison, 'Expected comparison object');
    assert(res22.comparison.productIds.includes('P101') && res22.comparison.productIds.includes('P166'), 'Expected P101 and P166 in comparison');
    console.log('  -> PASS: Canonical comparison works for endpoint products P101 and P166');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.2]:', err.message);
    failed++;
  }

  // Test 2.3: Compare P999 and P106 (invalid ID handling)
  try {
    const res23 = await testEndpoint('Compare P999 and P106');
    console.log('[Test 2.3] User: "Compare P999 and P106"');
    console.log('  Recommended products:', res23.recommendedProductIds);
    // P999 is invalid; it should not be in recommendedProductIds or comparison
    assert(!res23.recommendedProductIds?.includes('P999'), 'P999 must NOT be in recommendations');
    if (res23.comparison) {
      assert(!res23.comparison.productIds.includes('P999'), 'P999 must NOT be in comparison');
    }
    console.log('  -> PASS: Invalid product ID P999 rejected safely');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.3]:', err.message);
    failed++;
  }

  // Test 2.4: "Tell me about P106" (non-comparison query)
  try {
    const res24 = await testEndpoint('Tell me about P106');
    console.log('[Test 2.4] User: "Tell me about P106"');
    console.log('  Comparison:', res24.comparison ? 'present' : 'none');
    assert(!res24.comparison, 'Comparison should NOT be triggered for single product info request');
    assert(res24.recommendedProductIds?.includes('P106'), 'P106 should be recommended');
    console.log('  -> PASS: Single product info does not trigger comparison matrix');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2.4]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // PRIORITY 3: Catalog Prompt Scope Alignment
  // ----------------------------------------------------
  console.log('\n--- PRIORITY 3: CATALOG PROMPT SCOPE ALIGNMENT ---');

  try {
    const res31 = await testEndpoint('What is in your catalog?');
    console.log('[Test 3.1] User: "What is in your catalog?"');
    console.log('  Sample response text:', res31.message.slice(0, 120) + '...');
    assert(!res31.message.toLowerCase().includes('54-product'), 'Response should not say 54-product');
    assert(!res31.message.toLowerCase().includes('54 product'), 'Response should not say 54 product');
    console.log('  -> PASS: No stale "54-product" mentions in AI response');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 3.1]:', err.message);
    failed++;
  }

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
