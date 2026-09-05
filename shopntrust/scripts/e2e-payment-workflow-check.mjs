// ============================================================
// ShopNTrust — End-to-End Payment Workflow Comprehensive Audit
// ============================================================

import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const postJson = (path, body) =>
  request(
    {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    body
  );

const patchJson = (path, body) =>
  request(
    {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    body
  );

const getJson = (path) =>
  request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'GET',
  });

async function runPaymentWorkflowAudit() {
  console.log('================================================================');
  console.log('AUDITING FULL PAYMENT WORKFLOW END-TO-END');
  console.log('================================================================\n');

  let passedChecks = 0;
  const totalChecks = 7;

  // STEP 1: Baseline Analytics
  console.log('STEP 1: Fetching initial merchant analytics baseline...');
  const analyticsRes = await getJson('/api/merchant/analytics?range=all');
  console.log('Initial Revenue Status:', {
    totalRevenue: analyticsRes.data.analytics.revenue.total,
    aiRevenue: analyticsRes.data.analytics.revenue.aiAssisted,
    manualRevenue: analyticsRes.data.analytics.revenue.manual,
    ordersCount: analyticsRes.data.analytics.orders.total,
  });
  console.log('✓ STEP 1 Passed: Baseline loaded successfully.\n');
  passedChecks++;

  // STEP 2: Initiate Order at Checkout Boundary
  console.log('STEP 2: Creating pending order with AI session attribution...');
  const testOrderId = `ORD-AUDIT-${Date.now()}`;
  const totalAmount = 134900 + 1900; // ₹1,36,800
  const aiSessionId = `audit_session_${Date.now()}`;

  const orderItems = [
    {
      product: {
        product_id: 'P101',
        name: 'Apple iPhone 16 Pro Max',
        price: 134900,
        currency: 'INR',
        brand: 'Apple',
        category: 'Smartphones',
      },
      quantity: 1,
      addedVia: 'ai_primary',
    },
    {
      product: {
        product_id: 'P106',
        name: 'Apple 20W USB-C Power Adapter',
        price: 1900,
        currency: 'INR',
        brand: 'Apple',
        category: 'Accessories',
      },
      quantity: 1,
      addedVia: 'ai_cross_sell',
    },
  ];

  const createOrderRes = await postJson('/api/orders', {
    orderId: testOrderId,
    items: orderItems,
    total: totalAmount,
    currency: 'INR',
    customerInfo: {
      name: 'Aashish Sahu',
      email: 'aashish@shopntrust.dev',
      phone: '+919876543210',
      address: 'Plot 42, Tech Park Avenue',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
    },
    paymentStatus: 'pending',
    paymentMethod: 'razorpay',
    aiSessionId,
    userId: 'audit-user-123',
  });

  console.log('Order Creation Response:', {
    status: createOrderRes.status,
    orderId: createOrderRes.data.order?.orderId,
    paymentStatus: createOrderRes.data.order?.paymentStatus,
    isAiAssisted: createOrderRes.data.order?.isAiAssisted,
    attributionType: createOrderRes.data.order?.attributionType,
  });

  const createdPendingOrder = createOrderRes.data.order;

  if (
    createOrderRes.status === 201 &&
    createdPendingOrder.paymentStatus === 'pending' &&
    createdPendingOrder.isAiAssisted === true &&
    (createdPendingOrder.attributionType === 'ai_recommendation' || createdPendingOrder.attributionType === 'ai_mixed')
  ) {
    console.log('✓ STEP 2 Passed: Order successfully initialized in pending state with AI attribution.\n');
    passedChecks++;
  } else {
    throw new Error('STEP 2 Failed: Order state incorrect.');
  }

  // STEP 3: Razorpay Webhook Simulation (/api/payment/webhook)
  console.log('STEP 3: Simulating authoritative Razorpay payment webhook (payment_link.paid / payment.captured)...');
  const simulatedPaymentId = `pay_audit_${Date.now()}`;
  const webhookPayload = {
    event: 'payment_link.paid',
    order_id: testOrderId,
    payment_id: simulatedPaymentId,
    payload: {
      payment: {
        entity: {
          id: simulatedPaymentId,
          amount: totalAmount * 100,
          currency: 'INR',
          status: 'captured',
          order_id: testOrderId,
          notes: {
            'Order ID ': testOrderId,
          },
        },
      },
      payment_link: {
        entity: {
          id: 'plink_audit_987',
          status: 'paid',
          reference_id: testOrderId,
          payment_id: simulatedPaymentId,
        },
      },
    },
  };

  const webhookRes = await postJson('/api/payment/webhook', webhookPayload);
  console.log('Webhook Response:', webhookRes.data);

  if (
    webhookRes.status === 200 &&
    webhookRes.data.success === true &&
    webhookRes.data.paymentStatus === 'successful'
  ) {
    console.log('✓ STEP 3 Passed: Webhook successfully transitioned order to confirmed/successful.\n');
    passedChecks++;
  } else {
    throw new Error('STEP 3 Failed: Webhook handler did not return success.');
  }

  // STEP 4: Query Updated Order Record & Persistence
  console.log('STEP 4: Verifying order persistence and status reconciliation...');
  const orderDetailRes = await getJson(`/api/orders?orderId=${testOrderId}`);
  const reconciledOrder = orderDetailRes.data.order;

  console.log('Reconciled Order Status:', {
    orderId: reconciledOrder.orderId,
    status: reconciledOrder.status,
    paymentStatus: reconciledOrder.paymentStatus,
    razorpayPaymentId: reconciledOrder.razorpayPaymentId,
    isAiAssisted: reconciledOrder.isAiAssisted,
    total: reconciledOrder.total,
  });

  if (
    reconciledOrder.paymentStatus === 'successful' &&
    reconciledOrder.status === 'order_confirmed' &&
    reconciledOrder.razorpayPaymentId === simulatedPaymentId
  ) {
    console.log('✓ STEP 4 Passed: Authoritative database reflects confirmed order with Razorpay payment ID.\n');
    passedChecks++;
  } else {
    throw new Error('STEP 4 Failed: Reconciled order state mismatch.');
  }

  // STEP 5: Verify Webhook Idempotency
  console.log('STEP 5: Testing duplicate webhook delivery (Idempotency check)...');
  const duplicateWebhookRes = await postJson('/api/payment/webhook', webhookPayload);
  if (duplicateWebhookRes.status === 200 && duplicateWebhookRes.data.paymentStatus === 'successful') {
    console.log('✓ STEP 5 Passed: Duplicate webhook handled idempotently with zero side effects.\n');
    passedChecks++;
  } else {
    throw new Error('STEP 5 Failed: Duplicate webhook handling failed.');
  }

  // STEP 6: Status Check Endpoint (/api/payment/status-check)
  console.log('STEP 6: Testing /api/payment/status-check endpoint for live reconciliation...');
  const statusCheckRes = await postJson('/api/payment/status-check', {
    orderId: testOrderId,
  });
  console.log('Status Check Response:', statusCheckRes.data);

  if (statusCheckRes.status === 200 && statusCheckRes.data.status === 'successful') {
    console.log('✓ STEP 6 Passed: Status check endpoint recognized confirmed order immediately.\n');
    passedChecks++;
  } else {
    throw new Error('STEP 6 Failed: Status check failed.');
  }

  // STEP 7: Merchant Analytics Dynamic Update
  console.log('STEP 7: Verifying Merchant Revenue Analytics dynamically updated...');
  const updatedAnalyticsRes = await getJson('/api/merchant/analytics?range=all');
  const updatedRevenue = updatedAnalyticsRes.data.analytics.revenue;

  console.log('Updated Merchant Analytics:', {
    totalRevenue: updatedRevenue.total,
    aiRevenue: updatedRevenue.aiAssisted,
    manualRevenue: updatedRevenue.manual,
    aiContributionPercent: updatedRevenue.aiContributionPercent,
  });

  const revenueDelta = updatedRevenue.total - analyticsRes.data.analytics.revenue.total;
  const aiRevenueDelta = updatedRevenue.aiAssisted - analyticsRes.data.analytics.revenue.aiAssisted;

  console.log(`Revenue Delta: +₹${revenueDelta}, AI Revenue Delta: +₹${aiRevenueDelta}`);

  if (revenueDelta === totalAmount && aiRevenueDelta === totalAmount) {
    console.log('✓ STEP 7 Passed: Merchant analytics reflects exact order total attributed to AI revenue.\n');
    passedChecks++;
  } else {
    throw new Error(`STEP 7 Failed: Expected revenue delta ₹${totalAmount}, got ₹${revenueDelta}`);
  }

  console.log('================================================================');
  console.log(`PAYMENT WORKFLOW AUDIT COMPLETE: ${passedChecks} OF ${totalChecks} STEPS PASSED! 🎉`);
  console.log('================================================================');
}

runPaymentWorkflowAudit().catch((err) => {
  console.error('Audit Error:', err);
  process.exit(1);
});
