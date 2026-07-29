import { useEffect, useState } from "react"
import { MapPin, Phone, Star, Quote, Instagram, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function GeneratedPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const businessName = "Sable & Rye"
  const suburb = "Paddington"
  const phone = "(02) 9331 7420"
  const telHref = "tel:0293317420"
  const formattedAddress = "14 Underwood Street, Paddington NSW 2021"
  const directionsHref =
    "https://www.google.com/maps/search/?api=1&query=14+Underwood+Street+Paddington+NSW+2021"
  const rating = "4.9"
  const userRatingCount = "386"

  const heroPhoto =
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600"

  const services = [
    {
      group: "CUT & STYLE",
      items: [
        { name: "Women's cut & style", price: "95" },
        { name: "Men's cut", price: "65" },
        { name: "Blow-dry bar", price: "55" },
      ],
    },
    {
      group: "COLOUR",
      items: [
        { name: "Balayage", price: "280" },
        { name: "Full colour", price: "180" },
        { name: "Root touch-up", price: "120" },
      ],
    },
    {
      group: "TREATMENTS",
      items: [
        { name: "Keratin treatment", price: "220" },
        { name: "Bridal hair", price: "250" },
      ],
    },
  ]

  const galleryPhotos = [
    {
      src: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1400",
      caption: "LIVED-IN BLONDE",
    },
    {
      src: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=900",
      caption: "PRESS ROOM COLOUR",
    },
    {
      src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=900",
      caption: "THE CHAIR, MID-SESSION",
    },
    {
      src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=900",
      caption: "GLASS-FINISH BOB",
    },
    {
      src: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=900",
      caption: "COPPER BALAYAGE",
    },
    {
      src: "https://images.unsplash.com/photo-1554519515-242161756769?auto=format&fit=crop&q=80&w=900",
      caption: "THE FINISHING TOUCH",
    },
  ]

  const storyPhoto =
    "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&q=80&w=1200"

  const allPhotos = [heroPhoto, ...galleryPhotos.map((p) => p.src), storyPhoto]

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i + 1) % allPhotos.length)
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, allPhotos.length])

  const review = {
    text: "I've had my colour done all over the world and no one reads my hair like Sable & Rye. They talk you out of the bad ideas and somehow make the good ones better.",
    name: "Freya",
  }

  const shortReviews = [
    {
      text: "Booked in for a root touch-up and left with a whole new appreciation for what a good colourist actually does.",
      name: "Mia",
    },
    {
      text: "Honest about what would and wouldn't work on my hair. Rare, and worth the drive across town.",
      name: "Tom",
    },
  ]

  const openingHours = [
    { day: "Tue – Fri", hours: "9:00 am – 6:00 pm" },
    { day: "Saturday", hours: "8:00 am – 4:00 pm" },
    { day: "Sun – Mon", hours: "Closed" },
  ]

  const faqs = [
    {
      q: "Do I need to book in advance?",
      a: "For colour work, yes — we'd suggest a week or two out, especially for balayage or full colour. Cuts and blow-dries can often be squeezed in with a few days' notice.",
    },
    {
      q: "Do you offer consultations for colour?",
      a: "Always. Every colour appointment starts with a proper conversation about what your hair can realistically do, not just what you've seen in a photo.",
    },
    {
      q: "What products do you use?",
      a: "We work with a small range of professional colour and care lines chosen for condition, not just shine on the day. Happy to talk through what's in your formula.",
    },
    {
      q: "Can I bring inspiration photos?",
      a: "Please do. Photos help us talk about tone, dimension and maintenance before we touch a single strand — it's the fastest way to get on the same page.",
    },
    {
      q: "Do you cater to all hair types?",
      a: "Yes — our stylists are trained across a full range of textures and lengths, from fine and straight through to coily and coarse.",
    },
  ]

  return (
    <div className="bg-[#FAF6F3] font-sans">
      {/* 1. Nav */}
      <nav className="px-6 md:px-10 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-elegant font-medium text-xl tracking-[-0.01em] text-[#211C1A]">
          {businessName}
        </span>
        <div className="flex items-center gap-6">
          <a
            href={telHref}
            className="hidden sm:inline text-sm text-[#6D625C] hover:text-[#211C1A] transition-all duration-300"
          >
            {phone}
          </a>
          <a
            href="#booking"
            className="inline-flex items-center gap-2 bg-[#B07D62] text-[#FAF6F3] text-sm font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-[#96694F] hover:scale-105"
          >
            Book now
          </a>
        </div>
      </nav>

      {/* 2. Hero — split editorial */}
      <section className="px-6 md:px-10 pt-6 pb-0 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-6 md:pt-16 pb-16 md:pb-24">
            <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#B07D62]">
              HAIR — {suburb.toUpperCase()}
            </p>
            <h1 className="mt-6 font-elegant font-medium text-[clamp(3rem,7.5vw,6.5rem)] tracking-[-0.02em] leading-[0.98] text-[#211C1A]">
              Colour people
              <br />
              stop you in the{" "}
              <span className="italic">street</span> about.
            </h1>
            <p className="mt-6 text-lg text-[#6D625C] max-w-md">
              A Paddington chair for women and men who want their colourist to
              tell them the truth about a fringe before they cut one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#booking"
                className="inline-flex items-center gap-2 bg-[#B07D62] text-[#FAF6F3] text-sm font-medium px-8 py-4 rounded-full transition-all duration-300 hover:bg-[#96694F] hover:scale-105"
              >
                Book your chair
              </a>
              <div className="inline-flex items-center gap-2 bg-white rounded-full pl-3 pr-4 py-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-[#B07D62] text-[#B07D62]" />
                  ))}
                </div>
                <span className="text-sm text-[#6D625C]">
                  {rating} · {userRatingCount} reviews
                </span>
              </div>
            </div>
          </div>
          <div className="md:col-span-6 relative">
            <div className="md:-mt-20 -mt-6">
              <img
                src={heroPhoto}
                alt={`Editorial portrait of a client's finished colour and cut at ${businessName} in ${suburb}`}
                onClick={() => openLightbox(0)}
                className="w-full aspect-[3/4] object-cover rounded-b-3xl md:rounded-3xl shadow-xl cursor-pointer transition-all duration-300 hover:opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Services & pricing — the menu of looks */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#211C1A] mb-16">
            The menu of looks.
          </h2>
          <div className="flex flex-col gap-14">
            {services.map((group) => (
              <div key={group.group}>
                <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#B07D62] mb-6">
                  {group.group}
                </p>
                <div className="flex flex-col gap-5">
                  {group.items.map((item) => (
                    <div key={item.name} className="flex items-baseline gap-3">
                      <span className="font-elegant text-2xl text-[#211C1A] whitespace-nowrap">
                        {item.name}
                      </span>
                      <span className="flex-1 border-b border-dotted border-[#D9CFC8] translate-y-[-4px]" />
                      <span className="text-base text-[#B07D62] whitespace-nowrap">
                        from ${item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Gallery — the work (espresso band) */}
      <section className="px-6 md:px-10 py-24 bg-[#211C1A]">
        <div className="max-w-6xl mx-auto">
          <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#A39A94] mb-10">
            THE WORK
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <img
                src={galleryPhotos[0].src}
                alt={`${galleryPhotos[0].caption.toLowerCase()} finished by a stylist at ${businessName}`}
                onClick={() => openLightbox(1)}
                className="w-full h-[520px] object-cover rounded-2xl cursor-pointer transition-all duration-300 hover:opacity-90 hover:scale-[1.01]"
              />
              <span className="font-tech text-xs tracking-[0.15em] text-[#A39A94]">
                01 — {galleryPhotos[0].caption}
              </span>
            </div>
            <div className="grid grid-cols-2 grid-rows-3 gap-6">
              {galleryPhotos.slice(1).map((photo, i) => (
                <div key={photo.caption} className="flex flex-col gap-3">
                  <img
                    src={photo.src}
                    alt={`${photo.caption.toLowerCase()} at ${businessName}`}
                    onClick={() => openLightbox(i + 2)}
                    className="w-full h-[157px] object-cover rounded-2xl cursor-pointer transition-all duration-300 hover:opacity-90 hover:scale-[1.02]"
                  />
                  <span className="font-tech text-xs tracking-[0.15em] text-[#A39A94]">
                    {String(i + 2).padStart(2, "0")} — {photo.caption}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. The salon — story */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6">
            <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#B07D62] mb-6">
              THE SALON
            </p>
            <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#211C1A]">
              A quiet Paddington
              <br />
              terrace with good light.
            </h2>
            <p className="mt-6 text-lg text-[#6D625C] max-w-md">
              {businessName} opened on Underwood Street with one idea: hair
              should be considered, not rushed. Every colour is mixed on the
              day, for the person in the chair — not off a chart.
            </p>
            <p className="mt-6 text-base text-[#6D625C]">{formattedAddress}</p>
          </div>
          <div className="md:col-span-6">
            <img
              src={storyPhoto}
              alt={`Interior of the ${businessName} salon space in ${suburb}`}
              onClick={() => openLightbox(allPhotos.length - 1)}
              className="w-full h-[440px] object-cover rounded-3xl rotate-1 shadow-lg cursor-pointer transition-all duration-300 hover:opacity-90"
            />
          </div>
        </div>
      </section>

      {/* 6. Testimonial — oversized quote */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="size-10 text-[#B07D62] mx-auto mb-6" />
          <p className="font-elegant italic font-medium text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.25] text-[#211C1A]">
            {review.text}
          </p>
          <p className="mt-8 text-base text-[#6D625C]">— {review.name}</p>
        </div>

        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {shortReviews.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl p-8">
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#B07D62] text-[#B07D62]" />
                ))}
              </div>
              <p className="text-base text-[#211C1A] leading-relaxed">{r.text}</p>
              <p className="mt-4 text-sm text-[#6D625C]">— {r.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6b. Opening hours */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-[#211C1A]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#A39A94] mb-6">
            OPENING HOURS
          </p>
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#FAF6F3] mb-12">
            When to find us.
          </h2>
          <div className="max-w-md mx-auto text-left">
            {openingHours.map((row) => (
              <div
                key={row.day}
                className="flex items-center justify-between py-4 border-t border-[#3A332F] last:border-b"
              >
                <span className="text-base text-[#FAF6F3]">{row.day}</span>
                <span className="text-base text-[#A39A94]">{row.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6c. FAQ */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#B07D62] mb-6">
            FAQ
          </p>
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#211C1A] mb-12">
            Common questions.
          </h2>
          <div className="max-w-3xl mx-auto text-left">
            <Accordion>
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="font-elegant font-medium text-lg md:text-xl text-[#211C1A]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-[#6D625C]">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 7. Booking CTA */}
      <section id="booking" className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl p-8 md:p-16 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3rem)] tracking-[-0.02em] leading-[1.05] text-[#211C1A]">
              Your chair's ready.
            </h2>
            <p className="mt-4 text-base text-[#6D625C]">
              Tell us what you're after and we'll call you back to lock in a
              time.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={telHref}
                className="inline-flex items-center gap-2 text-base text-[#211C1A] hover:text-[#B07D62] transition-all duration-300"
              >
                <Phone className="size-4 text-[#B07D62]" />
                {phone}
              </a>
              <a
                href={directionsHref}
                className="inline-flex items-center gap-2 text-base text-[#6D625C] hover:text-[#211C1A] transition-all duration-300"
              >
                <MapPin className="size-4 text-[#B07D62]" />
                {formattedAddress}
              </a>
              <span className="inline-flex items-center gap-2 text-base text-[#6D625C]">
                <Instagram className="size-4 text-[#B07D62]" />
                @sableandrye
              </span>
            </div>
          </div>
          <form className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-xs font-tech tracking-[0.15em] uppercase text-[#211C1A]">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className="border border-[#D9CFC8] rounded-xl px-4 py-3 text-base text-[#211C1A] placeholder:text-[#A39A94] focus:outline-none focus:border-[#B07D62] transition-all duration-300"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-xs font-tech tracking-[0.15em] uppercase text-[#211C1A]">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="04XX XXX XXX"
                className="border border-[#D9CFC8] rounded-xl px-4 py-3 text-base text-[#211C1A] placeholder:text-[#A39A94] focus:outline-none focus:border-[#B07D62] transition-all duration-300"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="service" className="text-xs font-tech tracking-[0.15em] uppercase text-[#211C1A]">
                Service
              </label>
              <select
                id="service"
                className="border border-[#D9CFC8] rounded-xl px-4 py-3 text-base text-[#211C1A] focus:outline-none focus:border-[#B07D62] transition-all duration-300"
              >
                <option>Women's cut & style</option>
                <option>Balayage</option>
                <option>Full colour</option>
                <option>Keratin treatment</option>
                <option>Blow-dry bar</option>
                <option>Bridal hair</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="day" className="text-xs font-tech tracking-[0.15em] uppercase text-[#211C1A]">
                Preferred day
              </label>
              <input
                id="day"
                type="text"
                placeholder="e.g. Thursday afternoon"
                className="border border-[#D9CFC8] rounded-xl px-4 py-3 text-base text-[#211C1A] placeholder:text-[#A39A94] focus:outline-none focus:border-[#B07D62] transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 bg-[#B07D62] text-[#FAF6F3] text-sm font-medium px-8 py-4 rounded-full transition-all duration-300 hover:bg-[#96694F] hover:scale-[1.02]"
            >
              Request booking
            </button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="px-6 md:px-10 pt-16 pb-8 bg-[#211C1A] border-t border-[#3A332F]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          <div>
            <span className="font-elegant font-medium text-xl text-[#FAF6F3]">{businessName}</span>
            <p className="mt-3 text-sm text-[#A39A94] max-w-xs">
              Considered colour and cutting, one chair at a time.
            </p>
          </div>
          <div>
            <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#A39A94] mb-4">
              EXPLORE
            </p>
            <div className="flex flex-col gap-3">
              <a href="#booking" className="text-sm text-[#D9CFC8] hover:text-[#FAF6F3] transition-all duration-300 w-fit">
                The menu of looks
              </a>
              <a href="#booking" className="text-sm text-[#D9CFC8] hover:text-[#FAF6F3] transition-all duration-300 w-fit">
                Book a chair
              </a>
              <a href="#booking" className="text-sm text-[#D9CFC8] hover:text-[#FAF6F3] transition-all duration-300 w-fit">
                Contact
              </a>
            </div>
          </div>
          <div>
            <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#A39A94] mb-4">
              CONTACT
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={telHref}
                className="inline-flex items-center gap-2 text-sm text-[#D9CFC8] hover:text-[#FAF6F3] transition-all duration-300 w-fit"
              >
                <Phone className="size-4 text-[#B07D62]" />
                {phone}
              </a>
              <span className="inline-flex items-center gap-2 text-sm text-[#D9CFC8]">
                <MapPin className="size-4 text-[#B07D62]" />
                {formattedAddress}
              </span>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#D9CFC8] hover:text-[#FAF6F3] transition-all duration-300 w-fit"
              >
                <MapPin className="size-4 text-[#B07D62]" />
                View on Google Maps
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[#3A332F] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#A39A94]">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-[#A39A94]">
            <Instagram className="size-3.5 text-[#B07D62]" />
            @sableandrye
          </span>
        </div>
      </footer>

      {/* Lightbox — editorial photo carousel */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full mx-4 max-h-[85vh]"
        >
          <img
            src={allPhotos[lightboxIndex]}
            alt={`${businessName} gallery photo ${lightboxIndex + 1}`}
            className="w-full h-full max-h-[85vh] object-contain rounded-2xl"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute -top-4 -right-4 md:top-4 md:right-4 inline-flex items-center justify-center size-10 rounded-full bg-[#211C1A] text-[#FAF6F3] transition-all duration-300 hover:bg-[#B07D62] hover:scale-105"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setLightboxIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length)
            }
            aria-label="Previous photo"
            className="absolute left-2 md:-left-14 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-11 rounded-full bg-[#211C1A]/80 text-[#B07D62] transition-all duration-300 hover:bg-[#211C1A] hover:scale-105"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex((i) => (i + 1) % allPhotos.length)}
            aria-label="Next photo"
            className="absolute right-2 md:-right-14 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-11 rounded-full bg-[#211C1A]/80 text-[#B07D62] transition-all duration-300 hover:bg-[#211C1A] hover:scale-105"
          >
            <ChevronRight className="size-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-tech text-xs tracking-[0.15em] text-[#FAF6F3] bg-[#211C1A]/80 px-4 py-2 rounded-full">
            {lightboxIndex + 1} / {allPhotos.length}
          </span>
        </div>
      </Dialog>
    </div>
  )
}
