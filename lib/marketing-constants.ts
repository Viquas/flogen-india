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
  tiers: [
    {
      name: "Standard",
      price: "$499",
      period: "one-time",
      description:
        "Perfect for small businesses that need a clean, professional online presence.",
      features: [
        "Custom 5-page website",
        "Mobile-responsive design",
        "Contact form integration",
        "Basic SEO setup",
        "48-hour delivery",
        "1 round of revisions",
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
        "Custom 10-page website",
        "Advanced animations & interactions",
        "SEO optimization & analytics",
        "Blog or portfolio section",
        "Priority 48-hour delivery",
        "3 rounds of revisions",
        "90 days of free support",
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
        "Unlimited pages",
        "Custom functionality & integrations",
        "E-commerce capabilities",
        "Advanced SEO & performance",
        "Dedicated project manager",
        "Unlimited revisions",
        "6 months of priority support",
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
      question: "How fast can I get my website?",
      answer:
        "Most websites are designed, built, and delivered within 48 hours of receiving your business details. Complex projects may take 3-5 business days.",
    },
    {
      question: "What if I want changes after delivery?",
      answer:
        "Standard plans include 1 round of revisions, Pro includes 3 rounds, and Premium includes unlimited revisions. Additional revision rounds are available at a flat fee.",
    },
    {
      question: "What is included in the price?",
      answer:
        "Design, development, mobile optimization, basic SEO, contact form setup, and deployment. You receive a fully functional, live website ready to accept visitors.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "If you are not satisfied with the initial design concept, we offer a full refund before development begins. Once development starts, we work with you until you are happy with the result.",
    },
    {
      question: "What technologies do you use?",
      answer:
        "We use modern web technologies including React, Next.js, and Tailwind CSS. Every site is custom-coded — never dragged and dropped from a generic builder.",
    },
    {
      question: "Do I need my own domain and hosting?",
      answer:
        "We can work with your existing domain or help you purchase one. Hosting is included for the first year with Pro and Premium plans, or we can deploy to your preferred provider.",
    },
    {
      question: "Do you offer ongoing maintenance?",
      answer:
        "Yes. We offer optional maintenance plans starting at $49/month that cover content updates, security patches, performance monitoring, and priority support.",
    },
  ],
} as const

const FINAL_CTA = {
  headline: "Ready to Stand Out Online?",
  subheadline:
    "Join 50+ businesses that transformed their online presence. Your new website is 48 hours away.",
  primaryCta: "Start Your Project",
  secondaryCta: "View Portfolio",
  primaryCtaHref: "#contact",
  secondaryCtaHref: "#portfolio",
} as const

const CONTACT = {
  sectionTitle: "Get In Touch",
  sectionSubtitle:
    "Tell us about your business and we will get back to you within 24 hours with a free proposal.",
  fields: [
    "name",
    "email",
    "phone",
    "business_name",
    "website_url",
    "message",
  ],
} as const

const FOOTER = {
  columns: [
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Portfolio", href: "#portfolio" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Product",
      links: [
        { label: "How It Works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
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
