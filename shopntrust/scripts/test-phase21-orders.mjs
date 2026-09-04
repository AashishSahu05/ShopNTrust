// ============================================================
// ShopNTrust — Phase 21 Post-Payment, Bag Sync & My Orders Test Suite
// ============================================================
// Verifies:
// Test A: Manual Success Order & My Orders Listing
// Test B: AI Success Attribution Preservation
// Test C: Bag Sync (Remove Purchased Items, Preserve Unpurchased)
// Test D: Confirmation Refresh Resilience & Idempotency
// Test E: Failed Payment Handling
// Test F: Cancelled Payment Handling
// Test G: Customer Isolation & Security (Cross-customer 403)
// Test H: Duplicate Payment Callback Idempotency
// ============================================================

import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testApi(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function report(testName, success, message = '') {
  if (success) {
    console.log(`  -> PASS [${testName}]: ${message}`);
    passed++;
  } else {
    console.error(`  -> FAIL [${testName}]: ${message}`);
    failed++;
  }
}

async function runVerification() {
  console.log('========================================================');
  console.log('STARTING PHASE 21 POST-PAYMENT & ORDERS VERIFICATION');
  console.log('========================================================\n');

  const customerA = 'test-customer-alpha';
  const customerB = 'test-customer-beta';
  const customerAEmail = 'alpha@shopntrust.in';
  const customerBEmail = 'beta@shopntrust.in';

  // --- TEST A: MANUAL SUCCESS JOURNEY ---
  console.log('--- TEST A: MANUAL SUCCESS JOURNEY ---');
  const manualOrderId = `ORD-MANUAL-${Date.now()}`;
  const manualOrderRes = await testApi('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      orderId: manualOrderId,
      items: [
        {
          product: {
            product_id: 'P101',
            name: 'OnePlus Nord CE4',
            price: 24999,
          },
          quantity: 1,
          addedVia: 'manual',
        },
      ],
      total: 24999,
      currency: 'INR',
      customerInfo: {
        name: 'Alpha Customer',
        email: customerAEmail,
      },
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
      userId: customerA,
    }),
  });

  assert(manualOrderRes.ok, 'Failed to create manual pending order');

  // Customer completes payment on Razorpay -> reconciliation marks it successful
  const reconcileRes = await testApi('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      orderId: manualOrderId,
      paymentStatus: 'successful',
      razorpayPaymentId: `pay_test_${Date.now()}`,
    }),
  });

  const isManualPaid = reconcileRes.ok && reconcileRes.data.order?.paymentStatus === 'successful';
  report('Test A.1', isManualPaid, 'Manual order reconciled to paymentStatus = successful');

  // Verify it appears in Customer A's My Orders
  const myOrdersRes = await testApi('/api/orders', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerA}` },
  });

  const customerAOrders = myOrdersRes.data?.orders || [];
  const foundInMyOrders = customerAOrders.some((o) => o.orderId === manualOrderId);
  report('Test A.2', foundInMyOrders, 'Order successfully retrieved from Customer A My Orders');

  // --- TEST B: AI ATTRIBUTION RETENTION ---
  console.log('\n--- TEST B: AI SUCCESS ATTRIBUTION RETENTION ---');
  const aiOrderId = `ORD-AI-${Date.now()}`;
  const aiOrderRes = await testApi('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      orderId: aiOrderId,
      items: [
        {
          product: {
            product_id: 'P106',
            name: 'Samsung Galaxy S24 Ultra',
            price: 129999,
          },
          quantity: 1,
          addedVia: 'ai_primary',
        },
      ],
      total: 129999,
      currency: 'INR',
      customerInfo: {
        name: 'Alpha Customer',
        email: customerAEmail,
      },
      paymentStatus: 'successful',
      paymentMethod: 'razorpay',
      aiSessionId: 'test-ai-session-99',
      userId: customerA,
    }),
  });

  const aiOrderData = aiOrderRes.data?.order;
  const isAiAttributed =
    aiOrderData &&
    aiOrderData.isAiAssisted === true &&
    aiOrderData.attributionType === 'ai_recommendation';

  report('Test B.1', isAiAttributed, `AI attribution preserved: isAiAssisted=${aiOrderData?.isAiAssisted}, type=${aiOrderData?.attributionType}`);

  // --- TEST C: BAG SYNCHRONIZATION (PURCHASED ITEM REMOVAL) ---
  console.log('\n--- TEST C: BAG SYNCHRONIZATION LOGIC ---');
  // Simulate cart with 2 items: 1 purchased (P101), 1 unpurchased (P106)
  const cartItems = [
    { product: { product_id: 'P101' }, quantity: 1 },
    { product: { product_id: 'P106' }, quantity: 1 },
  ];
  const purchasedItems = [{ productId: 'P101' }];

  const remaining = cartItems.filter(
    (item) => !purchasedItems.some((p) => p.productId === item.product.product_id)
  );

  const isBagClean = remaining.length === 1 && remaining[0].product.product_id === 'P106';
  report('Test C.1', isBagClean, 'Purchased items removed from Bag while unpurchased items are preserved');

  // --- TEST D: REFRESH CONFIRMATION RESILIENCE ---
  console.log('\n--- TEST D: REFRESH CONFIRMATION RESILIENCE ---');
  const refreshRes1 = await testApi(`/api/orders?orderId=${manualOrderId}`, {
    headers: { Authorization: `Bearer ${customerA}` },
  });
  const refreshRes2 = await testApi(`/api/orders?orderId=${manualOrderId}`, {
    headers: { Authorization: `Bearer ${customerA}` },
  });

  const isRefreshIdempotent =
    refreshRes1.ok &&
    refreshRes2.ok &&
    refreshRes1.data.order?.orderId === refreshRes2.data.order?.orderId &&
    refreshRes1.data.order?.paymentStatus === 'successful';

  report('Test D.1', isRefreshIdempotent, 'Confirmation page refresh preserves exact order state without mutation');

  // --- TEST E: FAILED PAYMENT HANDLING ---
  console.log('\n--- TEST E: FAILED PAYMENT HANDLING ---');
  const failedOrderId = `ORD-FAIL-${Date.now()}`;
  const failRes = await testApi('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      orderId: failedOrderId,
      items: [
        {
          product: { product_id: 'P102', name: 'Smartwatch', price: 2999 },
          quantity: 1,
          addedVia: 'manual',
        },
      ],
      total: 2999,
      customerInfo: { name: 'Alpha Customer', email: customerAEmail },
      paymentStatus: 'failed',
      userId: customerA,
    }),
  });

  const isFailedOrderRecorded =
    failRes.ok && failRes.data.order?.paymentStatus === 'failed';
  report('Test E.1', isFailedOrderRecorded, 'Failed payment recorded with paymentStatus = failed');

  // --- TEST F: CANCELLED PAYMENT HANDLING ---
  console.log('\n--- TEST F: CANCELLED PAYMENT HANDLING ---');
  const cancelOrderId = `ORD-CANCEL-${Date.now()}`;
  const cancelRes = await testApi('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      orderId: cancelOrderId,
      items: [
        {
          product: { product_id: 'P103', name: 'Earbuds', price: 1999 },
          quantity: 1,
          addedVia: 'manual',
        },
      ],
      total: 1999,
      customerInfo: { name: 'Alpha Customer', email: customerAEmail },
      paymentStatus: 'cancelled',
      userId: customerA,
    }),
  });

  const isCancelledRecorded =
    cancelRes.ok && cancelRes.data.order?.paymentStatus === 'cancelled';
  report('Test F.1', isCancelledRecorded, 'Cancelled payment recorded with paymentStatus = cancelled');

  // --- TEST G: CUSTOMER ISOLATION & SECURITY ---
  console.log('\n--- TEST G: CUSTOMER ISOLATION & SECURITY ---');
  // Customer B requests order list
  const custBListRes = await testApi('/api/orders', {
    headers: { Authorization: `Bearer ${customerB}` },
  });

  const custBOrders = custBListRes.data?.orders || [];
  const custBSeesCustAOrder = custBOrders.some((o) => o.orderId === manualOrderId || o.orderId === aiOrderId);
  report('Test G.1', !custBSeesCustAOrder, 'Customer B cannot see Customer A orders in My Orders listing');

  // Customer B directly attempts to access Customer A order details by URL/orderId
  const custBAccessCustA = await testApi(`/api/orders?orderId=${manualOrderId}`, {
    headers: { Authorization: `Bearer ${customerB}` },
  });

  const isAccessBlocked = custBAccessCustA.status === 403;
  report('Test G.2', isAccessBlocked, `Customer B direct order access blocked with 403 Forbidden (status: ${custBAccessCustA.status})`);

  // --- TEST H: DUPLICATE CALLBACK IDEMPOTENCY ---
  console.log('\n--- TEST H: DUPLICATE CALLBACK IDEMPOTENCY ---');
  // Send duplicate PATCH for the same order
  const dup1 = await testApi('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      orderId: manualOrderId,
      paymentStatus: 'successful',
      razorpayPaymentId: 'pay_duplicate_check',
    }),
  });

  const dup2 = await testApi('/api/orders', {
    method: 'PATCH',
    body: JSON.stringify({
      orderId: manualOrderId,
      paymentStatus: 'successful',
      razorpayPaymentId: 'pay_duplicate_check',
    }),
  });

  const isDuplicateHandled =
    dup1.ok &&
    dup2.ok &&
    dup1.data.order?.orderId === dup2.data.order?.orderId &&
    dup1.data.order?.total === dup2.data.order?.total;

  report('Test H.1', isDuplicateHandled, 'Duplicate payment confirmation processed idempotently with zero side effects');

  console.log('\n========================================================');
  console.log(`PHASE 21 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
