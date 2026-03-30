// Marketing copy constants — single source of truth for the Somosite landing page.
// No hardcoded strings in any marketing component. All copy lives here.

const NAV = {
  logo: "Somosite",
  links: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Our Work", href: "#portfolio" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  cta: { label: "Contact Us", href: "#contact" },
} as const

const HERO = {
  headline: "A professional website built from your real business data",
  subheadline:
    "We research your actual business — your services, reviews, and market — then build a custom website designed to convert visitors into customers. No templates. No stock content. Ready in days.",
  primaryCta: "See Our Work",
  secondaryCta: "View Pricing",
  primaryCtaHref: "#portfolio",
  secondaryCtaHref: "#pricing",
} as const

const TRUST_SIGNALS = [
  { icon: "Shield", label: "30-Day Money-Back Guarantee" },
  { icon: "CheckCircle", label: "Full Ownership, No Lock-In" },
  { icon: "BarChart", label: "Built From Your Actual Business Info" },
  { icon: "Clock", label: "Live in 48 Hours" },
] as const

const PROBLEM = {
  headline: "Invisible Online Means Invisible to Customers",
  body: "Every day without a professional website, your potential customers find your competitors instead. They search, they compare, and they choose the business that looks most trustworthy online. The problem isn\u2019t that building a website is hard \u2014 it\u2019s that most options either cost thousands or look like every other template on the internet. Your business is unique. Your online presence should match.",
} as const

const HOW_IT_WORKS = {
  sectionTitle: "How It Works",
  sectionSubtitle:
    "From research to live site in three simple steps.",
  steps: [
    {
      number: 1,
      title: "We Research Your Business",
      description:
        "We study your services, reviews, location, and market. No questionnaires. No back-and-forth. We use real data about your actual business.",
      icon: "Search",
    },
    {
      number: 2,
      title: "We Build Your Custom Website",
      description:
        "Our design system creates a professional, mobile-optimized website using your real business information. No templates. No stock content.",
      icon: "Palette",
    },
    {
      number: 3,
      title: "You Review and Go Live",
      description:
        "Preview your website, request any changes, and go live on your own domain. Full support included. Ready in days, not weeks.",
      icon: "Rocket",
    },
  ],
} as const

const PORTFOLIO = {
  sectionTitle: "Our Work",
  sectionSubtitle:
    "Websites we\u2019ve built \u2014 each one unique to the business.",
  items: [
    {
      name: "The Olive Table",
      category: "Italian Restaurant",
      image: "/marketing/portfolio/restaurant.jpg",
      demoUrl: "/preview/the-olive-table",
    },
    {
      name: "Bright Smile Dental",
      category: "Family Dental Practice",
      image: "/marketing/portfolio/dental.jpg",
      demoUrl: "/preview/bright-smile-dental",
    },
    {
      name: "Morrison & Associates",
      category: "Personal Injury Law",
      image: "/marketing/portfolio/law.jpg",
      demoUrl: "/preview/morrison-associates",
    },
    {
      name: "Elite Auto Detailing",
      category: "Mobile Car Detailing",
      image: "/marketing/portfolio/auto.jpg",
      demoUrl: "/preview/elite-auto-detailing",
    },
    {
      name: "Flow Yoga Studio",
      category: "Yoga & Wellness",
      image: "/marketing/portfolio/yoga.jpg",
      demoUrl: "/preview/flow-yoga-studio",
    },
    {
      name: "The Gentleman's Cut",
      category: "Barbershop",
      image: "/marketing/portfolio/barbershop.jpg",
      demoUrl: "/preview/the-gentlemans-cut",
    },
  ],
  qualityBadges: [
    { icon: "Gauge", label: "PageSpeed 95+" },
    { icon: "Smartphone", label: "Mobile Responsive" },
    { icon: "Database", label: "Built From Real Data" },
  ],
} as const

const BENEFITS = {
  sectionTitle: "Why Choose Somosite",
  items: [
    {
      icon: "Database",
      title: "Feels Like a $5,000 Custom Site",
      description:
        "We study your services, reviews, and market the same way your customers do. The result feels like it was written by someone who actually knows your business.",
    },
    {
      icon: "Fingerprint",
      title: "Your Competitors Will Think You Hired an Agency",
      description:
        "Every website is designed individually. Different colors, layouts, and content. No two sites look the same.",
    },
    {
      icon: "Smartphone",
      title: "Mobile-First, SEO-Ready",
      description:
        "Every site loads fast, looks great on phones, and is structured for search engines.",
    },
    {
      icon: "Zap",
      title: "Go From Invisible to Professional in 48 Hours",
      description:
        "Traditional agencies take 4\u20138 weeks. We deliver a preview within days.",
    },
    {
      icon: "ShieldCheck",
      title: "You Own Everything",
      description:
        "Your website, your domain, your content. No monthly subscriptions. One price, full ownership.",
    },
  ],
} as const

