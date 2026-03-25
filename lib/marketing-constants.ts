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
  trustSignal: "500+ Websites Delivered",
} as const

const TRUST_SIGNALS = [
  { icon: "CheckCircle", label: "500+ Websites Delivered" },
  { icon: "Shield", label: "30-Day Satisfaction Guarantee" },
  { icon: "BarChart", label: "Built From Real Business Data" },
  { icon: "Clock", label: "Live in 48 Hours" },
] as const

const PROBLEM = {
  headline: "Your Website Is Losing You Customers",
  body: "Every day, potential customers visit your site and leave within seconds. Outdated designs, slow load times, and confusing layouts silently drive away the people you worked hard to attract. In a world where first impressions happen online, your website is either your best salesperson or your biggest liability.",
  emphasis:
    "You deserve a website that works as hard as you do.",
} as const

const HOW_IT_WORKS = {
  sectionTitle: "How It Works",
  sectionSubtitle:
    "From first conversation to live site in three straightforward steps.",
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
    "Precision-crafted websites across industries — each one built to convert.",
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
      title: "Built From Your Real Data",
      description:
        "We research your business using the same data your customers see. The result feels like it was written by someone who knows your business.",
    },
    {
      icon: "Fingerprint",
      title: "Looks Custom, Not Cookie-Cutter",
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
      title: "Ready in Days, Not Weeks",
      description:
        "Traditional agencies take 4-8 weeks. We deliver a preview within days.",
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
        "Perfect for small businesses that need a clean, professional online presence.",
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
        "For businesses ready to stand out with a premium, conversion-optimized site.",
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
        "We research using publicly available information \u2014 your services, location, reviews, and photos. Your website reflects your actual business, not generic content.",
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
    "Join hundreds of businesses that went from invisible to professional in days.",
  primaryCta: "Get Your Website",
  secondaryCta: "Or contact us to discuss your project",
  primaryCtaHref: "#contact",
  secondaryCtaHref: "#contact",
  scarcity: "We take on a limited number of clients each month.",
} as const

const CONTACT = {
  sectionTitle: "Get In Touch",
  sectionSubtitle:
    "Tell us about your business and we will get back to you within 24 hours with a free proposal.",
  submitButton: "Send Message",
  successMessage: "Thanks! We'll get back to you within 24 hours.",
  microcopy: "No spam, ever. We typically respond within a few hours.",
} as const

const FOOTER = {
  company: {
    name: "Somosite",
    description: "Custom websites built from real business data.",
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
