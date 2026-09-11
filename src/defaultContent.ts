import { SalesPageContent } from './types';

export const CHECKOUT_URL =
  'https://nestuge.com/checkout?items=%5B%7B%22id%22%3A%22pr_mtw1msxq7hws1maikpflkzq6r5f47%22%2C%22type%22%3A%22registration%22%2C%22plan%22%3A%22pl_mtw23ncu5txku6p3isvdevpmnxjxv%22%2C%22count%22%3A1%2C%22affiliate%22%3Anull%7D%5D&currency=NGN&redirectUrl=https%3A%2F%2Fnestuge.com%2Fhometrainingblueprint&utm_source=salespage';

export const DEFAULT_CONTENT: SalesPageContent = {
  mastheadText: 'SheRoots Foundation',

  heroTitle: "You're Not Failing at Discipline. You're Repeating Something You Never Chose.",
  heroSubhead: "Maybe the problem was never how you're disciplining your child — you just haven't seen the pattern yet.",
  heroImageUrl: '',
  heroImageAlt: 'Parent and child connecting with empathy and disciplined understanding',

  ledeParagraphs: [
    "Growing up, love in my house didn't come with hugs. It came as provision — school fees, food, clothes. Presence? Not really.",
    "Cry, and you're told to stop.",
    "Talk back — even with sense — and you learn fast to swallow it.",
    "My parents weren't bad people. Their own parents raised them the same way. So that's how they raised me too.",
    "But something happens to a child raised like that. You carry it into adulthood without even knowing you're carrying it. Somebody raises their voice, your body tightens. You walk into a room already reading the mood — checking how not to vex whoever's in charge.",
    "I carried all of that into my own parenting.",
    "Then one day, I heard it. My own voice. Same tone.",
    "I watched my child's face shift — that same look, that same silence I know too well. Because I lived it first."
  ],
  ledeHighlight: "That's where this started.",

  problemParagraphs: [
    "You've tried to hold yourself back. Watched the videos. Read the advice.",
    "And still — that moment comes, and you react the exact way you swore you never would.",
    "Not because you don't love your child. Not because you're not trying.",
    "It's because you're stuck between two fears.",
    "Fear of being too soft — raising a child with no respect, no boundaries, no sense.",
    "And fear of becoming the parent you grew up under — the shouting, the fear, the silence that followed.",
    "So you go back and forth. Strict one day. Guilty the next. Holding back until you can't, then reacting until you're ashamed.",
    "And slowly, you watch it happen — your child pulling away. Talking less. Going quiet in a way that wasn't there before."
  ],
  problemPunchline: "You don't need another theory on parenting. You need to know — in the exact moment it matters — what to do instead.",

  turnParagraphs: [
    "Here's what nobody told you.",
    "You weren't just taught how to discipline. You were taught a pattern — and patterns don't ask permission. They just run.",
    "Every time you react in a way you hate, that's not a character flaw. That's the pattern, playing out again.",
    "You can't fix what you can't see.",
    "That's the actual turn. Not more willpower. Not another video."
  ],
  turnBanner: "First, see the pattern. Then, replace it — one moment at a time.",

  introParagraphs: [
    "This is what The Home Training Blueprint Bundle does.",
    "It shows you your pattern — clearly, without guilt.",
    "Then it hands you what to do instead. Real scripts. Real words. For the moment it actually happens, not just for calm Sunday afternoons.",
    "Not theory. Not another book you won't finish."
  ],
  introHighlight: "A way to see the pattern — and change what happens next.",
  introCtaText: "Get The Home Training Blueprint Bundle — ₦5,000",
  introCtaUrl: CHECKOUT_URL,

  coreProducts: [
    {
      id: 'blueprint',
      name: 'The Home Training Blueprint',
      description: "Shows you your exact pattern — and where it came from. Real scenarios, not textbook theory. No more guessing what you're even trying to fix.",
      imageUrl: '',
      imageAlt: 'The Home Training Blueprint Guide'
    },
    {
      id: 'toolkit',
      name: 'Parenting Style Self-Assessment Toolkit',
      description: 'A short, honest checklist — not a quiz about parenting in general, about you. Answer it once, and your pattern stops being invisible.',
      imageUrl: '',
      imageAlt: 'Parenting Style Self-Assessment Toolkit'
    },
    {
      id: 'handbook',
      name: 'Discipline Without Damage Handbook',
      description: "Word-for-word scripts for the exact moments you'd normally shout, threaten, or go silent. No lecturing. Just what to say instead — so correction builds respect, not fear.",
      imageUrl: '',
      imageAlt: 'Discipline Without Damage Handbook'
    }
  ],

  bonusProducts: [
    {
      id: 'bonus1',
      isBonus: true,
      bonusTag: 'Bonus 1',
      name: '20 Parent-Child Conversations That Build Trust',
      description: '20 ready conversation starters for repairing after a hard moment — the step nobody ever showed you, so correction doesn\'t turn into "punish harder, apologise never."',
      imageUrl: '',
      imageAlt: 'Bonus 1: 20 Parent-Child Conversations That Build Trust'
    },
    {
      id: 'bonus2',
      isBonus: true,
      bonusTag: 'Bonus 2',
      name: 'The In-The-Moment Response Card',
      description: 'A one-page card built for the 10-second glance mid-meltdown — not calm-Tuesday reading. Comes with a weekly check-in, so you can actually see yourself changing.',
      imageUrl: '',
      imageAlt: 'Bonus 2: The In-The-Moment Response Card'
    }
  ],

  proofParagraph1: 'This bundle is new. No fake reviews, no bought-and-paid testimonials — just the method that came out of my own pattern, laid out honestly.',
  proofParagraph2Bold: "What it won't do:",
  proofParagraph2Rest: "it won't fix your child. It won't make hard moments disappear. It will show you what you're actually working with — and give you words for the moment that used to leave you empty-handed.",
  proofParagraph3: "If it doesn't do that, tell us within 7 days and we'll sort you out.",
  proofParagraph4: 'Got a question before you buy? Email us. We\'ll answer.',

  whoForTitle: 'This is for you if:',
  whoForItems: [
    'You want to raise a respectful child without becoming the parent you feared',
    'You\'ve tried holding back, and it hasn\'t stuck',
    'You\'re ready to see your pattern, not just manage the next outburst'
  ],
  notForTitle: 'This is not for you if:',
  notForItems: [
    'Your child has a diagnosed behavioural or developmental condition needing professional support — this isn\'t a substitute for that',
    'You want a quick trick with no honest look at yourself first'
  ],

  pricePreText: [
    'Think about what this is already costing you.',
    'A child who\'s starting to pull away. A pattern that could pass to the next generation. That guilt-spiral after reactions you didn\'t mean to have.'
  ],
  priceCurrent: '₦5,000',
  priceOriginal: 'Rising to ₦7,000 once the launch window closes',
  priceMetaLine1: 'Five pieces. One bundle. Combined value ₦33,000.',
  priceMetaLine2: 'Delivered straight to your email, with a confirmation page right after payment.',
  priceCtaText: 'Get The Home Training Blueprint Bundle — ₦5,000',
  priceCtaUrl: CHECKOUT_URL,

  guaranteeTitle: 'Try it for 7 days',
  guaranteeText: "If it hasn't given you a clearer picture of your pattern — and something concrete to do differently — email us within the 7 days and we'll sort you out.",

  faqTitle: 'Before you ask',
  faqs: [
    {
      id: 'faq1',
      question: '"I\'ve bought things like this and never opened them."',
      answer: "Fair. That's why this comes with the Response Card — built for the moment, not for a shelf."
    },
    {
      id: 'faq2',
      question: '"This will just tell me stuff I already know."',
      answer: "The self-assessment doesn't give you general knowledge. It gives you your pattern, by name."
    },
    {
      id: 'faq3',
      question: '"If this says I\'m the problem, I can\'t handle that right now."',
      answer: "It won't. This is information, not an indictment — read the story above again if you're not sure."
    },
    {
      id: 'faq4',
      question: '"Who are you to tell me how to raise my child?"',
      answer: "Someone who lived this pattern before trying to fix it. Not a credentials list — real experience unwinding it."
    },
    {
      id: 'faq5',
      question: '"Isn\'t this just soft Western parenting?"',
      answer: "No. The research is global. The framing is African. The goal is respect, not permissiveness."
    },
    {
      id: 'faq6',
      question: '"I\'ll deal with this when things calm down."',
      answer: "Calm isn't coming before the next flashpoint."
    },
    {
      id: 'faq7',
      question: '"My partner won\'t parent this way anyway."',
      answer: "You can't control the whole house. You can control what's yours in the moment."
    }
  ],

  whyNowParagraph1: 'The price rises from ₦5,000 to ₦7,000 once this window closes.',
  whyNowParagraph2: 'But the real reason is simpler: the next disciplinary moment is coming, whether you\'re ready or not.',
  whyNowKicker: 'The only real choice is which pattern shows up in it.',

  closeTitle: 'You already love your child.',
  closeParagraph: 'Now you get to see the pattern — and choose differently, starting with the next moment it matters.',
  closeCtaText: 'Get The Home Training Blueprint Bundle — ₦5,000',
  closeCtaUrl: CHECKOUT_URL,

  psPrefix: 'PS —',
  psParagraph1: 'A repeatable way to correct behaviour that builds respect, not fear — starting with your very next disciplinary moment.',
  psParagraph2: "Try it 7 days. Doesn't work for you? Email us and we'll sort it out.",
  psCtaText: 'Get The Home Training Blueprint Bundle — ₦5,000',
  psCtaUrl: CHECKOUT_URL,

  stickyPrice: '₦5,000',
  stickyButtonText: 'Get Bundle',
  stickyCtaUrl: CHECKOUT_URL,

  footerText: 'SheRoots Foundation — The Home Training Blueprint Bundle',

  // Best Practice Extensible Features
  enableUrgencyBanner: false,
  urgencyBannerText: 'Launch Special: Early access price of ₦5,000 will be increasing to ₦7,000.',
  enableSocialProofSection: false,
  testimonials: [],
  enableTrustBadges: true,
  trustBadgesNote: 'Secured via 256-Bit SSL Checkout • Immediate Digital Download • 7-Day Money-Back Guarantee',

  seoTitle: 'The Home Training Blueprint Bundle — SheRoots Foundation',
  seoDescription: 'You\'re not failing at discipline. You\'re repeating something you never chose. Break the pattern with practical words and scripts.'
};
