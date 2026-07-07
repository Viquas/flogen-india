import { useState, useEffect } from "react"
import { Phone, Star, MapPin, Quote, Home, Key, ClipboardCheck, Calculator, X, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog } from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

function SectionEyebrow({ index, label, tone = "light", center = false }: { index: string; label: string; tone?: "light" | "dark"; center?: boolean }) {
  const textColor = tone === "dark" ? "text-[#9C7C38]" : "text-[#9C7C38]"
  const ruleColor = tone === "dark" ? "bg-[#9C7C38]/60" : "bg-[#9C7C38]"
  return (
    <div className={`flex items-center gap-4 mb-10 md:mb-14 ${center ? "justify-center mx-auto w-fit" : ""}`}>
      <span className={`h-px w-12 ${ruleColor}`} />
      <p className={`font-tech text-xs tracking-[0.25em] uppercase ${textColor}`}>
        {index} — {label}
      </p>
    </div>
  )
}

export default function GeneratedPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const businessName = "Hartwell & Co Property"
  const suburb = "Mosman"
  const phone = "(02) 9969 4417"
  const telHref = "tel:0299694417"
  const formattedAddress = "42 Military Road, Mosman NSW 2088"
  const rating = "4.9"
  const userRatingCount = "212"

  const heroPhoto =
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600"
  const suburbPhoto =
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200"

  const services = [
    {
      no: "01",
      title: "Selling",
      icon: Home,
      copy: "A considered campaign for your home — from styling and photography to negotiation and settlement.",
    },
    {
      no: "02",
      title: "Buying",
      icon: Key,
      copy: "Off-market access and honest advice, so you're never bidding blind against the market.",
    },
    {
      no: "03",
      title: "Property management",
      icon: ClipboardCheck,
      copy: "Considered tenant selection and attentive upkeep, so your investment is looked after properly.",
    },
    {
      no: "04",
      title: "Appraisals",
      icon: Calculator,
      copy: "A clear, no-pressure read on what your home is worth today — and what would lift it.",
    },
  ]

  const reviews = [
    {
      text: "They sold our house for well above what two other agents quoted, and never once pushed us into a decision we weren't ready for.",
      name: "Eleanor",
    },
  ]

  const shortReviews = [
    {
      text: "Straightforward advice from the first phone call. No pressure, just a clear plan.",
      name: "Marcus, buyer",
    },
    {
      text: "Settlement was smooth and every question was answered the same day.",
      name: "Priya, vendor",
    },
  ]

  const faqs = [
    {
      q: "How do you determine a property's value?",
      a: "We compare recent, genuinely comparable sales on the same streets, then walk the property with you to account for condition, aspect, and any work that's been done. You'll get a written range, not a single guess.",
    },
    {
      q: "What's your commission structure?",
      a: "A flat, disclosed percentage agreed before we sign anything — no sliding scales or hidden marketing mark-ups. We'll talk you through it at the appraisal.",
    },
    {
      q: "How long does a typical sale take?",
      a: "Most campaigns in this market run four to six weeks from launch to exchange, though it varies with season and property type. We'll give you a realistic timeline up front.",
    },
    {
      q: "Do you help with property management?",
      a: "Yes — tenant selection, routine inspections, and maintenance coordination are all part of our property management service for investment owners.",
    },
    {
      q: "What areas do you service?",
      a: `We focus on ${suburb} and the surrounding suburbs, where we track every sale closely rather than spreading thin across the wider region.`,
    },
  ]

  const galleryPhotos = [
    {
      src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600",
      alt: `Contemporary architectural home exterior represented by ${businessName}`,
    },
    {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
      alt: "Light-filled open-plan living room with timber floors and floor-to-ceiling glazing",
    },
    {
      src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1600",
      alt: "Designer kitchen with stone benchtop and integrated joinery",
    },
    {
      src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1600",
      alt: "Period home facade with manicured hedging and a paved entry path",
    },
    {
      src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=1600",
      alt: "Primary bedroom suite with warm natural light and neutral furnishings",
    },
    {
      src: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=1600",
      alt: "Landscaped backyard with pool overlooking the harbour side of the suburb",
    },
    {
      src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600",
      alt: `The ${businessName} office reception, styled in the agency's quiet-luxury palette`,
    },
    {
      src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600",
      alt: `Leafy streetscape in ${suburb} showing period and contemporary homes`,
    },
  ]

  const showPrev = () =>
    setLightboxIndex((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length)
  const showNext = () =>
    setLightboxIndex((i) => (i + 1) % galleryPhotos.length)

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") showPrev()
      if (e.key === "ArrowRight") showNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen])

  return (
    <div className="bg-[#FBFAF7] font-sans">
      {/* 1. Nav */}
      <nav className="bg-[#FBFAF7] border-b border-[#E8E4DA] px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-30">
        <span className="font-elegant font-medium text-xl tracking-[-0.01em] text-[#14213D]">
          {businessName}
        </span>
        <div className="flex items-center gap-5">
          {phone && (
            <a
              href={telHref}
              className="hidden sm:inline text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300"
            >
              {phone}
            </a>
          )}
          <a
            href="#appraisal"
            className="inline-flex items-center gap-2 border border-[#9C7C38] text-[#9C7C38] text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-300 hover:bg-[#9C7C38] hover:text-[#FBFAF7] hover:scale-105"
          >
            Book an appraisal
          </a>
        </div>
      </nav>

      {/* 2. Hero — full bleed editorial overlay */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
        <img
          src={heroPhoto}
          alt={`Contemporary architectural home in ${suburb} represented by ${businessName}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14213D] via-[#14213D]/55 to-[#14213D]/10" />
        <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-16 md:pb-24 max-w-6xl mx-auto">
          <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#9C7C38] mb-6">
            {suburb.toUpperCase()} — REAL ESTATE
          </p>
          <h1 className="font-elegant font-medium text-[clamp(3rem,7vw,6rem)] tracking-[-0.02em] leading-[1.0] text-[#FBFAF7] max-w-3xl">
            Homes in {suburb},
            <br />
            handled with care.
          </h1>
          {rating && (
            <div className="mt-8 inline-flex items-center gap-2 bg-[#14213D]/60 border border-[#8C93A8]/30 rounded-full pl-3 pr-4 py-2 w-fit">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#9C7C38] text-[#9C7C38]" />
                ))}
              </div>
              <span className="text-sm text-[#8C93A8]">
                {rating} · {userRatingCount} Google reviews
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 3. Services — editorial list */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <SectionEyebrow index="02" label="WHAT WE DO" />
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#14213D] mb-16 max-w-xl">
            Four services. One standard of care.
          </h2>
          <div className="flex flex-col">
            {services.map((service) => (
              <div
                key={service.no}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8 items-baseline py-8 border-t border-[#E8E4DA] last:border-b"
              >
                <span className="sm:col-span-1 font-tech text-sm text-[#9C7C38]">
                  {service.no}
                </span>
                <h3 className="sm:col-span-4 font-elegant font-medium text-2xl md:text-3xl text-[#14213D]">
                  {service.title}
                </h3>
                <p className="sm:col-span-7 text-base md:text-lg leading-relaxed text-[#5C6478]">
                  {service.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Results band — midnight */}
      <section className="bg-[#14213D] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <SectionEyebrow index="03" label="TRACK RECORD" tone="dark" center />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 text-center sm:items-start">
            <div>
              <p className="font-elegant font-medium text-[clamp(2.5rem,5vw,4rem)] tracking-[-0.02em] leading-[1.0] text-[#FBFAF7] whitespace-nowrap">
                {rating}<span className="text-[0.35em] align-middle ml-1">★</span>
              </p>
              <p className="mt-3 font-tech text-xs tracking-[0.25em] uppercase text-[#9C7C38]">
                Client rating
              </p>
            </div>
            <div>
              <p className="font-elegant font-medium text-[clamp(2.5rem,5vw,4rem)] tracking-[-0.02em] leading-[1.0] text-[#FBFAF7] whitespace-nowrap">
                {userRatingCount}
              </p>
              <p className="mt-3 font-tech text-xs tracking-[0.25em] uppercase text-[#9C7C38]">
                Reviews
              </p>
            </div>
            <div>
              <p className="font-elegant font-medium text-[clamp(2.5rem,5vw,4rem)] tracking-[-0.02em] leading-[1.0] text-[#FBFAF7] whitespace-nowrap">
                Local
              </p>
              <p className="mt-3 font-tech text-xs tracking-[0.25em] uppercase text-[#9C7C38]">
                Locally owned
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Suburb expertise — editorial split */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <SectionEyebrow index="04" label="SUBURB EXPERTISE" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
            <div className="md:col-span-6">
              <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#14213D]">
                We know {suburb} street by street.
              </h2>
              <p className="mt-8 text-base md:text-lg leading-relaxed text-[#5C6478] max-w-lg">
                Buyers move on {suburb} for the same reasons they always
                have — the harbour glimpses, the walk to the village, the
                schools within a ten-minute stroll. Understanding which of
                those a particular home can genuinely claim, and pricing it
                honestly against what's actually settled nearby, is most of
                the job. We track every sale on these streets, not just the
                ones that make the portals.
              </p>
              <p className="mt-6 flex items-center gap-2 text-sm text-[#5C6478]">
                <MapPin className="size-4 text-[#9C7C38]" />
                {formattedAddress}
              </p>
            </div>
            <div className="md:col-span-6 relative">
              <div className="absolute -inset-4 border border-[#9C7C38] rounded-2xl -z-0 hidden md:block" />
              <img
                src={suburbPhoto}
                alt={`Leafy streetscape in ${suburb} showing period and contemporary homes`}
                className="relative w-full h-[420px] md:h-[480px] object-cover rounded-2xl md:ml-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Gallery — click-to-open lightbox */}
      <section className="px-6 md:px-10 py-24 md:py-32 border-t border-[#E8E4DA]">
        <div className="max-w-6xl mx-auto">
          <SectionEyebrow index="05" label="THE PORTFOLIO" />
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#14213D] mb-16 max-w-xl">
            Homes we've been trusted with.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {galleryPhotos.map((photo, i) => (
              <button
                type="button"
                key={photo.src}
                onClick={() => {
                  setLightboxIndex(i)
                  setLightboxOpen(true)
                }}
                className="block w-full text-left cursor-pointer group overflow-hidden rounded-xl"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-[160px] md:h-[220px] object-cover transition-all duration-300 group-hover:opacity-90 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full mx-4 max-h-[85vh]"
        >
          <img
            src={galleryPhotos[lightboxIndex].src}
            alt={galleryPhotos[lightboxIndex].alt}
            className="w-full h-[85vh] object-contain"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
            className="absolute top-0 right-0 md:-top-4 md:-right-4 size-10 flex items-center justify-center rounded-full bg-[#14213D] text-[#FBFAF7] hover:bg-[#9C7C38] transition-all duration-300 cursor-pointer"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={showPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-full bg-[#14213D]/70 text-[#9C7C38] hover:bg-[#9C7C38] hover:text-[#14213D] transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-full bg-[#14213D]/70 text-[#9C7C38] hover:bg-[#9C7C38] hover:text-[#14213D] transition-all duration-300 cursor-pointer"
          >
            <ChevronRight className="size-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-tech text-xs tracking-[0.2em] uppercase text-[#FBFAF7] bg-[#14213D]/70 px-3 py-1.5">
            <span className="text-[#9C7C38]">{lightboxIndex + 1}</span> / {galleryPhotos.length}
          </p>
        </div>
      </Dialog>

      {/* 6. Testimonial — oversized quote + short review cards */}
      <section className="px-6 md:px-10 py-24 md:py-32 border-t border-[#E8E4DA]">
        <div className="max-w-4xl mx-auto text-center">
          <SectionEyebrow index="06" label="WHAT CLIENTS SAY" center />
          <Quote className="size-10 text-[#9C7C38] mb-6 mx-auto" />
          <p className="font-elegant italic text-[clamp(1.5rem,3vw,2.5rem)] leading-snug text-[#14213D] max-w-3xl mx-auto">
            "{reviews[0].text}"
          </p>
          <p className="mt-8 text-sm text-[#5C6478]">— {reviews[0].name}</p>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            {shortReviews.map((review) => (
              <div
                key={review.name}
                className="rounded-2xl border border-[#E8E4DA] p-6 md:p-7"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-[#9C7C38] text-[#9C7C38]" />
                  ))}
                </div>
                <p className="text-base leading-relaxed text-[#5C6478]">
                  "{review.text}"
                </p>
                <p className="mt-4 text-sm text-[#14213D]">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Appraisal CTA — midnight */}
      <section id="appraisal" className="bg-[#14213D] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <SectionEyebrow index="07" label="FREE APPRAISAL" tone="dark" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-5">
              <h2 className="font-elegant font-medium text-[clamp(2.5rem,5.5vw,4rem)] tracking-[-0.02em] leading-[1.05] text-[#FBFAF7]">
                What's your home worth?
              </h2>
              <p className="mt-6 text-base md:text-lg leading-relaxed text-[#8C93A8] max-w-sm">
                A straight answer, no obligation — usually within
                forty-eight hours of getting in touch.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {phone && (
                  <a
                    href={telHref}
                    className="inline-flex items-center gap-2 text-sm text-[#8C93A8] hover:text-[#FBFAF7] transition-all duration-300 w-fit"
                  >
                    <Phone className="size-4 text-[#9C7C38]" />
                    {phone}
                  </a>
                )}
                {formattedAddress && (
                  <span className="inline-flex items-center gap-2 text-sm text-[#8C93A8]">
                    <MapPin className="size-4 text-[#9C7C38]" />
                    {formattedAddress}
                  </span>
                )}
              </div>
            </div>
            <form className="md:col-span-7 bg-[#FBFAF7] rounded-3xl p-8 md:p-10 grid grid-cols-1 sm:grid-cols-2 gap-5 h-fit">
              <div>
                <Label htmlFor="name" className="text-sm text-[#5C6478]">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  className="mt-2 bg-white border-[#E8E4DA] text-[#14213D] placeholder:text-[#5C6478]/60"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm text-[#5C6478]">
                  Phone
                </Label>
                <Input
                  id="phone"
                  placeholder="Best number to reach you"
                  className="mt-2 bg-white border-[#E8E4DA] text-[#14213D] placeholder:text-[#5C6478]/60"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="suburb" className="text-sm text-[#5C6478]">
                  Property suburb
                </Label>
                <Input
                  id="suburb"
                  placeholder={`e.g. ${suburb}`}
                  className="mt-2 bg-white border-[#E8E4DA] text-[#14213D] placeholder:text-[#5C6478]/60"
                />
              </div>
              <Button className="sm:col-span-2 mt-2 bg-[#9C7C38] text-[#FBFAF7] hover:bg-[#89692f] font-medium transition-all duration-300 w-fit px-8 rounded-full">
                Request my appraisal
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 8. Opening hours — quiet, understated */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <SectionEyebrow index="08" label="OPENING HOURS" center />
          <div className="flex items-start gap-4 w-fit mx-auto">
            <Clock className="size-5 text-[#9C7C38] mt-1 shrink-0" />
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between py-3 border-b border-[#E8E4DA]">
                <span className="text-base text-[#14213D]">Monday – Friday</span>
                <span className="text-base text-[#5C6478]">9:00am – 5:30pm</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[#E8E4DA]">
                <span className="text-base text-[#14213D]">Saturday</span>
                <span className="text-base text-[#5C6478]">9:00am – 1:00pm, by appointment</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-base text-[#14213D]">Sunday</span>
                <span className="text-base text-[#5C6478]">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ — accordion */}
      <section className="px-6 md:px-10 py-24 md:py-32 border-t border-[#E8E4DA]">
        <div className="max-w-3xl mx-auto">
          <SectionEyebrow index="09" label="COMMON QUESTIONS" center />
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="font-elegant font-medium text-lg md:text-xl text-[#14213D]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-[#5C6478]">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 10. Footer — three columns with gold hairline and depth */}
      <footer className="bg-[#F2EFE6] px-6 md:px-10 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <span className="block h-px w-full bg-[#9C7C38]/60 mb-14" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div>
              <span className="font-elegant font-medium text-xl text-[#14213D]">
                {businessName}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#5C6478] max-w-xs">
                Considered real estate for {suburb} and the surrounding
                suburbs — from first appraisal to settlement day.
              </p>
            </div>
            <div>
              <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#9C7C38] mb-4">
                Quick links
              </p>
              <nav className="flex flex-col gap-2.5">
                <a href="#appraisal" className="text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300 w-fit">
                  Book an appraisal
                </a>
                <a href="#appraisal" className="text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300 w-fit">
                  Selling
                </a>
                <a href="#appraisal" className="text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300 w-fit">
                  Buying
                </a>
                <a href="#appraisal" className="text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300 w-fit">
                  Property management
                </a>
              </nav>
            </div>
            <div>
              <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#9C7C38] mb-4">
                Contact
              </p>
              <div className="flex flex-col gap-2.5">
                {phone && (
                  <a
                    href={telHref}
                    className="inline-flex items-center gap-2 text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300 w-fit"
                  >
                    <Phone className="size-4 text-[#9C7C38]" />
                    {phone}
                  </a>
                )}
                {formattedAddress && (
                  <span className="inline-flex items-center gap-2 text-sm text-[#5C6478]">
                    <MapPin className="size-4 text-[#9C7C38]" />
                    {formattedAddress}
                  </span>
                )}
                {formattedAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#5C6478] hover:text-[#14213D] transition-all duration-300 w-fit"
                  >
                    <MapPin className="size-4 text-[#9C7C38]" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-14 pt-6 border-t border-[#E8E4DA] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#5C6478]">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
            <p className="text-xs text-[#5C6478]">{suburb} NSW</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
