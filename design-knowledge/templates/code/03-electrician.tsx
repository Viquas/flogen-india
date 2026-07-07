import { useEffect, useState } from "react"
import {
  Phone,
  Star,
  ShieldCheck,
  Zap,
  Lightbulb,
  Plug,
  ClipboardCheck,
  BatteryCharging,
  AlarmClock,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function GeneratedPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const businessName = "Northline Electrical Co."
  const phone = "0412 884 207"
  const telHref = "tel:0412884207"
  const suburb = "Mona Vale"
  const formattedAddress = "14 Bungan Street, Mona Vale NSW 2103"
  const rating = "4.9"
  const userRatingCount = "186+"

  const services = [
    {
      index: "01",
      label: "SWITCHBOARDS",
      title: "Switchboard upgrades",
      copy: "Old fuse boxes swapped for compliant safety-switch boards, sized right for the load your house actually carries.",
      icon: Zap,
      span: "md:col-span-4",
    },
    {
      index: "02",
      label: "LIGHTING",
      title: "LED lighting",
      copy: "Downlights, sensor lighting and outdoor runs — brighter rooms on a fraction of the running cost.",
      icon: Lightbulb,
      span: "md:col-span-3",
    },
    {
      index: "03",
      label: "POWER",
      title: "Power points & wiring",
      copy: "New circuits, extra outlets, rewires for renovations — clean cable runs, no shortcuts.",
      icon: Plug,
      span: "md:col-span-3",
    },
    {
      index: "04",
      label: "SAFETY",
      title: "Safety inspections",
      copy: "Full circuit and switchboard audit with a written compliance report you can hand to your insurer.",
      icon: ClipboardCheck,
      span: "md:col-span-3",
    },
    {
      index: "05",
      label: "EV CHARGING",
      title: "EV charger installs",
      copy: "Home EV charger supply and installation, sized to your switchboard and certified to standard.",
      icon: BatteryCharging,
      photo:
        "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1600",
      alt: "Electric vehicle charging cable connected to a home wall charger",
      span: "md:col-span-6",
    },
    {
      index: "06",
      label: "EMERGENCY",
      title: "Emergency callouts",
      copy: "Power out, board tripping, sparks where they shouldn't be — we answer around the clock.",
      icon: AlarmClock,
      span: "md:col-span-6",
      emergency: true,
    },
  ]

  const reviews = [
    {
      text: "Rewired our whole switchboard after it kept tripping. Explained every step, left the place spotless. Wouldn't call anyone else on the Beaches.",
      name: "Hamish",
    },
    {
      text: "Quoted a fixed price, turned up on time, no surprises on the invoice. The EV charger install was clean work.",
      name: "Priya",
    },
    {
      text: "Called at 9pm with a tripping board and someone was here within the hour. Calm, methodical, sorted it first visit.",
      name: "Dean",
    },
  ]

  const hours = [
    { day: "Mon – Fri", time: "7:00am – 5:00pm" },
    { day: "Saturday", time: "By appointment" },
    { day: "Sunday", time: "Emergency callouts only" },
  ]

  const faqs = [
    {
      q: "Are you a licensed electrician?",
      a: "Yes — fully licensed and insured to work on residential and light commercial electrical systems across the Northern Beaches.",
    },
    {
      q: "Do you offer emergency callouts?",
      a: "Yes, around the clock. Power out, board tripping, or anything that smells or sparks — we answer, day or night.",
    },
    {
      q: "Can you upgrade my switchboard?",
      a: "Absolutely. We assess your existing board, size a compliant safety-switch board for your actual load, and handle the full upgrade and certification.",
    },
    {
      q: "Do you install EV chargers?",
      a: "Yes — home EV charger supply and installation, sized to your switchboard and certified to Australian standard.",
    },
    {
      q: "Do you provide safety certificates?",
      a: "Every job is signed off with a compliance certificate, filed and ready if you ever need it for insurance or sale.",
    },
  ]

  const steps = [
    {
      n: "01",
      label: "QUOTE",
      title: "Fixed-price quote",
      copy: "Tell us the job, we give you a firm number before anyone picks up a screwdriver.",
    },
    {
      n: "02",
      label: "SCHEDULE",
      title: "Book a time that works",
      copy: "Morning, afternoon or emergency — we work around your day, not the other way round.",
    },
    {
      n: "03",
      label: "CERTIFY",
      title: "Certified on completion",
      copy: "Every job signed off with a compliance certificate, filed and ready if you ever need it.",
    },
  ]

  const galleryPhotos = [
    {
      photo:
        "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&q=80&w=1600",
      alt: "Electrician's hands wiring a residential switchboard with safety switches",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=1600",
      alt: "Electric vehicle charging cable connected to a home wall charger",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1565608087341-404b25492fee?auto=format&fit=crop&q=80&w=1600",
      alt: "Close-up of an open switchboard showing labelled circuit breakers",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=1600",
      alt: "Electrician running new wiring through a wall cavity during a rewire",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1521207418485-99c705420785?auto=format&fit=crop&q=80&w=1600",
      alt: "Row of modern LED downlights installed in a ceiling",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1600",
      alt: "Electrician on site testing a circuit with a multimeter",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&q=80&w=1600",
      alt: "Neatly bundled and labelled cabling inside a switchboard cabinet",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600",
      alt: "Electrician's tool belt and equipment laid out on a job site",
    },
  ]

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false)
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % galleryPhotos.length)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, galleryPhotos.length])

  const LiveDot = () => (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#A3E635]" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A3E635]" />
    </span>
  )

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="flex items-center gap-2 font-tech text-xs tracking-[0.2em] uppercase text-[#A3E635] mb-6">
      <LiveDot />
      {children}
    </p>
  )

  return (
    <div className="bg-[#111113] font-sans pb-20 md:pb-0">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* 1. Nav */}
      <nav className="bg-[#111113] border-b border-[#2A2A30] px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-20">
        <span className="flex items-center gap-2 font-heading text-lg tracking-[-0.02em] text-[#FAFAF9]">
          <LiveDot />
          {businessName}
        </span>
        <a
          href={telHref}
          className="inline-flex items-center gap-2 border border-[#A3E635] text-[#A3E635] font-tech text-xs tracking-[0.15em] uppercase px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-[#A3E635] hover:text-[#111113] hover:scale-105"
        >
          <Phone className="size-4" />
          Call — {phone}
        </a>
      </nav>

      {/* 2. Hero — split editorial */}
      <section className="relative bg-[#111113] px-6 md:px-10 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-center max-w-6xl mx-auto">
          <div className="md:col-span-7">
            <Eyebrow>Licensed electrician — {suburb}</Eyebrow>
            <h1 className="font-heading font-medium text-[clamp(3rem,8vw,7rem)] tracking-[-0.04em] leading-[0.95] text-[#FAFAF9]">
              Power, done
              <br />
              properly.
            </h1>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-[#A1A1AA] max-w-md">
              Switchboards, wiring, EV chargers — sorted, certified, safe.
              Northern Beaches licensed electrical, from single power points to
              full home rewires.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={telHref}
                className="inline-flex items-center gap-2 bg-[#A3E635] text-[#111113] font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#A3E635]/20"
              >
                <Phone className="size-4" />
                Call {phone}
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 border border-[#2A2A30] text-[#FAFAF9] font-tech text-xs tracking-[0.15em] uppercase px-7 py-3.5 rounded-full transition-all duration-300 hover:border-[#A3E635] hover:text-[#A3E635]"
              >
                Book an inspection
              </a>
            </div>

            <div className="mt-10 flex items-center gap-2 text-[#FAFAF9]">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-[#A3E635] text-[#A3E635]" />
                ))}
              </div>
              <span className="text-sm text-[#A1A1AA]">
                {rating}★ from {userRatingCount} reviews
              </span>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="absolute -top-3 -left-3 w-full h-full border border-[#A3E635] rounded-sm" />
            <img
              src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&q=80&w=1600"
              alt="Electrician's hands wiring a residential switchboard with safety switches"
              className="relative w-full h-[420px] md:h-[520px] object-cover rounded-sm"
            />
          </div>
        </div>
      </section>

      {/* 3. Services — bento grid breaker panel */}
      <section className="bg-[#111113] px-6 md:px-10 py-24 md:py-32 border-t border-[#2A2A30]">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>The breaker panel — full service range</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#FAFAF9] mb-16 max-w-2xl">
            Every circuit, labelled and covered.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.index}
                  className={`relative bg-[#1B1B1F] border border-[#2A2A30] rounded-sm p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-[#A3E635]/60 ${service.span}`}
                >
                  {service.photo && (
                    <img
                      src={service.photo}
                      alt={service.alt}
                      className="absolute inset-0 w-full h-full object-cover opacity-25"
                    />
                  )}
                  <div className="relative z-10">
                    <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#A3E635] mb-6">
                      {service.index} — {service.label}
                    </p>
                    <Icon className="size-7 text-[#FAFAF9] mb-4" />
                    <h3 className="font-heading text-xl md:text-2xl tracking-[-0.02em] text-[#FAFAF9]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm md:text-base leading-relaxed text-[#A1A1AA] max-w-sm">
                      {service.copy}
                    </p>
                  </div>
                  {service.emergency && (
                    <div className="relative z-10 mt-6 flex items-center gap-4">
                      <span className="font-heading font-medium text-[clamp(2.5rem,5vw,3.5rem)] leading-none tracking-[-0.03em] text-[#A3E635]">
                        24/7
                      </span>
                      <span className="text-sm text-[#A1A1AA] max-w-[10rem]">
                        Genuine after-hours response, not a call centre.
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Trust band — inverted light */}
      <section className="bg-[#FAFAF9] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <p className="flex items-center gap-2 font-tech text-xs tracking-[0.2em] uppercase text-[#65A30D] mb-6">
            <LiveDot />
            Credibility check
          </p>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#111113] mb-16 max-w-2xl">
            Fully licensed &amp; insured, every job.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            <div>
              <p className="font-heading font-medium text-4xl md:text-5xl tracking-[-0.03em] text-[#111113]">
                {rating}<span className="text-[0.35em] align-middle ml-1">★</span>
              </p>
              <div className="mt-3 w-12 h-1 bg-[#A3E635]" />
              <p className="mt-4 text-base text-[#52525B]">
                Average rating from {userRatingCount} Google reviews.
              </p>
            </div>
            <div>
              <p className="font-heading font-medium text-4xl md:text-5xl tracking-[-0.03em] text-[#111113]">
                Licensed
              </p>
              <div className="mt-3 w-12 h-1 bg-[#A3E635]" />
              <p className="mt-4 text-base text-[#52525B]">
                Fully licensed &amp; insured electrical contractor.
              </p>
            </div>
            <div>
              <p className="font-heading font-medium text-4xl md:text-5xl tracking-[-0.03em] text-[#111113]">
                Upfront
              </p>
              <div className="mt-3 w-12 h-1 bg-[#A3E635]" />
              <p className="mt-4 text-base text-[#52525B]">
                Fixed quotes and a workmanship guarantee on every job.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Process — three steps, continues light section */}
        <div className="max-w-5xl mx-auto mt-24 md:mt-32">
          <p className="flex items-center gap-2 font-tech text-xs tracking-[0.2em] uppercase text-[#65A30D] mb-6">
            <LiveDot />
            How it works
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step) => (
              <div key={step.n} className="border-t-2 border-[#111113] pt-6">
                <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#52525B] mb-3">
                  {step.n} — {step.label}
                </p>
                <h3 className="font-heading text-xl md:text-2xl tracking-[-0.02em] text-[#111113]">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#52525B]">
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5.5 Gallery — the job book, in photos */}
      <section className="bg-[#111113] px-6 md:px-10 py-24 md:py-32 border-t border-[#2A2A30]">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>On the tools</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#FAFAF9] mb-16 max-w-2xl">
            Every job, wired live.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {galleryPhotos.map((item, i) => (
              <button
                key={item.photo}
                type="button"
                onClick={() => {
                  setLightboxIndex(i)
                  setLightboxOpen(true)
                }}
                className="group relative block overflow-hidden rounded-sm cursor-pointer border border-[#2A2A30] transition-all duration-300 hover:border-[#A3E635]/60"
              >
                <img
                  src={item.photo}
                  alt={item.alt}
                  className="w-full h-40 md:h-56 object-cover transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full mx-4 max-h-[85vh]"
        >
          <img
            src={galleryPhotos[lightboxIndex].photo}
            alt={galleryPhotos[lightboxIndex].alt}
            className="w-full h-full max-h-[85vh] object-contain"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-0 right-0 -translate-y-full md:translate-y-0 md:-top-2 md:-right-2 bg-[#A3E635] text-[#111113] rounded-full flex items-center justify-center size-10 transition-all duration-300 hover:scale-105"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#A3E635] text-[#111113] rounded-full flex items-center justify-center size-10 transition-all duration-300 hover:scale-105"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryPhotos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#A3E635] text-[#111113] rounded-full flex items-center justify-center size-10 transition-all duration-300 hover:scale-105"
            aria-label="Next photo"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#111113] text-[#A3E635] text-sm font-semibold px-3 py-1 rounded-full border border-[#A3E635]/40">
            {lightboxIndex + 1} / {galleryPhotos.length}
          </span>
        </div>
      </Dialog>

      {/* 6. Reviews — individual cards */}
      <section className="bg-[#111113] px-6 md:px-10 py-24 md:py-32 border-t border-[#2A2A30]">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>From the job book</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#FAFAF9] mb-16 max-w-2xl">
            What the Beaches are saying.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.name}
                className="bg-[#1B1B1F] border border-[#2A2A30] rounded-sm p-8 flex flex-col gap-4 transition-all duration-300 hover:border-[#A3E635]/60"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-[#A3E635] text-[#A3E635]" />
                  ))}
                </div>
                <p className="text-sm md:text-base leading-relaxed text-[#A1A1AA]">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p className="mt-auto font-tech text-xs tracking-[0.2em] uppercase text-[#FAFAF9]">
                  — {review.name}, Google review
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6.5 FAQ — common questions */}
      <section className="bg-[#111113] px-6 md:px-10 py-24 md:py-32 border-t border-[#2A2A30]">
        <div className="max-w-3xl mx-auto">
          <Eyebrow>Common questions</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#FAFAF9] mb-16 max-w-2xl">
            Before you call.
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-[#2A2A30]"
              >
                <AccordionTrigger className="text-left font-heading text-lg md:text-xl tracking-[-0.01em] text-[#FAFAF9] py-6 hover:text-[#A3E635]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base leading-relaxed text-[#A1A1AA] pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 7. Contact / CTA */}
      <section id="contact" className="bg-[#111113] px-6 md:px-10 py-24 md:py-32 border-t border-[#2A2A30]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 max-w-5xl mx-auto">
          <div className="md:col-span-6">
            <Eyebrow>Get in touch</Eyebrow>
            <h2 className="font-heading font-medium text-[clamp(2.5rem,6vw,4.5rem)] tracking-[-0.04em] leading-[0.95] text-[#FAFAF9]">
              Get it wired right.
            </h2>
            <a
              href={telHref}
              className="mt-8 inline-block font-heading font-medium text-[clamp(2rem,5vw,3.5rem)] tracking-[-0.03em] leading-none text-[#A3E635] transition-all duration-300 hover:opacity-80"
            >
              {phone}
            </a>
            <p className="mt-6 flex items-center gap-2 text-base text-[#A1A1AA]">
              <ShieldCheck className="size-4 text-[#A3E635]" />
              {formattedAddress}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-[#A1A1AA] transition-all duration-300 hover:text-[#A3E635]"
            >
              <MapPin className="size-4 text-[#A3E635]" />
              View on Google Maps
            </a>

            <div className="mt-10 border-t border-[#2A2A30] pt-8">
              <p className="flex items-center gap-2 font-tech text-xs tracking-[0.2em] uppercase text-[#A3E635] mb-4">
                <Clock className="size-4" />
                Opening hours
              </p>
              <div className="flex flex-col gap-2">
                {hours.map((h) => (
                  <div
                    key={h.day}
                    className="flex items-center justify-between gap-4 font-tech text-xs tracking-[0.1em] uppercase text-[#A1A1AA] border-b border-[#2A2A30] pb-2"
                  >
                    <span className="text-[#FAFAF9]">{h.day}</span>
                    <span>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form className="md:col-span-6 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="font-tech text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                className="mt-2 bg-transparent border-[#2A2A30] text-[#FAFAF9] placeholder:text-[#A1A1AA]/60"
              />
            </div>
            <div>
              <label htmlFor="phone" className="font-tech text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">
                Phone
              </label>
              <Input
                id="phone"
                placeholder="Your best contact number"
                className="mt-2 bg-transparent border-[#2A2A30] text-[#FAFAF9] placeholder:text-[#A1A1AA]/60"
              />
            </div>
            <div>
              <label htmlFor="job" className="font-tech text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">
                What's the job?
              </label>
              <Textarea
                id="job"
                placeholder="Switchboard upgrade, EV charger, safety inspection..."
                className="mt-2 bg-transparent border-[#2A2A30] text-[#FAFAF9] placeholder:text-[#A1A1AA]/60"
              />
            </div>
            <Button className="mt-2 bg-[#A3E635] text-[#111113] hover:bg-[#A3E635]/90 font-semibold transition-all duration-300 w-fit px-8">
              Request a quote
            </Button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#111113] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#2A2A30]">
        <span className="flex items-center gap-2 font-heading text-sm tracking-[-0.02em] text-[#FAFAF9]">
          <LiveDot />
          {businessName}
        </span>
        <a href={telHref} className="text-sm text-[#A1A1AA] hover:text-[#A3E635] transition-all duration-300">
          {phone}
        </a>
      </footer>

      {/* Sticky mobile call bar */}
      <a
        href={telHref}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-center gap-2 bg-[#A3E635] text-[#111113] font-semibold text-base py-4 transition-all duration-300"
      >
        <Phone className="size-5" />
        Call now — {phone}
      </a>
    </div>
  )
}
