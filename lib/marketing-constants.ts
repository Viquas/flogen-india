// Marketing copy constants — single source of truth for the Somosite landing page.
// No hardcoded strings in any marketing component. All copy lives here.

const NAV = {
  logo: "Somosite",
  links: [
    { label: "Portfolio", href: "#portfolio" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ],
} as const

const HERO = {
  headline: "Precision-Built Websites That Convert Visitors Into Customers",
  subheadline:
    "We design and develop custom websites for small businesses — fast, mobile-first, and built to drive real results from day one.",
  primaryCta: "Get Started",
  secondaryCta: "View Portfolio",
  primaryCtaHref: "#contact",
  secondaryCtaHref: "#portfolio",
} as const

const TRUST_SIGNALS = [
  { icon: "CheckCircle", value: "50+", label: "Sites Delivered" },
  { icon: "Zap", value: "48hr", label: "Turnaround" },
  { icon: "Shield", value: "100%", label: "Satisfaction Guarantee" },
  { icon: "Code", value: "Modern", label: "Tech Stack" },
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
      title: "Tell Us About Your Business",
      description:
        "Share your goals, brand, and what makes your business unique. We handle the rest — no technical knowledge required.",
      icon: "MessageSquare",
    },
    {
      number: 2,
      title: "We Design Your Site",
      description:
        "Our team crafts a custom, data-driven design tailored to your industry, audience, and conversion goals.",
      icon: "Palette",
    },
    {
      number: 3,
      title: "Go Live in 48 Hours",
      description:
        "Review your site, request revisions, and launch. We handle hosting, speed optimization, and ongoing support.",
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
      name: "Saffron & Thyme",
      category: "Restaurant",
      image: "/marketing/portfolio/restaurant.jpg",
      demoUrl: "#",
    },
    {
      name: "The Gentlemen's Cut",
      category: "Barbershop",
      image: "/marketing/portfolio/barbershop.jpg",
      demoUrl: "#",
    },
    {
      name: "Bright Smile Dental",
      category: "Dental Clinic",
      image: "/marketing/portfolio/dental.jpg",
      demoUrl: "#",
    },
    {
      name: "Peak Performance Gym",
      category: "Fitness Studio",
      image: "/marketing/portfolio/fitness.jpg",
      demoUrl: "#",
    },
    {
      name: "Keystone Realty",
      category: "Real Estate",
      image: "/marketing/portfolio/realestate.jpg",
      demoUrl: "#",
    },
    {
      name: "Ember Roasters",
      category: "Coffee Shop",
      image: "/marketing/portfolio/coffeeshop.jpg",
      demoUrl: "#",
    },
  ],
} as const

const BENEFITS = {
  sectionTitle: "Why Choose Somosite",
  items: [
    {
      icon: "Zap",
      title: "Launch in 48 Hours",
      description:
        "No months of back-and-forth. Your professionally designed site goes live in two business days.",
    },
    {
      icon: "Smartphone",
      title: "Mobile-First Design",
      description:
        "Over 60% of your visitors are on mobile. Every site we build looks flawless on every screen size.",
    },
    {
      icon: "Target",
      title: "Built to Convert",
      description:
        "Strategic layouts, clear calls-to-action, and data-driven design decisions that turn visitors into paying customers.",
    },
    {
      icon: "Search",
      title: "SEO-Ready From Day One",
      description:
        "Proper meta tags, fast load times, semantic markup, and structured data so search engines find you quickly.",
    },
    {
      icon: "Headphones",
      title: "Dedicated Support",
      description:
        "Real people, not chatbots. Get responsive support from the same team that built your site.",
    },
    {
      icon: "BadgeCheck",
      title: "No Hidden Fees",
      description:
        "One transparent price. No surprise charges, no recurring fees unless you opt into a maintenance plan.",
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
