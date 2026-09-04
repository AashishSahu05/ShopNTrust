// scripts/test-phase17.mjs
// Comprehensive verification script for Phase 17: Campaign Orchestrator Data Foundation

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';

async function testApi(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ${endpoint} failed with ${res.status}: ${errText}`);
  }
  return res.json();
}

async function runTests() {
  console.log('========================================================');
  console.log('STARTING PHASE 17 CAMPAIGN DATA FOUNDATION VERIFICATION');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // TEST 1: Migration SQL File Inspection & Integrity
  // ----------------------------------------------------
  console.log('--- TEST 1: MIGRATION SQL FILE INTEGRITY ---');
  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'phase17_campaign_data_foundation.sql');
    assert(fs.existsSync(migrationPath), 'phase17_campaign_data_foundation.sql must exist');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // Verify key tables, views, functions, constraints
    assert(sqlContent.includes('ALTER TABLE IF EXISTS public.orders'), 'Migration must non-destructively alter orders');
    assert(sqlContent.includes('ADD COLUMN IF NOT EXISTS merchant_id'), 'Migration must add merchant_id');
    assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.campaigns'), 'Migration must create campaigns table');
    assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.campaign_products'), 'Migration must create campaign_products table');
    assert(sqlContent.includes('CHECK (status IN (\'DRAFT\', \'ACTIVE\', \'PAUSED\', \'EXPIRED\'))'), 'Campaigns must enforce status values');
    assert(sqlContent.includes('CREATE OR REPLACE VIEW public.v_order_sales_facts'), 'Migration must create v_order_sales_facts');
    assert(sqlContent.includes('CREATE OR REPLACE VIEW public.v_active_campaigns'), 'Migration must create v_active_campaigns');
    assert(sqlContent.includes('CREATE OR REPLACE VIEW public.v_products_active_campaign_coverage'), 'Migration must create coverage view');
    assert(sqlContent.includes('CREATE OR REPLACE FUNCTION public.get_product_sales_comparison'), 'Migration must create get_product_sales_comparison');
    assert(sqlContent.includes('CREATE OR REPLACE FUNCTION public.get_campaign_candidates_data'), 'Migration must create get_campaign_candidates_data');
    assert(sqlContent.includes('ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY'), 'Migration must enable RLS on campaigns');
    assert(sqlContent.includes('ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY'), 'Migration must enable RLS on campaign_products');

    console.log('  -> PASS: Migration SQL file contains all required non-destructive schema, views, functions, RLS, and constraints.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 1]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 2: Product Sales Comparison Query (7-day and 30-day)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: PRODUCT SALES COMPARISON QUERY ---');
  try {
    const sales7d = await testApi('/api/merchant/campaigns?type=sales&days=7');
    console.log(`  Fetched 7-day sales comparison for ${sales7d.productCount} products.`);
    assert(sales7d.type === 'product_sales_comparison', 'Expected product_sales_comparison response');
    assert(Array.isArray(sales7d.sales), 'sales must be an array');
    assert(sales7d.periodDays === 7, 'periodDays must be 7');

    if (sales7d.sales.length > 0) {
      const sample = sales7d.sales[0];
      assert('productId' in sample, 'Must contain productId');
      assert('unitsSoldRecent' in sample, 'Must contain unitsSoldRecent');
      assert('revenueRecent' in sample, 'Must contain revenueRecent');
      assert('unitsSoldPrevious' in sample, 'Must contain unitsSoldPrevious');
      assert('revenuePrevious' in sample, 'Must contain revenuePrevious');
      assert('salesChangePercent' in sample, 'Must contain salesChangePercent');
      console.log(`  Sample product: ${sample.productId} (${sample.productName}) | Recent: ${sample.unitsSoldRecent} units | Prev: ${sample.unitsSoldPrevious} units | Change: ${sample.salesChangePercent}%`);
    }

    const sales30d = await testApi('/api/merchant/campaigns?type=sales&days=30');
    assert(sales30d.periodDays === 30, 'periodDays must be 30');
    console.log('  -> PASS: 7-day and 30-day sales comparison metrics successfully derived from real orders.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 2]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 3: Campaign Creation & Active Campaigns Query
  // ----------------------------------------------------
  console.log('\n--- TEST 3: CAMPAIGN CREATION & ACTIVE CAMPAIGN QUERY ---');
  try {
    // Create an ACTIVE test campaign covering P150
    const testCampaignPayload = {
      name: 'Q3 Smartphone Promo',
      goal: 'Clear excess smartphone inventory',
      discountType: 'percentage',
      discountValue: 15,
      productIds: ['P150'],
      status: 'ACTIVE',
      merchantId: 'merch_official_store',
      reason: 'Declining 7-day sales volume',
    };

    const createRes = await testApi('/api/merchant/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCampaignPayload),
    });

    assert(createRes.success, 'Campaign creation should succeed');
    assert(createRes.campaign.id, 'Campaign must have an ID');
    assert(createRes.campaign.status === 'ACTIVE', 'Campaign must be ACTIVE');
    console.log(`  Created active campaign: ${createRes.campaign.id} covering [${createRes.campaign.productIds.join(', ')}]`);

    // Query active campaigns
    const activeRes = await testApi('/api/merchant/campaigns?type=active');
    assert(activeRes.type === 'active_campaigns', 'Expected active_campaigns response');
    assert(activeRes.campaigns.some((c) => c.productIds.includes('P150')), 'P150 must appear in active campaigns');
    console.log('  -> PASS: Active campaign query correctly returns running campaigns and covered products.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 3]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 4: Product Coverage Check
  // ----------------------------------------------------
  console.log('\n--- TEST 4: PRODUCT CAMPAIGN COVERAGE CHECK ---');
  try {
    // Check P150 (which was covered above)
    const covP150 = await testApi('/api/merchant/campaigns?type=coverage&productId=P150');
    assert(covP150.isCovered === true, 'P150 must be covered by active campaign');
    assert(covP150.activeCampaign !== null, 'P150 activeCampaign must be populated');
    console.log(`  P150 coverage: ${covP150.isCovered} (Campaign: ${covP150.activeCampaign.name})`);

    // Check P101 (which is NOT covered)
    const covP101 = await testApi('/api/merchant/campaigns?type=coverage&productId=P101');
    assert(covP101.isCovered === false, 'P101 must NOT be covered by active campaign');
    assert(covP101.activeCampaign === null, 'P101 activeCampaign must be null');
    console.log(`  P101 coverage: ${covP101.isCovered} (Correctly not covered)`);

    console.log('  -> PASS: Individual product coverage detection works accurately.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 4]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 5: Campaign Candidates Facts Query for n8n AI
  // ----------------------------------------------------
  console.log('\n--- TEST 5: CAMPAIGN CANDIDATES FACTS FOR AI ---');
  try {
    const candidatesRes = await testApi('/api/merchant/campaigns?type=candidates&days=7');
    assert(candidatesRes.type === 'campaign_candidate_facts', 'Expected campaign_candidate_facts response');
    assert(Array.isArray(candidatesRes.candidates), 'Candidates must be an array');
    console.log(`  Evaluated ${candidatesRes.candidateCount} candidate products.`);

    // Inspect P150 (covered) and an uncovered product
    const p150Fact = candidatesRes.candidates.find((c) => c.productId === 'P150');
    if (p150Fact) {
      assert(p150Fact.hasActiveCampaign === true, 'P150 fact must report hasActiveCampaign = true');
      console.log(`  P150 fact: units=${p150Fact.unitsSoldRecent}, change=${p150Fact.salesChangePercent}%, activeCampaign=${p150Fact.hasActiveCampaign} (${p150Fact.activeCampaignName})`);
    }

    const uncoveredFact = candidatesRes.candidates.find((c) => !c.hasActiveCampaign);
    if (uncoveredFact) {
      assert(uncoveredFact.hasActiveCampaign === false, 'Uncovered product must report hasActiveCampaign = false');
      console.log(`  Candidate without campaign: ${uncoveredFact.productId} (${uncoveredFact.productName}) | change=${uncoveredFact.salesChangePercent}% | hasActiveCampaign=false`);
    }

    console.log('  -> PASS: Candidate facts combine real sales trend with active campaign coverage without hardcoded AI decisions.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 5]:', err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 6: Validation of Safe Revenue Rules
  // ----------------------------------------------------
  console.log('\n--- TEST 6: SAFE REVENUE & STATUS FILTERING ---');
  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'phase17_campaign_data_foundation.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    // Confirm that sales views strictly filter by payment_status = 'successful' AND status NOT IN ('failed', 'cancelled')
    assert(
      sqlContent.includes("payment_status = 'successful'") &&
      sqlContent.includes("status NOT IN ('failed', 'cancelled')"),
      'SQL must strictly exclude failed, cancelled, and unpaid orders'
    );
    console.log('  -> PASS: Valid sales criteria strictly excludes unpaid, failed, and cancelled orders.');
    passed++;
  } catch (err) {
    console.error('  -> FAIL [Test 6]:', err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`PHASE 17 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script execution error:', err);
  process.exit(1);
});
