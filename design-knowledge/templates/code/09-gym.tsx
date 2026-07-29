import { useState, useEffect } from "react"
import { Phone, Star, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function GeneratedPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const businessName = "Ironyard Strength Co."
  const phone = "(02) 9051 7742"
  const telHref = "tel:0290517742"
  const suburb = "Alexandria, NSW"
  const formattedAddress = "14 Bourke Road, Alexandria NSW 2015"
  const rating = "4.9"
  const userRatingCount = "312"

  const programs = [
    {
      index: "01",
      title: "Strength & conditioning",
      who: "For lifters chasing a bigger squat, cleaner deadlift and a program that actually progresses.",
      tag: "STRENGTH — 45MIN",
      photo:
        "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&q=80&w=1600",
      alt: "Athlete loading a barbell with weight plates on a gym floor",
    },
    {
      index: "02",
      title: "Group classes",
      who: "Coached small-group sessions — same barbell work, more noise, nobody trains alone.",
      tag: "GROUP — 50MIN",
      photo:
        "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&q=80&w=1600",
      alt: "Small group of athletes training together on a gym floor during a coached class",
    },
    {
      index: "03",
      title: "Personal training",
      who: "One coach, one whiteboard, your goals — for people who want the plan built around them.",
      tag: "1:1 — 60MIN",
      photo:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600",
      alt: "Personal trainer spotting a client during a barbell bench press",
    },
    {
      index: "04",
      title: "Beginner foundations",
      who: "Four weeks of technique before load — squat, hinge, press and pull done properly from day one.",
      tag: "FOUNDATIONS — 40MIN",
      photo:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1600",
      alt: "Coach demonstrating correct squat technique to a beginner client",
    },
  ]

  const floorPhotos = [
    {
      src: "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&q=80&w=1600",
      alt: "Wide view of an industrial gym floor with squat racks and barbells",
      caption: "THE FLOOR — SQUAT RACKS",
    },
    {
      src: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=1600",
      alt: "Chalked hands gripping a barbell mid-lift",
      caption: "CHALK & IRON",
    },
  ]

  const heroPhoto =
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&q=80&w=1600"

  const openingHours = [
    { day: "Mon — Fri", hours: "5:00AM – 9:00PM" },
    { day: "Saturday", hours: "7:00AM – 5:00PM" },
    { day: "Sunday", hours: "7:00AM – 5:00PM" },
  ]

  const memberReviews = [
    {
      name: "Jordan",
      quote: "Added 30kg to my deadlift in four months. Coaching actually knows what they're doing.",
    },
    {
      name: "Priya",
      quote: "First gym where I've stuck with a program past week three. The small classes make it work.",
    },
    {
      name: "Marcus",
      quote: "Came back from a shoulder injury here. Careful programming, zero ego in the room.",
    },
  ]

  const faqs = [
    {
      q: "Do I need experience to join?",
      a: "No. Every new member starts with our beginner foundations block — four weeks of coached technique work before any serious load goes on the bar.",
    },
    {
      q: "What's included in the free trial?",
      a: "A full week of training — group classes, floor access and a coach check-in — with no card required and no obligation to continue.",
    },
    {
      q: "Do you offer personal training?",
      a: "Yes. One-on-one sessions are available alongside group programming, built around your specific goals and schedule.",
    },
    {
      q: "Is there a lock-in contract?",
      a: "No lock-in contracts. Membership runs week to week and you can pause or cancel any time.",
    },
    {
      q: "What should I bring to my first session?",
      a: "Comfortable training gear, closed shoes and a water bottle. We supply chalk, bands and all the equipment on the floor.",
    },
  ]

  const galleryPhotos = [
    {
      src: heroPhoto,
      alt: "Athlete gripping a loaded barbell on an industrial gym floor in Alexandria",
    },
    ...programs.map((program) => ({ src: program.photo, alt: program.alt })),
    ...floorPhotos.map((floor) => ({ src: floor.src, alt: floor.alt })),
    {
      src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1600",
      alt: "Close-up of chalked hands and a barbell knurling before a heavy lift",
    },
    {
      src: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=1600",
      alt: "Group of athletes training together with kettlebells on a gym floor",
    },
  ]

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

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

  const MonoTag = ({ children }: { children: React.ReactNode }) => (
    <span className="font-tech text-xs tracking-[0.2em] uppercase text-[#FF4D24]">
      {children}
    </span>
  )

  return (
    <div className="bg-[#F7F7F4] font-sans">
      {/* 1. Nav */}
      <nav className="bg-[#F7F7F4] px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 z-20 border-b border-[#121212]/10">
        <span className="font-heading font-medium text-lg tracking-[-0.02em] uppercase text-[#121212]">
          {businessName}
        </span>
        <div className="flex items-center gap-6">
          {phone && (
            <a
              href={telHref}
              className="hidden sm:flex items-center gap-2 text-sm text-[#565650] transition-all duration-300 hover:text-[#121212]"
            >
              <Phone className="size-4" />
              {phone}
            </a>
          )}
          <Button className="bg-[#FF4D24] text-[#F7F7F4] hover:bg-[#FF4D24]/90 font-tech text-xs tracking-[0.15em] uppercase rounded-sm px-6 transition-all duration-300 hover:scale-105">
            Start free trial
          </Button>
        </div>
      </nav>

      {/* 2. Hero — full-bleed photo, oversized type on top */}
      <section className="relative overflow-hidden min-h-[640px] md:min-h-[760px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroPhoto}
            alt="Athlete gripping a loaded barbell on an industrial gym floor in Alexandria"
            className="w-full h-full object-cover"
          />
          {/* Scrim: solid chalk on the left where text sits, fading to transparent so the photo reads clearly on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7F7F4] via-[#F7F7F4]/85 md:via-[#F7F7F4]/75 to-[#F7F7F4]/10" />
          {/* Bottom scrim on mobile so the suburb/rating row stays legible over the photo at narrow widths */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F7F4] via-transparent to-transparent md:hidden" />
        </div>

        <div className="relative z-10 px-6 md:px-10 py-16 md:py-24 max-w-7xl mx-auto w-full">
          <h1 className="font-heading font-medium text-[clamp(3.5rem,10vw,8.5rem)] tracking-[-0.05em] leading-[0.88] uppercase text-[#121212]">
            Train.
            <br />
            <span className="text-[#FF4D24]">Harder.</span>
            <br />
            Here.
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
            <MonoTag>{suburb}</MonoTag>
            {rating && (
              <span className="flex items-center gap-1.5 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
                <Star className="size-3.5 fill-[#FF4D24] text-[#FF4D24]" />
                {rating} — {userRatingCount} REVIEWS
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#FF4D24]" />
      </section>

      {/* 3. Results stat band (ink) */}
      <section className="bg-[#121212] px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center items-start">
          <div>
            <p className="font-heading font-medium text-[clamp(3rem,7vw,5.5rem)] tracking-[-0.03em] leading-none whitespace-nowrap text-[#FF4D24]">
              {rating}
              <span className="text-[0.35em] align-middle ml-1">★</span>
            </p>
            <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88]">
              Rated by lifters training here
            </p>
          </div>
          <div>
            <p className="font-heading font-medium text-[clamp(3rem,7vw,5.5rem)] tracking-[-0.03em] leading-none whitespace-nowrap text-[#FF4D24]">
              {userRatingCount}+
            </p>
            <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88]">
              Members&apos; reviews on record
            </p>
          </div>
          <div>
            <p className="font-heading font-medium text-[clamp(3rem,7vw,5.5rem)] tracking-[-0.03em] leading-none whitespace-nowrap text-[#FF4D24]">
              Free
            </p>
            <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88]">
              First week — no card required
            </p>
          </div>
        </div>
      </section>

      {/* 4. Programs — alternating split */}
      <section className="bg-[#F7F7F4] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#FF4D24] mb-6">
            The programming
          </p>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#121212] mb-16 max-w-2xl">
            Stronger than your excuses. Prove it.
          </h2>

          <div className="flex flex-col gap-16 md:gap-24">
            {programs.map((program, i) => {
              const reversed = i % 2 === 1
              return (
                <div
                  key={program.index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center"
                >
                  <div
                    className={`md:col-span-6 ${
                      reversed ? "md:order-2" : "md:order-1"
                    }`}
                  >
                    <img
                      src={program.photo}
                      alt={program.alt}
                      onClick={() => openLightbox(i + 1)}
                      className="w-full h-[320px] md:h-[420px] object-cover rounded-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
                    />
                  </div>
                  <div
                    className={`md:col-span-6 ${
                      reversed ? "md:order-1" : "md:order-2"
                    }`}
                  >
                    <span className="font-heading font-medium text-6xl md:text-7xl tracking-[-0.03em] text-[#FF4D24]/20">
                      {program.index}
                    </span>
                    <h3 className="mt-2 font-heading font-medium text-3xl md:text-4xl tracking-[-0.03em] leading-[0.95] uppercase text-[#121212]">
                      {program.title}
                    </h3>
                    <p className="mt-4 text-base md:text-lg leading-relaxed text-[#565650] max-w-md">
                      {program.who}
                    </p>
                    <MonoTag>{program.tag}</MonoTag>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. Coach note — oversized quote + member reviews */}
      <section className="bg-[#F7F7F4] px-6 md:px-10 py-24 md:py-32 border-t border-[#121212]/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-heading text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.02em] leading-[1.1] text-[#121212]">
            &ldquo;Show up. We&apos;ll handle the rest.&rdquo;
          </p>
          <p className="mt-8 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
            — The coaching team
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {memberReviews.map((review) => (
            <div
              key={review.name}
              className="bg-white border border-[#121212]/10 rounded-sm p-6"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#FF4D24] text-[#FF4D24]" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#565650]">
                &ldquo;{review.quote}&rdquo;
              </p>
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#121212]">
                — {review.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. The floor — photo pair */}
      <section className="bg-[#F7F7F4] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#FF4D24] mb-6">
            The space
          </p>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#121212] mb-16 max-w-2xl">
            No mirrors. No fuss. Just iron.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
            <div className="md:col-span-7">
              <img
                src={floorPhotos[0].src}
                alt={floorPhotos[0].alt}
                onClick={() => openLightbox(programs.length + 1)}
                className="w-full h-[320px] md:h-[420px] object-cover rounded-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
                {floorPhotos[0].caption}
              </p>
            </div>
            <div className="md:col-span-5 md:-mt-10">
              <img
                src={floorPhotos[1].src}
                alt={floorPhotos[1].alt}
                onClick={() => openLightbox(programs.length + 2)}
                className="w-full h-[320px] md:h-[480px] object-cover rounded-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:opacity-90"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
                {floorPhotos[1].caption}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. Gallery — click-to-open lightbox */}
      <section className="bg-[#121212] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#FF4D24] mb-6">
            The gallery
          </p>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#F7F7F4] mb-16 max-w-2xl">
            Every rep. Every session. On record.
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryPhotos.map((photo, index) => (
              <button
                key={photo.src + index}
                type="button"
                onClick={() => openLightbox(index)}
                className="group relative aspect-square overflow-hidden rounded-sm border border-[#F7F7F4]/10 cursor-pointer"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-80"
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
            src={galleryPhotos[lightboxIndex].src}
            alt={galleryPhotos[lightboxIndex].alt}
            className="w-full h-full max-h-[85vh] object-contain"
          />

          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute top-0 right-0 md:-top-4 md:-right-4 size-10 flex items-center justify-center bg-[#121212] border border-[#F7F7F4]/20 text-[#F7F7F4] rounded-full transition-all duration-300 hover:bg-[#FF4D24] hover:border-[#FF4D24]"
          >
            <X className="size-5" />
          </button>

          <button
            type="button"
            onClick={showPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center bg-[#121212]/80 border border-[#F7F7F4]/20 text-[#F7F7F4] rounded-full transition-all duration-300 hover:bg-[#FF4D24] hover:border-[#FF4D24]"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center bg-[#121212]/80 border border-[#F7F7F4]/20 text-[#F7F7F4] rounded-full transition-all duration-300 hover:bg-[#FF4D24] hover:border-[#FF4D24]"
          >
            <ChevronRight className="size-6" />
          </button>

          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 font-tech text-xs tracking-[0.25em] uppercase text-[#FF4D24] bg-[#121212]/90 border border-[#F7F7F4]/20 px-4 py-1.5 rounded-sm flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF4D24] animate-pulse" />
            {lightboxIndex + 1} / {galleryPhotos.length}
          </p>
        </div>
      </Dialog>

      {/* 6c. Hours + FAQ */}
      <section className="bg-[#F7F7F4] px-6 md:px-10 py-24 md:py-32 border-t border-[#121212]/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-10">
          <div className="md:col-span-4 text-center md:text-left">
            <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#FF4D24] mb-6">
              Opening hours
            </p>
            <h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#121212] mb-8">
              On the floor
            </h2>
            <div className="max-w-sm mx-auto md:mx-0">
              {openingHours.map((row) => (
                <div
                  key={row.day}
                  className="flex items-center justify-between py-4 border-t border-[#121212]/10 last:border-b"
                >
                  <span className="font-tech text-xs tracking-[0.15em] uppercase text-[#121212]">
                    {row.day}
                  </span>
                  <span className="text-sm text-[#565650]">{row.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="max-w-3xl mx-auto text-center md:text-left">
              <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#FF4D24] mb-6">
                Before you show up
              </p>
              <h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#121212] mb-8">
                Common questions
              </h2>
            </div>
            <Accordion className="max-w-3xl mx-auto text-left">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="font-tech text-xs md:text-sm tracking-[0.1em] uppercase text-[#121212]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-[#565650]">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 7. Trial CTA (ink) — the rep, repeated */}
      <section id="contact" className="bg-[#121212] px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 max-w-5xl mx-auto">
          <div className="md:col-span-7">
            <h2 className="font-heading font-medium text-[clamp(2.5rem,7vw,5.5rem)] tracking-[-0.05em] leading-[0.88] uppercase text-[#F7F7F4]">
              First week.
              <br />
              <span className="text-[#FF4D24]">On</span> us.
            </h2>
            {phone && (
              <a
                href={telHref}
                className="mt-8 inline-block font-heading font-medium text-2xl md:text-3xl tracking-[-0.02em] text-[#F7F7F4] transition-all duration-300 hover:text-[#FF4D24]"
              >
                {phone}
              </a>
            )}
            {formattedAddress && (
              <p className="mt-4 flex items-center gap-2 text-base text-[#8F8F88]">
                <MapPin className="size-4 text-[#FF4D24]" />
                {formattedAddress}
              </p>
            )}
          </div>

          <form className="md:col-span-5 flex flex-col gap-4">
            <div>
              <label
                htmlFor="name"
                className="font-tech text-xs uppercase tracking-[0.15em] text-[#8F8F88]"
              >
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                className="mt-2 bg-transparent border-[#8F8F88]/40 text-[#F7F7F4] placeholder:text-[#8F8F88]/60"
              />
            </div>
            <div>
              <label
                htmlFor="phone-field"
                className="font-tech text-xs uppercase tracking-[0.15em] text-[#8F8F88]"
              >
                Phone
              </label>
              <Input
                id="phone-field"
                placeholder="Your best contact number"
                className="mt-2 bg-transparent border-[#8F8F88]/40 text-[#F7F7F4] placeholder:text-[#8F8F88]/60"
              />
            </div>
            <div>
              <label
                htmlFor="goal"
                className="font-tech text-xs uppercase tracking-[0.15em] text-[#8F8F88]"
              >
                Goal
              </label>
              <Input
                id="goal"
                placeholder="e.g. get stronger, first competition, come back from injury"
                className="mt-2 bg-transparent border-[#8F8F88]/40 text-[#F7F7F4] placeholder:text-[#8F8F88]/60"
              />
            </div>
            <Button className="mt-2 bg-[#FF4D24] text-[#F7F7F4] hover:bg-[#FF4D24]/90 font-tech text-xs tracking-[0.15em] uppercase rounded-sm w-fit px-8 transition-all duration-300 hover:scale-105">
              Claim my free week
            </Button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#121212] border-t border-[#F7F7F4]/10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <span className="font-heading font-medium text-lg tracking-[-0.02em] uppercase text-[#F7F7F4]">
              {businessName}
            </span>
            <p className="mt-4 text-sm leading-relaxed text-[#8F8F88] max-w-xs">
              Strength training and coached programming on the floor in {suburb}.
            </p>
          </div>

          <div>
            <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88] mb-5">
              Quick nav
            </p>
            <nav className="flex flex-col gap-3">
              <a href="#contact" className="text-sm text-[#F7F7F4] transition-all duration-300 hover:text-[#FF4D24]">
                Free trial
              </a>
              <a href="#" className="text-sm text-[#F7F7F4] transition-all duration-300 hover:text-[#FF4D24]">
                Programs
              </a>
              <a href="#" className="text-sm text-[#F7F7F4] transition-all duration-300 hover:text-[#FF4D24]">
                The floor
              </a>
            </nav>
          </div>

          <div>
            <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88] mb-5">
              Contact
            </p>
            <div className="flex flex-col gap-3">
              {phone && (
                <a
                  href={telHref}
                  className="flex items-center gap-2 text-sm text-[#F7F7F4] transition-all duration-300 hover:text-[#FF4D24]"
                >
                  <Phone className="size-4 text-[#FF4D24]" />
                  {phone}
                </a>
              )}
              {formattedAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#F7F7F4] transition-all duration-300 hover:text-[#FF4D24]"
                >
                  <MapPin className="size-4 text-[#FF4D24]" />
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[#F7F7F4]/10 px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
          <span className="text-xs text-[#8F8F88]">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </span>
          <span className="text-xs text-[#8F8F88]">{formattedAddress}</span>
        </div>
      </footer>
    </div>
  )
}