const PRICING = {
  sectionTitle: "Simple, Transparent Pricing",
  sectionSubtitle:
    "One-time investment. No subscriptions, no surprise fees. Your site, fully owned by you.",
  anchoring:
    "Traditional web design agencies charge $3,000\u2013$10,000 and take 8\u201312 weeks. We eliminated the overhead \u2014 not the quality.",
  guarantee: "30-Day Satisfaction Guarantee",
  noHiddenFees: "No hidden fees. One-time payment. You own everything.",
  tiers: [
    {
      name: "Standard",
      price: "$499",
      period: "one-time",
      description:
        "Everything you need to get found online and start converting visitors.",
      features: [
        "Custom website built from your business data",
        "Mobile-responsive design",
        "SEO-ready structure",
        "Free subdomain (yourname.somosite.com)",
        "Custom domain setup support",
        "30-day satisfaction guarantee",
      ],
      cta: "Get Started",
      ctaHref: "#contact",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$1,299",
      period: "one-time",
      description:
        "For businesses that want bookings, calls, and customers from day one.",
      features: [
        "Everything in Standard",
        "Online booking system integration",
        "Priority delivery",
        "Onboarding call with our team",
        "Advanced customization support",
      ],
      cta: "Get Started",
      ctaHref: "#contact",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Premium",
      price: "Custom",
      period: "quote",
      description:
        "Enterprise-grade solutions for businesses with complex requirements.",
      features: [
        "Enterprise-level websites",
        "Custom integrations",
        "Dedicated support",
      ],
      cta: "Contact Us",
      ctaHref: "#contact",
      highlighted: false,
    },
  ],
} as const

const FAQ = {
  sectionTitle: "Frequently Asked Questions",
  items: [
    {
      question: "How is this different from Wix or Squarespace?",
      answer:
        "Those are DIY tools where you build from templates. We research your business and build a custom site for you. The result looks like a $5,000 agency site, not a template.",
    },
    {
      question: "What if I don\u2019t like the design?",
      answer:
        "Request changes before going live. We offer a 30-day satisfaction guarantee.",
    },
    {
      question: "Do I own my website?",
      answer:
        "Yes. 100% ownership. Your code, your domain, your content. No lock-in.",
    },
    {
      question: "Are there recurring costs?",
      answer:
        "It\u2019s a one-time purchase. The only recurring cost is domain registration (~$10\u201315/year) if you want a custom domain.",
    },
    {
      question: "How do you know about my business?",
      answer:
        "We research your business the same way your customers would \u2014 by looking at your services, reviews, location, and photos. This means your website reflects what real people see when they search for you.",
    },
    {
      question: "How long does it take?",
      answer:
        "Your preview is ready within a few days. Go live within 48 hours after approval.",
    },
    {
      question: "Can I upgrade later?",
      answer:
        "Yes. Standard clients can upgrade to Pro anytime. We apply the difference.",
    },
  ],
} as const

const FINAL_CTA = {
  headline: "Ready to see what we can build for your business?",
  subheadline:
    "Get a website that matches the quality of your business.",
  primaryCta: "Get Your Website",
  secondaryCta: "Or contact us to discuss your project",
  primaryCtaHref: "#contact",
  secondaryCtaHref: "#contact",
  scarcity: "We take on a limited number of clients each month.",
} as const

const CONTACT = {
  sectionTitle: "Tell Us About Your Business",
  sectionSubtitle:
    "Tell us your business name and location \u2014 we\u2019ll build a free website preview and send it to you within 48 hours.",
  submitButton: "Send Message",
  successMessage: "Thanks! We'll get back to you within 24 hours.",
  microcopy: "No spam, ever. We typically respond within a few hours.",
  nextSteps: [
    "You tell us about your business",
    "We build your free preview",
    "You review it \u2014 no obligation",
  ],
} as const

const FOOTER = {
  company: {
    name: "Somosite",
    description: "Custom websites for businesses ready to grow online.",
    email: "hello@somosite.com",
    location: "Bangalore, India",
  },
  columns: [
    {
      title: "Company",
      links: [
        { label: "Portfolio", href: "#portfolio" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Product",
      links: [
        { label: "How It Works", href: "#how-it-works" },
        { label: "Our Work", href: "#portfolio" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
        { label: "Client Portal", href: "/portal" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refund" },
      ],
    },
    {
      title: "Trust",
      links: [
        { label: "Secure Payments", href: "#" },
        { label: "SSL Protected", href: "#" },
        { label: "Satisfaction Guarantee", href: "#" },
      ],
    },
  ],
  guarantee: "30-Day Satisfaction Guarantee",
  ssl: "SSL Protected",
  copyright: `\u00A9 ${new Date().getFullYear()} Somosite. All rights reserved.`,
  paymentMethods: ["Visa", "Mastercard", "UPI"],
} as const

// Aggregate export
export const MARKETING = {
  NAV,
  HERO,
  TRUST_SIGNALS,
  PROBLEM,
  HOW_IT_WORKS,
  PORTFOLIO,
  BENEFITS,
  PRICING,
  FAQ,
  FINAL_CTA,
  CONTACT,
  FOOTER,
} as const

// Named exports for convenient imports
export {
  NAV,
  HERO,
  TRUST_SIGNALS,
  PROBLEM,
  HOW_IT_WORKS,
  PORTFOLIO,
  BENEFITS,
  PRICING,
  FAQ,
  FINAL_CTA,
  CONTACT,
  FOOTER,
}

// Type exports
export type PricingTier = (typeof PRICING.tiers)[number]
export type NavLink = (typeof NAV.links)[number]
export type TrustSignal = (typeof TRUST_SIGNALS)[number]
export type FAQItem = (typeof FAQ.items)[number]
export type PortfolioItem = (typeof PORTFOLIO.items)[number]
export type BenefitItem = (typeof BENEFITS.items)[number]
