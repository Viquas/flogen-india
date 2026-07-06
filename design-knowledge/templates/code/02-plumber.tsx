import { useEffect, useState } from "react"
import { Phone, Star, ShieldCheck, Wrench, Droplet, Flame, Search, ShowerHead, Hammer, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"

export default function GeneratedPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const businessName = "Cronulla Rapid Plumbing"
  const phone = "(02) 9523 7841"
  const telHref = "tel:0295237841"
  const suburb = "Cronulla"
  const formattedAddress = "22 Gerrale Street, Cronulla NSW 2230"
  const rating = "4.9"
  const userRatingCount = "310+"

  const services = [
    {
      title: "Emergency plumbing",
      copy: "Burst pipes, no hot water, overflowing toilets — we're on the road within the hour, day or night.",
      icon: Droplet,
      photo:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1200",
      alt: "Plumber tightening a fitting under a kitchen sink with a torch",
    },
    {
      title: "Blocked drains",
      copy: "Camera inspection and high-pressure jetting clears the worst blockages without tearing up your yard.",
      icon: Search,
      photo:
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=1200",
      alt: "Close-up of PVC drain pipework being inspected by a tradesperson",
    },
    {
      title: "Hot water systems",
      copy: "Repairs and replacements across gas, electric and heat pump systems, fitted the same day where we can.",
      icon: Flame,
      photo:
        "https://images.unsplash.com/photo-1596205244309-15c04a0d0a29?auto=format&fit=crop&q=80&w=1200",
      alt: "Modern hot water system installed on an exterior wall",
    },
    {
      title: "Leak detection",
      copy: "Non-invasive leak tracing finds the source before it costs you a wall, a floor or your water bill.",
      icon: Wrench,
      photo:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200",
      alt: "Plumber inspecting copper pipework for a hidden leak",
    },
    {
      title: "Bathroom renovations",
      copy: "Full re-pipes, waterproofing and fixture installs — plumbing done right before the tiler ever shows up.",
      icon: ShowerHead,
      photo:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=1200",
      alt: "Newly renovated bathroom with modern tapware and tiling",
    },
    {
      title: "Gas fitting",
      copy: "Licensed gas fitting for cooktops, heaters and outdoor connections, compliant and certified.",
      icon: Hammer,
      photo:
        "https://images.unsplash.com/photo-1607472829122-7efe550bfb98?auto=format&fit=crop&q=80&w=1200",
      alt: "Gas line fitting being connected to a residential appliance",
    },
  ]

  const reviews = [
    { text: "Had a burst pipe at 11pm and they picked up straight away. Fixed within the hour.", name: "Sarah" },
    { text: "Upfront price before they touched a thing. No surprises on the invoice.", name: "Michael" },
    { text: "Cleared a drain that two other plumbers couldn't sort. Cameras don't lie.", name: "Priya" },
    { text: "Same-day hot water system replacement on a Sunday. Absolute lifesavers.", name: "Dave" },
    { text: "Tidy, punctual, explained everything in plain English. Booking them again.", name: "Renee" },
    { text: "Best plumber we've used in the Shire, hands down. Fair price, quality work.", name: "Tom" },
  ]

  const suburbs = [
    "Cronulla",
    "Miranda",
    "Caringbah",
    "Sutherland",
    "Sylvania",
    "Woolooware",
    "Kirrawee",
    "Gymea",
  ]

  const galleryPhotos = [
    {
      photo:
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1600",
      alt: "Plumber tightening a fitting under a kitchen sink with a torch",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=1600",
      alt: "Close-up of PVC drain pipework being inspected by a tradesperson",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=1600",
      alt: "Newly renovated bathroom with modern tapware and tiling",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1596205244309-15c04a0d0a29?auto=format&fit=crop&q=80&w=1600",
      alt: "Modern hot water system installed on an exterior wall",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1600",
      alt: "Plumber inspecting copper pipework for a hidden leak",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1607472829122-7efe550bfb98?auto=format&fit=crop&q=80&w=1600",
      alt: "Gas line fitting being connected to a residential appliance",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1600",
      alt: "Tradesperson at work with tools laid out on site",
    },
    {
      photo:
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=1600",
      alt: "Close-up of copper pipework freshly installed in a wall cavity",
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

  const HazardTape = () => (
    <div
      className="h-4 w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, #FACC15 0px, #FACC15 24px, #0C1B2A 24px, #0C1B2A 48px)",
      }}
      role="presentation"
      aria-hidden="true"
    />
  )

  return (
    <div className="bg-white font-sans pb-20 md:pb-0">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 32s linear infinite;
        }
      `}</style>

      {/* 1. Nav */}
      <nav className="bg-[#0C1B2A] px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-20">
        <span className="font-heading text-lg tracking-[-0.02em] text-white">
          {businessName}
        </span>
        <a
          href={telHref}
          className="inline-flex items-center gap-2 bg-[#FACC15] text-[#0C1B2A] font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <Phone className="size-4" />
          Call now — {phone}
        </a>
      </nav>

      {/* 2. Hero — color block with giant phone */}
      <section className="relative bg-[#0C1B2A] px-6 md:px-10 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="max-w-5xl">
          <p className="font-sans text-xs md:text-sm tracking-[0.2em] uppercase text-[#94A3B8] mb-6">
            {suburb} &amp; the Sutherland Shire — 24/7 emergency response
          </p>
          <h1 className="font-heading font-medium text-[clamp(3rem,8vw,7rem)] tracking-[-0.04em] leading-[0.95] text-white max-w-4xl">
            Blocked drain in {suburb}?
            <br />
            Sorted today.
          </h1>

          <a
            href={telHref}
            className="mt-12 inline-block font-heading font-medium text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.03em] leading-none text-[#FACC15] transition-all duration-300 hover:opacity-80"
          >
            {phone}
          </a>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-[#FACC15] text-[#FACC15]" />
                ))}
              </div>
              <span className="text-sm text-white">
                {rating}★ from {userRatingCount} reviews
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <ShieldCheck className="size-4" />
              <span className="text-sm">Licensed &amp; insured</span>
            </div>
          </div>
        </div>
      </section>

      <HazardTape />

      {/* 3. Response stat band */}
      <section className="bg-white px-6 md:px-10 py-20 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 max-w-5xl mx-auto text-center">
          <div>
            <p className="font-heading font-medium text-2xl md:text-3xl tracking-[-0.02em] text-[#0C1B2A]">
              Same-day service
            </p>
            <div className="mt-3 mx-auto w-12 h-1 bg-[#FACC15]" />
            <p className="mt-4 text-base text-[#475569]">
              Call before midday and we're usually there before dinner.
            </p>
          </div>
          <div>
            <p className="font-heading font-medium text-2xl md:text-3xl tracking-[-0.02em] text-[#0C1B2A]">
              {rating}★ rated
            </p>
            <div className="mt-3 mx-auto w-12 h-1 bg-[#FACC15]" />
            <p className="mt-4 text-base text-[#475569]">
              {userRatingCount} reviews from homeowners across the Shire.
            </p>
          </div>
          <div>
            <p className="font-heading font-medium text-2xl md:text-3xl tracking-[-0.02em] text-[#0C1B2A]">
              Upfront pricing
            </p>
            <div className="mt-3 mx-auto w-12 h-1 bg-[#FACC15]" />
            <p className="mt-4 text-base text-[#475569]">
              You approve the price before a single tool comes out.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Services — alternating split */}
      <section className="bg-[#F1F5F9] px-6 md:px-10 py-24 md:py-32">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#0C1B2A] mb-16 max-w-2xl">
          The jobs we get called for most.
        </h2>

        <div className="flex flex-col gap-16 md:gap-20 max-w-5xl mx-auto">
          {services.map((service, i) => {
            const Icon = service.icon
            const reversed = i % 2 === 1
            return (
              <div
                key={service.title}
                className={`grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center ${
                  reversed ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="md:col-span-5">
                  <img
                    src={service.photo}
                    alt={service.alt}
                    className="w-full h-64 md:h-80 object-cover rounded-sm"
                  />
                </div>
                <div className="md:col-span-7">
                  <span className="font-heading font-medium text-[clamp(3rem,6vw,5rem)] leading-none tracking-[-0.03em] text-[#FACC15]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mt-4 flex items-center gap-3">
                    <Icon className="size-6 text-[#0C1B2A]" />
                    <h3 className="font-heading text-2xl md:text-3xl tracking-[-0.02em] text-[#0C1B2A]">
                      {service.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-base md:text-lg leading-relaxed text-[#475569] max-w-md">
                    {service.copy}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. Review marquee */}
      <section className="bg-white py-24 md:py-32 overflow-hidden">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#0C1B2A] mb-16 px-6 md:px-10 max-w-2xl">
          {userRatingCount} five-star reviews, and counting.
        </h2>
        <div className="flex w-max marquee-track">
          {[...reviews, ...reviews].map((review, i) => (
            <div
              key={i}
              className="w-80 md:w-96 shrink-0 mx-4 bg-[#F1F5F9] rounded-sm p-8"
            >
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="size-4 fill-[#FACC15] text-[#FACC15]" />
                ))}
              </div>
              <p className="text-base leading-relaxed text-[#0C1B2A]">
                &ldquo;{review.text}&rdquo;
              </p>
              <p className="mt-4 text-sm text-[#475569]">— {review.name}, Google review</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Service area */}
      <section className="bg-[#F1F5F9] px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 max-w-5xl mx-auto">
          <div className="md:col-span-5">
            <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#0C1B2A]">
              Local plumbers, not a call centre.
            </h2>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-[#475569] max-w-md">
              Based in {suburb}, our vans are already out across the Shire — so when you call, help is close by.
            </p>
          </div>
          <div className="md:col-span-7">
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              {suburbs.map((s) => (
                <li key={s} className="flex items-center gap-2 text-base text-[#0C1B2A]">
                  <span className="w-2 h-2 bg-[#FACC15] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6.5 Gallery */}
      <section className="bg-white px-6 md:px-10 py-24 md:py-32">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#0C1B2A] mb-16 max-w-2xl">
          On the tools, on the job.
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {galleryPhotos.map((item, i) => (
            <button
              key={item.photo}
              type="button"
              onClick={() => {
                setLightboxIndex(i)
                setLightboxOpen(true)
              }}
              className="group relative block overflow-hidden rounded-sm cursor-pointer"
            >
              <img
                src={item.photo}
                alt={item.alt}
                className="w-full h-40 md:h-56 object-cover transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
              />
            </button>
          ))}
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
            className="absolute top-0 right-0 -translate-y-full md:translate-y-0 md:-top-2 md:-right-2 bg-[#FACC15] text-[#0C1B2A] rounded-full p-2 transition-all duration-300 hover:scale-105"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setLightboxIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#FACC15] text-[#0C1B2A] rounded-full p-2 transition-all duration-300 hover:scale-105"
            aria-label="Previous photo"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryPhotos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FACC15] text-[#0C1B2A] rounded-full p-2 transition-all duration-300 hover:scale-105"
            aria-label="Next photo"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#0C1B2A] text-[#FACC15] text-sm font-semibold px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {galleryPhotos.length}
          </span>
        </div>
      </Dialog>

      <HazardTape />

      {/* 7. Contact / CTA (navy) */}
      <section className="bg-[#0C1B2A] px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 max-w-5xl mx-auto">
          <div className="md:col-span-6">
            <h2 className="font-heading font-medium text-[clamp(2.5rem,6vw,4.5rem)] tracking-[-0.04em] leading-[0.95] text-white">
              Need a plumber now?
            </h2>
            <a
              href={telHref}
              className="mt-8 inline-block font-heading font-medium text-[clamp(2rem,5vw,3.5rem)] tracking-[-0.03em] leading-none text-[#FACC15] transition-all duration-300 hover:opacity-80"
            >
              {phone}
            </a>
            <p className="mt-6 text-base text-[#94A3B8]">{formattedAddress}</p>
          </div>

          <form className="md:col-span-6 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="text-xs uppercase tracking-[0.1em] text-[#94A3B8]">
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                className="mt-2 bg-transparent border-[#94A3B8]/40 text-white placeholder:text-[#94A3B8]/60"
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-xs uppercase tracking-[0.1em] text-[#94A3B8]">
                Phone
              </label>
              <Input
                id="phone"
                placeholder="Your best contact number"
                className="mt-2 bg-transparent border-[#94A3B8]/40 text-white placeholder:text-[#94A3B8]/60"
              />
            </div>
            <div>
              <label htmlFor="problem" className="text-xs uppercase tracking-[0.1em] text-[#94A3B8]">
                What's the problem?
              </label>
              <Textarea
                id="problem"
                placeholder="Blocked drain, no hot water, burst pipe..."
                className="mt-2 bg-transparent border-[#94A3B8]/40 text-white placeholder:text-[#94A3B8]/60"
              />
            </div>
            <Button className="mt-2 bg-[#FACC15] text-[#0C1B2A] hover:bg-[#FACC15]/90 font-semibold transition-all duration-300 w-fit px-8">
              Book a plumber
            </Button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-white px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#0C1B2A]/10">
        <span className="font-heading text-sm tracking-[-0.02em] text-[#0C1B2A]">
          {businessName}
        </span>
        <a href={telHref} className="text-sm text-[#475569] hover:text-[#0C1B2A] transition-all duration-300">
          {phone}
        </a>
      </footer>

      {/* Sticky mobile call bar */}
      <a
        href={telHref}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-center gap-2 bg-[#FACC15] text-[#0C1B2A] font-semibold text-base py-4 transition-all duration-300 hover:opacity-90"
      >
        <Phone className="size-5" />
        Call now — {phone}
      </a>
    </div>
  )
}
