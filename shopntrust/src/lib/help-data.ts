// ============================================================
// ShopNTrust — Customer Help Center Knowledge Base
// ============================================================
// Structured data model for customer-facing Help Center articles,
// categorized topics, and instant client-side search.
// Reflects authentic ShopNTrust platform behavior with zero technical leakage.
// ============================================================

export interface HelpArticle {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  bullets?: string[];
  keywords: string[];
  popular?: boolean;
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  iconName:
    | 'sparkles'
    | 'bot'
    | 'shopping-bag'
    | 'shopping-cart'
    | 'credit-card'
    | 'package'
    | 'user'
    | 'flame'
    | 'headphones';
  articlesCount: number;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn how ShopNTrust works and how to begin shopping.',
    iconName: 'sparkles',
    articlesCount: 3,
  },
  {
    id: 'ai-shopping',
    title: 'AI Shopping',
    description: 'Discover natural-language shopping, recommendations, and agentic assistance.',
    iconName: 'bot',
    articlesCount: 7,
  },
  {
    id: 'shopping-products',
    title: 'Shopping & Products',
    description: 'Explore the canonical catalog, product IDs, stock levels, and comparisons.',
    iconName: 'shopping-bag',
    articlesCount: 5,
  },
  {
    id: 'bag-checkout',
    title: 'Bag & Checkout',
    description: 'Manage your unified Bag, update quantities, and proceed to checkout.',
    iconName: 'shopping-cart',
    articlesCount: 4,
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Understand secure Razorpay payments, payment states, and resolution steps.',
    iconName: 'credit-card',
    articlesCount: 6,
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'Track Order IDs, verify payment confirmations, and monitor order lifecycle.',
    iconName: 'package',
    articlesCount: 4,
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Manage sign-in, profile preferences, Bag persistence, and session history.',
    iconName: 'user',
    articlesCount: 5,
  },
  {
    id: 'campaigns-offers',
    title: 'Campaigns & Offers',
    description: 'Learn about featured promotional campaigns and verified discount badges.',
    iconName: 'flame',
    articlesCount: 5,
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    description: 'Get in touch with our customer support team for order and shopping assistance.',
    iconName: 'headphones',
    articlesCount: 3,
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // ============================================================
  // 1. GETTING STARTED
  // ============================================================
  {
    id: 'what-is-shopntrust',
    categoryId: 'getting-started',
    question: 'What is ShopNTrust?',
    answer:
      'ShopNTrust is an autonomous agentic commerce platform combining verified flagship tech, personal audio, smart gear, athletic apparel, and wellness essentials with intelligent natural-language guidance.',
    bullets: [
      'Browse our curated collection of verified products with direct retail pricing.',
      'Shop with an intelligent AI shopping agent that understands natural-language requests.',
      'Compare products side-by-side with genuine canonical specifications.',
      'Complete purchases through verified, secure Razorpay checkout workflows.',
    ],
    keywords: ['what is shopntrust', 'about', 'overview', 'how it works', 'platform'],
    popular: true,
  },
  {
    id: 'how-to-start-shopping',
    categoryId: 'getting-started',
    question: 'How do I start shopping on ShopNTrust?',
    answer:
      'You have two first-class shopping paths on ShopNTrust, and you can switch between them at any time:',
    bullets: [
      'Explore Storefront / Catalog (/shop): Browse categories manually with instant keyword search, brand filters, and price sorting.',
      'AI Shopping (/ai-shop): State your requirements in plain English (e.g., "Find a flagship phone under ₹1,20,000 with best camera") to receive curated matches.',
    ],
    keywords: ['start shopping', 'how to buy', 'browse', 'shop', 'begin'],
    popular: true,
  },
  {
    id: 'account-required-to-browse',
    categoryId: 'getting-started',
    question: 'Do I need an account to browse products?',
    answer:
      'No. You can freely browse our complete 66-item canonical catalog, view product specifications, search by brand, and even interact with the AI Shopping agent as a guest without creating an account. An account is only required when saving your personalized category preferences or completing checkout.',
    keywords: ['guest', 'account required', 'sign in to browse', 'anonymous', 'register'],
  },

  // ============================================================
  // 2. AI SHOPPING
  // ============================================================
  {
    id: 'what-is-ai-shopping',
    categoryId: 'ai-shopping',
    question: 'What is AI Shopping?',
    answer:
      'AI Shopping is our natural-language agentic shopping experience. Instead of adjusting countless manual filters, you can describe exactly what you need in plain everyday language. The AI agent understands your intent, consults our verified product catalog, explains why each item fits your criteria, and executes shopping actions for you.',
    keywords: ['ai shopping', 'agentic commerce', 'chatbot', 'assistant', 'smart shopping'],
    popular: true,
  },
  {
    id: 'what-can-ai-agent-do',
    categoryId: 'ai-shopping',
    question: 'What can the AI Shopping Agent do?',
    answer:
      'The AI Shopping Agent is a full-featured shopping companion capable of multiple agentic actions:',
    bullets: [
      'Personalized Recommendations: Finds genuine items matching your budget, preferred brands, and use case.',
      'Direct Product Comparison: Generates instant side-by-side spec comparisons between two or more items (e.g., "Compare P106 and P114").',
      'One-Command Bag Actions: Adds products to your Bag, updates quantities, or removes items on command.',
      'Upsell & Compatibility Guidance: Suggests compatible accessories (like cases or chargers) without aggressive upselling.',
      'Stock & Pricing Queries: Answers questions about stock availability, warranties, and promotional offers.',
    ],
    keywords: ['ai capabilities', 'features', 'actions', 'compare', 'agent', 'what can it do'],
  },
  {
    id: 'natural-language-prompts',
    categoryId: 'ai-shopping',
    question: 'Can I describe what I want in normal everyday language?',
    answer:
      'Yes! You do not need technical jargon or exact model codes. You can ask naturally:',
    bullets: [
      '"Find me wireless noise-cancelling earbuds under ₹10,000 for gym workouts."',
      '"What is the difference between Samsung S24 Ultra and iPhone 16 Pro Max?"',
      '"I need a lightweight laptop for university coding with great battery life."',
      '"Add the first phone to my bag and show me compatible chargers."',
    ],
    keywords: ['prompts', 'natural language', 'queries', 'conversational', 'examples'],
  },
  {
    id: 'ai-recommendations-accuracy',
    categoryId: 'ai-shopping',
    question: 'How does the AI recommend products accurately?',
    answer:
      'Unlike generic chatbots that hallucinate or guess specifications, ShopNTrust connects the AI directly to our canonical catalog. The agent grounds every recommendation in real specifications, genuine retail prices, and live stock statuses. It will never invent a product, discount, or spec that does not exist in our catalog.',
    keywords: ['accuracy', 'hallucination', 'real specs', 'canonical', 'reliable'],
  },
  {
    id: 'ai-compare-products',
    categoryId: 'ai-shopping',
    question: 'Can the AI compare products directly?',
    answer:
      'Yes. You can ask the agent to compare items by name or by their canonical Product IDs (e.g., "Compare P101 and P106"). The agent delivers a structured side-by-side comparison covering display, processor, camera, battery, build, and pricing to help you make an informed decision.',
    keywords: ['compare', 'side by side', 'vs', 'comparison', 'specs'],
  },
  {
    id: 'ai-add-to-bag',
    categoryId: 'ai-shopping',
    question: 'Can the AI add products to my Bag?',
    answer:
      'Yes. When you tell the agent to add an item (e.g., "Add option 1 to my bag" or "Add P114 to my bag"), it dispatches a structured action that immediately adds the item to your unified Shopping Bag. You will see a confirmation pill and your Bag counter in the navbar will update instantly.',
    keywords: ['add to bag', 'cart action', 'ai cart', 'one command', 'bag'],
    popular: true,
  },
  {
    id: 'does-ai-make-payments',
    categoryId: 'ai-shopping',
    question: 'Does the AI Shopping Agent make payments for me?',
    answer:
      'No. ShopNTrust strictly upholds customer sovereignty. The AI agent can help you find products, compare options, and prepare your Bag, but it will NEVER autonomously charge your account or initiate payment. Payment is always an explicit customer action: you review your order summary on the checkout screen and choose to pay via our secure Razorpay gateway.',
    bullets: [
      'Customer Sovereignty: You always have final approval over what you purchase.',
      'No Hidden Additions: The agent only acts on your direct instructions.',
      'Secure Payment Gate: Payments require your direct authentication with Razorpay and your bank.',
    ],
    keywords: ['payment boundary', 'autonomous payment', 'does ai pay', 'security', 'customer sovereignty'],
    popular: true,
  },

  // ============================================================
  // 3. SHOPPING & PRODUCTS
  // ============================================================
  {
    id: 'how-products-identified',
    categoryId: 'shopping-products',
    question: 'How are products identified on ShopNTrust?',
    answer:
      'Every product has an authoritative canonical Product ID (e.g., P101 for OnePlus Nord CE6, P106 for Samsung Galaxy S24 Ultra, P114 for iPhone 16 Pro Max). Using deterministic Product IDs guarantees that the item you see, compare, and add to your Bag is the exact item delivered.',
    keywords: ['product id', 'canonical', 'p101', 'p106', 'p114', 'catalog'],
  },
  {
    id: 'where-product-info-comes-from',
    categoryId: 'shopping-products',
    question: 'Where does product information come from?',
    answer:
      'All product details, high-resolution photography, retail prices, and specifications originate directly from our verified master catalog. We do not aggregate unverified third-party marketplace listings or scrape unverified web sources.',
    keywords: ['catalog', 'source', 'authentic', 'verified products', 'information'],
  },
  {
    id: 'viewing-product-details',
    categoryId: 'shopping-products',
    question: 'How do I view detailed product specifications?',
    answer:
      'Click on any product card in the Storefront, Catalog, or AI Shopping view to open its dedicated Product Detail Page (/product/[productId]). There you can inspect full hardware specifications, key features, authentic imagery, pricing breakdown, and warranty details.',
    keywords: ['product details', 'specifications', 'detail page', 'pdp', 'specs'],
  },
  {
    id: 'stock-status-indicators',
    categoryId: 'shopping-products',
    question: 'How do I know whether a product is in stock?',
    answer:
      'Each product card displays a clear stock badge:',
    bullets: [
      'In Stock: Available for immediate order and delivery.',
      'Low Stock: Limited inventory remaining in our fulfillment center.',
      'Sold Out: Currently out of stock; cannot be added to Bag until replenished.',
    ],
    keywords: ['stock', 'inventory', 'in stock', 'low stock', 'sold out', 'availability'],
  },
  {
    id: 'genuine-brand-authenticity',
    categoryId: 'shopping-products',
    question: 'Are all brand products 100% authentic?',
    answer:
      'Yes. Every product across our electronics, personal audio, smartwatches, athletics, and skincare collections is 100% genuine and covered by standard brand warranty. We partner directly with verified suppliers to ensure zero counterfeit goods.',
    keywords: ['authentic', 'genuine', 'fake', 'counterfeit', 'warranty', 'brands'],
  },

  // ============================================================
  // 4. BAG & CHECKOUT
  // ============================================================
  {
    id: 'how-to-add-to-bag',
    categoryId: 'bag-checkout',
    question: 'How do I add a product to my Bag?',
    answer:
      'You can add products to your Bag in two convenient ways:',
    bullets: [
      'Manual Quick Add: Click the "Add to Bag" button directly on any product card or detail page.',
      'AI Command: In AI Shopping (/ai-shop), type "Add [Product Name or ID] to my bag" and the agent will add it for you.',
    ],
    keywords: ['add to bag', 'cart', 'how to add', 'add item', 'buy item'],
    popular: true,
  },
  {
    id: 'unified-bag-behavior',
    categoryId: 'bag-checkout',
    question: 'Do manual shopping and AI Shopping share the same Bag?',
    answer:
      'Yes! ShopNTrust features a single, unified Shopping Bag. Products added manually through the catalog and products added through conversational AI commands converge seamlessly into the exact same Bag. You will never have conflicting or isolated carts.',
    keywords: ['unified bag', 'shared cart', 'ai bag', 'sync cart', 'same bag'],
    popular: true,
  },
  {
    id: 'update-remove-bag-items',
    categoryId: 'bag-checkout',
    question: 'How do I change quantity or remove an item from my Bag?',
    answer:
      'Click the "Bag" icon in the top navigation to view your cart items. Use the (+) and (-) buttons to adjust quantities, or click the trash can icon to remove an item completely. In AI Shopping, you can also say "Remove P101 from my bag" or "Change quantity of P106 to 2".',
    keywords: ['remove item', 'change quantity', 'delete from bag', 'update quantity', 'cart'],
  },
  {
    id: 'how-to-checkout',
    categoryId: 'bag-checkout',
    question: 'How do I checkout?',
    answer:
      'When you are ready to complete your purchase, open your Bag and click "Proceed to Checkout". You will be taken to the Checkout screen (/checkout) where you can review your items, enter shipping information, and verify the order total before proceeding to payment.',
    keywords: ['checkout', 'how to checkout', 'order review', 'proceed to pay', 'shipping'],
    popular: true,
  },

  // ============================================================
  // 5. PAYMENTS
  // ============================================================
  {
    id: 'how-does-payment-work',
    categoryId: 'payments',
    question: 'How does payment work on ShopNTrust?',
    answer:
      'ShopNTrust integrates with Razorpay, India\'s leading secure payment gateway. After reviewing your order on the checkout screen, click "Proceed to Payment". A secure Razorpay payment window will open where you can pay using your preferred payment method.',
    bullets: [
      'UPI: Instant payment via Google Pay, PhonePe, Paytm, or any UPI app.',
      'Cards: Visa, Mastercard, RuPay, and American Express Debit & Credit cards.',
      'Net Banking: Major Indian banks with secure 2-factor authentication.',
      'Wallets: Popular digital wallets supported by Razorpay.',
    ],
    keywords: ['payment', 'how to pay', 'razorpay', 'upi', 'cards', 'netbanking', 'methods'],
    popular: true,
  },
  {
    id: 'what-happens-after-click-pay',
    categoryId: 'payments',
    question: 'What happens after I click "Proceed to Payment"?',
    answer:
      'Our checkout creates a secure payment session and generates a direct Razorpay payment link. You will be prompted to authorize the transaction through your chosen payment provider (such as entering your UPI PIN or bank OTP). Upon completion, your order status is verified immediately.',
    keywords: ['click pay', 'payment session', 'authorization', 'otp', 'upi pin'],
  },
  {
    id: 'what-if-payment-fails',
    categoryId: 'payments',
    question: 'What happens if my payment fails?',
    answer:
      'If your payment fails due to insufficient funds, bank server timeouts, or accidental cancellation, do not worry! You will be guided to the Payment Failed screen (/payment/failed). Your items remain safely preserved in your Bag so you can easily retry with another payment method without starting over.',
    keywords: ['payment failed', 'failure', 'retry payment', 'declined', 'timeout'],
    popular: true,
  },
  {
    id: 'what-if-payment-is-pending',
    categoryId: 'payments',
    question: 'What happens if payment is pending?',
    answer:
      'In rare cases when your bank takes extra time to confirm the transaction, your order will be marked as "PENDING". Our system automatically listens for the bank\'s confirmation. Once confirmed, your order status updates to "PAID" automatically. If funds were debited but the order does not confirm, the bank will automatically refund the amount within standard banking windows.',
    keywords: ['payment pending', 'pending', 'bank delay', 'debited', 'processing'],
  },
  {
    id: 'is-payment-secure',
    categoryId: 'payments',
    question: 'Is my payment information safe?',
    answer:
      'Yes, 100%. ShopNTrust never stores your card numbers, CVVs, or bank credentials. All transactions are encrypted with bank-grade 256-bit SSL encryption and processed entirely within Razorpay\'s PCI-DSS compliant infrastructure.',
    keywords: ['security', 'safe', 'encryption', 'pci dss', 'card storage', 'privacy'],
  },
  {
    id: 'can-i-cancel-during-payment',
    categoryId: 'payments',
    question: 'Can I cancel during payment?',
    answer:
      'Yes. If you close the payment window before completing the transaction, no charges will be applied. Your order status will reflect as uncompleted and your Bag contents will remain intact.',
    keywords: ['cancel payment', 'abort', 'close window', 'not charged'],
  },

  // ============================================================
  // 6. ORDERS
  // ============================================================
  {
    id: 'what-happens-after-successful-payment',
    categoryId: 'orders',
    question: 'What happens after a successful payment?',
    answer:
      'Once your payment is verified by Razorpay, you are instantly redirected to the Payment Success screen (/payment/success). There you will receive your unique Order ID, a detailed receipt of purchased products, the payment reference code, and estimated delivery schedule.',
    keywords: ['after payment', 'success', 'confirmation', 'receipt', 'order placed'],
    popular: true,
  },
  {
    id: 'where-is-my-order-id',
    categoryId: 'orders',
    question: 'Where can I find my Order ID?',
    answer:
      'Your unique Order ID (formatted as e.g. ORD-172543...) is displayed prominently on the Payment Success screen immediately following checkout. It is also recorded in your customer profile under order history.',
    keywords: ['order id', 'tracking id', 'where is order id', 'reference', 'receipt'],
    popular: true,
  },
  {
    id: 'order-status-lifecycle',
    categoryId: 'orders',
    question: 'How are order statuses shown?',
    answer:
      'Orders move through clear, transparent lifecycle stages:',
    bullets: [
      'PAID: Payment is fully verified and your items are confirmed for packaging and dispatch.',
      'PENDING: The transaction is undergoing bank verification before confirmation.',
      'FAILED: The payment was unsuccessful; items remain in Bag for retry.',
    ],
    keywords: ['order status', 'lifecycle', 'paid', 'pending', 'failed', 'tracking'],
  },
  {
    id: 'delivery-and-shipping-times',
    categoryId: 'orders',
    question: 'What are the delivery and shipping timeframes?',
    answer:
      'All orders are dispatched from verified distribution centers. Metro deliveries typically arrive within 2–3 business days, while standard domestic shipping takes 3–5 business days with full package tracking.',
    keywords: ['delivery', 'shipping', 'how long', 'arrival', 'tracking', 'dispatch'],
  },

  // ============================================================
  // 7. ACCOUNT
  // ============================================================
  {
    id: 'how-to-sign-in',
    categoryId: 'account',
    question: 'How do I create an account or sign in?',
    answer:
      'Click "Sign In / Account" in the top navigation bar. A quick authentication modal will appear. You can enter your email address to sign in, or use the pre-configured Demo Customer account for instant access without entering passwords.',
    keywords: ['sign in', 'create account', 'login', 'register', 'demo account'],
    popular: true,
  },
  {
    id: 'what-info-is-saved',
    categoryId: 'account',
    question: 'What information is saved with my profile?',
    answer:
      'Your customer profile saves your name, email address, preferred shopping categories (e.g., Mobiles, Audio, Wearables), and order history. This helps the AI Shopping agent tailor recommendations to your preferences.',
    keywords: ['profile info', 'data', 'preferences', 'saved info', 'privacy'],
  },
  {
    id: 'bag-persistence',
    categoryId: 'account',
    question: 'Does my Bag remain saved across visits?',
    answer:
      'Yes. When you are signed in, your Bag items remain securely saved in your customer session. If you close your browser and return later, your selected products will still be in your Bag ready for checkout.',
    keywords: ['bag persistence', 'save cart', 'resume shopping', 'cart saved'],
  },
  {
    id: 'ai-conversation-persistence',
    categoryId: 'account',
    question: 'Does my AI Shopping conversation persist?',
    answer:
      'Yes. When signed into your customer account, your chat session with the AI Shopping Agent is saved. You can revisit past recommendations, review previous product comparisons, and continue conversations seamlessly.',
    keywords: ['chat persistence', 'conversation history', 'saved chat', 'ai history'],
  },
  {
    id: 'logging-out',
    categoryId: 'account',
    question: 'What happens when I log out?',
    answer:
      'Logging out clears your active customer session from the browser. Your profile, order history, and saved preferences remain safely stored in your account so you can log back in at any time.',
    keywords: ['logout', 'sign out', 'session clear'],
  },

  // ============================================================
  // 8. CAMPAIGNS & OFFERS
  // ============================================================
  {
    id: 'what-is-featured-campaign',
    categoryId: 'campaigns-offers',
    question: 'What is a featured campaign?',
    answer:
      'A featured campaign is a curated promotional sales event showcasing select verified products with limited-time discounts (e.g., "Mobile Phones Sales Booster with 10% OFF"). Featured campaigns are highlighted on our homepage in a 3D showpiece card with a live countdown timer.',
    keywords: ['campaign', 'featured campaign', 'promotion', 'sales booster', 'offer'],
    popular: true,
  },
  {
    id: 'how-discounts-appear',
    categoryId: 'campaigns-offers',
    question: 'How do campaign discounts appear on products?',
    answer:
      'When an active campaign is running, every participating product displays a glowing promotional badge (such as "🔥 10% OFF") on its product card. The direct retail price automatically reflects the discount so you never have to search for coupon codes.',
    keywords: ['discount badge', 'coupon code', 'promo code', 'how discounts work'],
  },
  {
    id: 'how-to-shop-campaign',
    categoryId: 'campaigns-offers',
    question: 'How do I shop products included in an active campaign?',
    answer:
      'Click the "Shop the Campaign →" button on the homepage hero campaign card. This navigates directly to a curated catalog view filtered specifically to the products participating in the active promotion.',
    keywords: ['shop campaign', 'filter campaign', 'view campaign items', 'campaign products'],
  },
  {
    id: 'no-fabricated-discounts',
    categoryId: 'campaigns-offers',
    question: 'Are campaign discounts real or fabricated?',
    answer:
      'Every discount on ShopNTrust is 100% genuine. We strictly prohibit fake strike-through pricing or artificial markups before sales. When a campaign offers 10% OFF, that discount applies directly against the authentic retail price.',
    keywords: ['fake discount', 'authentic discount', 'strike through', 'real price'],
  },
  {
    id: 'campaign-expiration',
    categoryId: 'campaigns-offers',
    question: 'What happens when a campaign expires?',
    answer:
      'Campaigns are strictly time-limited. Once the countdown timer reaches zero, the campaign concludes automatically. Products return to standard direct retail prices and the promotional badge is removed.',
    keywords: ['campaign expires', 'countdown ends', 'limited time', 'duration'],
  },

  // ============================================================
  // 9. CONTACT SUPPORT
  // ============================================================
  {
    id: 'how-to-contact-support',
    categoryId: 'contact-support',
    question: 'How can I contact customer support?',
    answer:
      'Our dedicated customer assistance team is available to help you with order queries, payment verifications, and shopping assistance. You can reach out through our official support channels listed below or use our quick inquiry card.',
    bullets: [
      'Order & Delivery Assistance: Help with tracking, status queries, or delivery updates.',
      'Payment Verification: Guidance on pending bank transactions or refund resolutions.',
      'Product Queries: Inquiries regarding specifications, compatibility, and availability.',
    ],
    keywords: ['contact support', 'customer care', 'help desk', 'reach out', 'assistance'],
    popular: true,
  },
  {
    id: 'support-hours',
    categoryId: 'contact-support',
    question: 'What are customer support operating hours?',
    answer:
      'Our customer support team operates Monday through Saturday, 9:00 AM to 8:00 PM IST. Inquiries submitted outside these hours are prioritized and addressed first thing on the next business morning.',
    keywords: ['support hours', 'timings', 'availability', 'operating hours', 'time'],
  },
  {
    id: 'how-to-resolve-payment-inquiry',
    categoryId: 'contact-support',
    question: 'How do I resolve an urgent payment or order issue?',
    answer:
      'When reaching out regarding an order or payment, please have your Order ID (e.g., ORD-...) or your Razorpay payment reference number handy. This enables our support team to verify the transaction status immediately with our banking gateway.',
    keywords: ['payment issue', 'urgent', 'resolve payment', 'order issue', 'help'],
  },
];
