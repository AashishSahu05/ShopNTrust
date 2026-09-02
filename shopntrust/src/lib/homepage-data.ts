// ============================================================
// ShopNTrust — Homepage Metadata & Value Props
// ============================================================

export interface AIValueProp {
  title: string;
  description: string;
  iconName: 'brain' | 'target' | 'message-circle' | 'shield-check';
}

export const AI_VALUE_PROPS: AIValueProp[] = [
  {
    title: 'Understands intent',
    description:
      'Describe what you need in natural language. The AI interprets your requirements, budget, and preferences — not just keywords.',
    iconName: 'brain',
  },
  {
    title: 'Smart recommendations',
    description:
      'Get products matched to your actual needs. No sponsored results, no irrelevant suggestions — just relevant picks.',
    iconName: 'target',
  },
  {
    title: 'Explains its reasoning',
    description:
      'Every recommendation comes with a clear explanation of why it fits your needs. No black-box decisions.',
    iconName: 'message-circle',
  },
  {
    title: 'You stay in control',
    description:
      'AI recommends. You decide. Nothing gets added to your cart or purchased without your explicit approval.',
    iconName: 'shield-check',
  },
];
