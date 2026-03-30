import Navbar from "@/components/marketing/navbar"
import Hero from "@/components/marketing/hero"
import TrustBar from "@/components/marketing/trust-bar"
import Problem from "@/components/marketing/problem"
import HowItWorks from "@/components/marketing/how-it-works"
import Portfolio from "@/components/marketing/portfolio"
import Benefits from "@/components/marketing/benefits"
import Pricing from "@/components/marketing/pricing"
import Faq from "@/components/marketing/faq"
import FinalCta from "@/components/marketing/final-cta"
import ContactForm from "@/components/marketing/contact-form"
import Footer from "@/components/marketing/footer"
import MobileCtaBar from "@/components/marketing/mobile-cta-bar"

export default function MarketingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />

      <HowItWorks />
      <Portfolio />
      <Benefits />

      <Pricing />
      <Faq />
      <FinalCta />

      <ContactForm />
      <Footer />
      <MobileCtaBar />
    </>
  )
}
