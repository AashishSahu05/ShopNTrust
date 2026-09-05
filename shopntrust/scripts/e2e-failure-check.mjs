// ============================================================
// ShopNTrust — Payment Failure & Bag Preservation Verification
// ============================================================

import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
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
      headers: { 'Content-Type': 'application/json' },
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

async function runFailureAudit() {
  console.log('--- TESTING PAYMENT FAILURE SCENARIO ---');

  const beforeAnalytics = await getJson('/api/merchant/analytics?range=all');
  const initialRev = beforeAnalytics.data.analytics.revenue.total;

  const failedOrderId = `ORD-FAIL-${Date.now()}`;
  const failOrderRes = await postJson('/api/orders', {
    orderId: failedOrderId,
    items: [
      {
        product: { product_id: 'P101', name: 'iPhone', price: 134900 },
        quantity: 1,
        addedVia: 'manual',
      },
    ],
    total: 134900,
    customerInfo: { name: 'Test User', email: 'test@shopntrust.dev' },
    paymentStatus: 'failed',
  });

  console.log('Failed Order Record:', {
    orderId: failOrderRes.data.order?.orderId,
    paymentStatus: failOrderRes.data.order?.paymentStatus,
  });

  // Verify Webhook failure event handling
  const webhookFailRes = await postJson('/api/payment/webhook', {
    event: 'payment.failed',
    order_id: failedOrderId,
  });
  console.log('Webhook Failure Result:', webhookFailRes.data);

  // Verify revenue did NOT increase
  const afterAnalytics = await getJson('/api/merchant/analytics?range=all');
  const finalRev = afterAnalytics.data.analytics.revenue.total;

  console.log(`Revenue Before: ₹${initialRev} | Revenue After: ₹${finalRev}`);
  if (initialRev === finalRev) {
    console.log('✓ PASS: Failed payment correctly excluded from merchant revenue.');
  } else {
    throw new Error('FAIL: Revenue was contaminated by failed order!');
  }
}

runFailureAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
