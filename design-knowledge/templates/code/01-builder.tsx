import { useState, useEffect } from "react"
import { Phone, MapPin, ArrowUpRight, Star, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function GeneratedPage() {
  const businessName = "Marrick & Vane Building Co."
  const phone = "(02) 9557 4128"
  const suburb = "Marrickville"
  const formattedAddress = "14 Fitzroy Street, Marrickville NSW 2204"
  const rating = "4.9"
  const reviews = "120+ reviews"

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const portfolio = [
    {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
      alt: "Renovated kitchen with timber joinery and stone benchtop in a Marrickville terrace",
      caption: "Kitchen renovation",
      tall: true,
    },
    {
      src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200",
      alt: "Rear extension with steel-framed glazing opening onto a courtyard",
      caption: "Rear extension",
      tall: false,
    },
    {
      src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200",
      alt: "New double-storey build under construction with exposed timber frame",
      caption: "New build",
      tall: false,
    },
    {
      src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200",
      alt: "Freshly poured concrete slab and formwork on a new build foundation",
      caption: "Foundations",
      tall: false,
    },
    {
      src: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=1200",
      alt: "Finished hardwood deck and pergola overlooking a landscaped backyard",
      caption: "Deck & outdoor",
      tall: false,
    },
    {
      src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=1200",
      alt: "Bathroom renovation with matte black fixtures and floor-to-ceiling tiling",
      caption: "Bathroom renovation",
      tall: false,
    },
    {
      src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200",
      alt: "Open-plan living area addition with raked ceiling and skylights",
      caption: "Living area addition",
      tall: false,
    },
  ]

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + portfolio.length) % portfolio.length)
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % portfolio.length)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, portfolio.length])

  const services = [
    { title: "Renovations", copy: "Whole-house or single-room, done properly the first time." },
    { title: "Extensions", copy: "Second storeys, rear additions, more space where you need it." },
    { title: "New builds", copy: "Knock-down rebuilds and ground-up homes across the Inner West." },
    { title: "Decks & outdoor", copy: "Hardwood decks, pergolas and outdoor living that lasts." },
    { title: "Project management", copy: "One point of contact from council approval to handover." },
  ]

  const reviewCards = [
    {
      name: "Renee",
      quote: "Pulled our terrace apart and rebuilt it better than we imagined, on the timeline they promised.",
    },
    {
      name: "David",
      quote: "Straight answers, tidy site, and the invoice matched the quote. That's rarer than it should be.",
    },
    {
      name: "Priya",
      quote: "Council approvals, scheduling, trades — one phone call sorted it. Extension finished on time.",
    },
  ]

  const hours = [
    { day: "Mon–Fri", time: "7:00am – 4:00pm" },
    { day: "Sat", time: "By appointment" },
    { day: "Sun", time: "Closed" },
  ]

  const faqs = [
    {
      q: "Do you handle council approvals?",
      a: "Yes. We manage development applications and certifications with council on your behalf, so you're not chasing paperwork.",
    },
    {
      q: "How long does a typical renovation take?",
      a: "A single-room renovation usually runs 4–8 weeks. Full house renovations and extensions are typically 3–6 months, depending on scope.",
    },
    {
      q: "Are you licensed and insured?",
      a: "Yes, we're fully licensed builders carrying home warranty and public liability insurance on every job.",
    },
    {
      q: "Do you provide fixed-price quotes?",
      a: "Yes. Once scope is locked in you get a fixed-price quote, not a rough estimate that grows once work starts.",
    },
    {
      q: "What areas do you service?",
      a: "We work across Sydney's Inner West, including Marrickville, Newtown, Dulwich Hill, Petersham and surrounding suburbs.",
    },
  ]

  return (
    <div className="bg-[#FAF9F7] font-sans pb-20 md:pb-0">
      {/* 1. Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-[#171412]/10">
        <span className="font-heading text-lg tracking-[-0.02em] text-[#171412]">
          {businessName}
        </span>
        <a
          href="tel:0295574128"
          className="text-sm text-[#57534E] hover:text-[#C2410C] transition-all duration-300 flex items-center gap-2"
        >
          <Phone className="size-4" />
          {phone}
        </a>
      </nav>

      {/* 2. Hero — oversized type */}
      <section className="relative px-6 md:px-10 pt-16 md:pt-24 pb-0 overflow-hidden">
        <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#C2410C] mb-6">
          {suburb}, Sydney — Est. builders of the Inner West
        </p>
        <h1 className="font-heading font-medium text-[clamp(3.5rem,9vw,8rem)] leading-[0.9] tracking-[-0.04em] text-[#171412] max-w-5xl">
          Quality builds.
          <br />
          No shortcuts.
        </h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-[#57534E]">
          {businessName} has been renovating, extending and rebuilding homes across the Inner West for owners who care how it's done.
        </p>
        <div className="relative mt-16 -mx-6 md:-mx-10">
          <img
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1600"
            alt="Timber framing on a residential extension mid-build in Marrickville"
            className="w-full h-[38vh] md:h-[46vh] object-cover"
          />
        </div>
      </section>

      {/* 3. Stat band (dark) */}
      <section className="bg-[#171412] px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 max-w-5xl mx-auto text-center md:text-left">
          <div>
            <p className="font-heading font-medium text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[-0.03em] text-[#FAF9F7]">
              {rating}
              <span className="text-[0.35em] align-middle ml-1">★</span>
            </p>
            <p className="mt-3 text-sm text-[#A8A29E]">Average client rating</p>
          </div>
          <div>
            <p className="font-heading font-medium text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[-0.03em] text-[#FAF9F7]">
              {reviews}
            </p>
            <p className="mt-3 text-sm text-[#A8A29E]">From homeowners across Sydney's Inner West</p>
          </div>
          <div>
            <p className="font-heading font-medium text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[-0.03em] text-[#FAF9F7]">
              Licensed
              <span className="text-[#C2410C]">.</span>
            </p>
            <p className="mt-3 text-sm text-[#A8A29E]">Fully licensed &amp; insured. Free quotes.</p>
          </div>
        </div>
      </section>

      {/* 4. Portfolio — the proof */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#171412] mb-20 max-w-2xl">
          Recent work, not a portfolio of promises.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7 md:-mt-8">
            <button
              type="button"
              onClick={() => {
                setLightboxIndex(0)
                setLightboxOpen(true)
              }}
              className="relative block w-full text-left cursor-pointer group"
            >
              <img
                src={portfolio[0].src}
                alt={portfolio[0].alt}
                className="w-full h-[420px] md:h-[620px] object-cover transition-all duration-300 group-hover:opacity-90 group-hover:scale-[1.01]"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#57534E]">
                <span className="text-[#C2410C]">01</span> — {portfolio[0].caption.toUpperCase()}
              </p>
            </button>
          </div>

          <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
            {portfolio.slice(1, 3).map((item, i) => (
              <button
                type="button"
                key={item.caption}
                onClick={() => {
                  setLightboxIndex(i + 1)
                  setLightboxOpen(true)
                }}
                className="block w-full text-left cursor-pointer group"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-[260px] md:h-[290px] object-cover transition-all duration-300 group-hover:opacity-90 group-hover:scale-[1.01]"
                />
                <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#57534E]">
                  <span className="text-[#C2410C]">{String(i + 2).padStart(2, "0")}</span> — {item.caption.toUpperCase()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Gallery grid — remaining photos */}
        <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {portfolio.slice(3).map((item, i) => (
            <button
              type="button"
              key={item.caption}
              onClick={() => {
                setLightboxIndex(i + 3)
                setLightboxOpen(true)
              }}
              className="block w-full text-left cursor-pointer group"
            >
              <div className="overflow-hidden">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-[160px] md:h-[220px] object-cover transition-all duration-300 group-hover:opacity-90 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 font-tech text-xs tracking-[0.2em] uppercase text-[#57534E]">
                <span className="text-[#C2410C]">{String(i + 4).padStart(2, "0")}</span> — {item.caption.toUpperCase()}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full mx-4 max-h-[85vh]"
        >
          <img
            src={portfolio[lightboxIndex].src}
            alt={portfolio[lightboxIndex].alt}
            className="w-full h-[85vh] object-contain"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
            className="absolute top-0 right-0 md:-top-4 md:-right-4 flex items-center justify-center size-10 rounded-full bg-[#171412] text-[#FAF9F7] hover:bg-[#C2410C] transition-all duration-300 cursor-pointer"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setLightboxIndex((i) => (i - 1 + portfolio.length) % portfolio.length)
            }
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-10 rounded-full bg-[#171412]/70 text-[#FAF9F7] hover:bg-[#C2410C] transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex((i) => (i + 1) % portfolio.length)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-10 rounded-full bg-[#171412]/70 text-[#FAF9F7] hover:bg-[#C2410C] transition-all duration-300 cursor-pointer"
          >
            <ChevronRight className="size-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-tech text-xs tracking-[0.2em] uppercase text-[#FAF9F7] bg-[#171412]/70 px-3 py-1.5">
            <span className="text-[#C2410C]">{lightboxIndex + 1}</span> / {portfolio.length}
          </p>
        </div>
      </Dialog>

      {/* 5. Services — editorial list */}
      <section className="px-6 md:px-10 py-24 md:py-32 border-t border-[#171412]/10">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#171412] mb-16 max-w-2xl">
          What we do.
        </h2>
        <div>
          {services.map((service, i) => (
            <div
              key={service.title}
              className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-baseline py-8 border-t border-[#171412]/10 last:border-b transition-all duration-300 hover:translate-x-2 hover:bg-white"
            >
              <span className="md:col-span-1 font-tech text-sm text-[#C2410C]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="md:col-span-4 font-heading text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#171412]">
                {service.title}
              </span>
              <span className="md:col-span-6 text-base md:text-lg leading-relaxed text-[#57534E]">
                {service.copy}
              </span>
              <ArrowUpRight className="hidden md:block md:col-span-1 size-6 text-[#171412]/30 transition-all duration-300 group-hover:text-[#C2410C] group-hover:translate-x-1 group-hover:-translate-y-1 justify-self-end" />
            </div>
          ))}
        </div>
      </section>

      {/* 6. Reviews — social proof cards */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-white">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#171412] mb-16 max-w-2xl">
          What clients say.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-5xl">
          {reviewCards.map((review) => (
            <div key={review.name} className="flex flex-col">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#C2410C] text-[#C2410C]" />
                ))}
              </div>
              <p className="mt-4 text-base leading-relaxed text-[#171412]">
                &ldquo;{review.quote}&rdquo;
              </p>
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#57534E]">
                {review.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — common questions */}
      <section className="px-6 md:px-10 py-24 md:py-32 border-t border-[#171412]/10">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#171412] mb-16 max-w-2xl">
          Common questions.
        </h2>
        <Accordion className="max-w-3xl">
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="font-heading text-lg md:text-xl text-[#171412]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-[#57534E]">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 7. Contact / CTA (dark) */}
      <section className="bg-[#171412] px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          <div className="md:col-span-7">
            <h2 className="font-heading font-medium text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.04em] text-[#FAF9F7]">
              Let's build.
            </h2>
            <a
              href="tel:0295574128"
              className="mt-8 inline-block font-heading text-[clamp(1.5rem,3vw,2.5rem)] tracking-[-0.02em] text-[#FAF9F7] border-b-2 border-[#C2410C] transition-all duration-300 hover:text-[#C2410C]"
            >
              {phone}
            </a>
            <p className="mt-6 flex items-center gap-2 text-sm text-[#A8A29E]">
              <MapPin className="size-4" />
              {formattedAddress}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-[#A8A29E] hover:text-[#C2410C] transition-all duration-300"
            >
              <MapPin className="size-4" />
              View on Google Maps
            </a>

            <div className="mt-10 max-w-xs">
              <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#C2410C] mb-3">
                Opening hours
              </p>
              <div className="flex flex-col gap-2">
                {hours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between border-t border-[#A8A29E]/20 py-2">
                    <span className="font-tech text-xs tracking-wide uppercase text-[#FAF9F7]">
                      {h.day}
                    </span>
                    <span className="text-sm text-[#A8A29E]">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form className="md:col-span-5 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="text-xs uppercase tracking-[0.1em] text-[#A8A29E]">
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                className="mt-2 bg-transparent border-[#A8A29E]/40 text-[#FAF9F7] placeholder:text-[#A8A29E]/60"
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-xs uppercase tracking-[0.1em] text-[#A8A29E]">
                Phone
              </label>
              <Input
                id="phone"
                placeholder="Your best contact number"
                className="mt-2 bg-transparent border-[#A8A29E]/40 text-[#FAF9F7] placeholder:text-[#A8A29E]/60"
              />
            </div>
            <div>
              <label htmlFor="project" className="text-xs uppercase tracking-[0.1em] text-[#A8A29E]">
                Tell us about the project
              </label>
              <Textarea
                id="project"
                placeholder="Renovation, extension, new build..."
                className="mt-2 bg-transparent border-[#A8A29E]/40 text-[#FAF9F7] placeholder:text-[#A8A29E]/60"
              />
            </div>
            <Button className="mt-2 bg-[#C2410C] text-[#FAF9F7] hover:bg-[#C2410C]/90 transition-all duration-300 w-fit px-8">
              Request a quote
            </Button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="px-6 md:px-10 py-8 flex items-center justify-between border-t border-[#171412]/10">
        <span className="font-heading text-sm tracking-[-0.02em] text-[#171412]">
          {businessName}
        </span>
        <span className="text-sm text-[#57534E]">{suburb}, NSW</span>
      </footer>

      {/* Sticky mobile call bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#C2410C] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(23,20,18,0.25)]">
        <a
          href="tel:0295574128"
          className="flex items-center justify-center gap-2 py-4 text-base font-medium tracking-[-0.01em] text-[#FAF9F7]"
        >
          <Phone className="size-5" />
          Call now — {phone}
        </a>
      </div>
    </div>
  )
}
