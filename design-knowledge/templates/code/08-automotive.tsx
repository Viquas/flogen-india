import {
  Phone,
  Star,
  Wrench,
  Gauge,
  Snowflake,
  CircleDot,
  ClipboardCheck,
  Search,
  MapPin,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function GeneratedPage() {
  const businessName = "Penrith Engine Room"
  const phone = "(02) 4721 3390"
  const telHref = "tel:0247213390"
  const suburb = "Penrith, NSW"
  const formattedAddress = "58 Batt Street, Penrith NSW 2750"
  const rating = "4.9"
  const userRatingCount = "241"

  const services = [
    {
      index: "01",
      label: "LOGBOOK SERVICE",
      title: "Logbook servicing",
      copy: "Manufacturer-scheduled servicing that keeps your new-car warranty intact, done to the letter of the logbook.",
      icon: ClipboardCheck,
      span: "md:col-span-3",
    },
    {
      index: "02",
      label: "BRAKES & SUSPENSION",
      title: "Brakes & suspension",
      copy: "Pads, rotors, shocks and struts — sorted before a warning light forces the issue.",
      icon: CircleDot,
      span: "md:col-span-3",
    },
    {
      index: "03",
      label: "DIAGNOSTICS",
      title: "Full diagnostics",
      copy: "Dash light on? We plug in, read the fault codes straight, and tell you what's actually wrong.",
      icon: Search,
      span: "md:col-span-3",
    },
    {
      index: "04",
      label: "AIR-CON",
      title: "Air-con regas",
      copy: "Regas and leak checks before summer bites — cold air, no surprises on the invoice.",
      icon: Snowflake,
      span: "md:col-span-3",
    },
    {
      index: "05",
      label: "SAME-DAY DIAGNOSTICS",
      title: "Same-day diagnostics",
      copy: "Drop it in before 9am, we'll have the fault found and a fixed quote in your inbox by lunch.",
      icon: Gauge,
      photo:
        "https://images.unsplash.com/photo-1632823471565-1ecdf7c8a5f5?auto=format&fit=crop&q=80&w=1600",
      alt: "Mechanic using a diagnostic scanner plugged into a car's OBD port",
      span: "md:col-span-6",
    },
    {
      index: "06",
      label: "TYRES & ALIGNMENT",
      title: "Tyres & alignment",
      copy: "New tyres fitted and balanced, wheel alignment set true — no more pulling to one side.",
      icon: Wrench,
      span: "md:col-span-3",
    },
    {
      index: "07",
      label: "PRE-PURCHASE",
      title: "Pre-purchase inspections",
      copy: "Buying second-hand? We check it over before you hand over a cent, not after.",
      icon: ShieldCheck,
      span: "md:col-span-3",
    },
  ]

  const reviews = [
    {
      text: "Told me straight what needed doing and what could wait. First workshop in Penrith that hasn't tried to upsell me on rubbish.",
      name: "Dean R.",
    },
    {
      text: "Had the car back same day with a proper printout of the diagnostic. Rego renewal sorted, no dramas.",
      name: "Priya K.",
    },
    {
      text: "Fixed a fault two other places couldn't find. Fair price, no BS. This is our family's workshop now.",
      name: "Wade T.",
    },
    {
      text: "Air-con regas took forty minutes and cost exactly what they quoted. Cold as a fridge for the drive home.",
      name: "Michelle O.",
    },
    {
      text: "Pre-purchase inspection saved me from a lemon with a cracked head gasket the seller didn't mention.",
      name: "Josh N.",
    },
    {
      text: "Been coming here for six years. Same bloke on the tools every time, and he remembers my car.",
      name: "Fatima A.",
    },
  ]

  const workshopPhotos = [
    {
      src: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1600",
      alt: "Car raised on a hydraulic hoist inside a clean mechanic workshop",
      caption: "BAY 01 — HOIST & UNDERBODY",
    },
    {
      src: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&q=80&w=1600",
      alt: "Close-up of a car engine bay during servicing",
      caption: "BAY 02 — ENGINE BAY",
    },
  ]

  const heroStrip =
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1600"

  const DiagnosticStrip = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-[#141416] border-y border-[#2C2C33] px-6 md:px-10 py-3 overflow-hidden">
      <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#E11D2E] text-center flex items-center justify-center gap-3">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E11D2E] animate-pulse" />
        {children}
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E11D2E] animate-pulse" />
      </p>
    </div>
  )

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#E11D2E] mb-6">
      {children}
    </p>
  )

  return (
    <div className="bg-[#141416] font-sans">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* 1. Nav */}
      <nav className="bg-[#141416] border-b border-[#2C2C33] px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 z-20">
        <span className="font-heading font-bold text-lg tracking-[-0.02em] uppercase text-[#F4F4F5]">
          {businessName}
        </span>
        <a
          href={telHref}
          className="inline-flex items-center gap-2 bg-[#E11D2E] text-[#F4F4F5] font-tech text-xs tracking-[0.15em] uppercase px-5 py-2.5 rounded-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#E11D2E]/30"
        >
          <Phone className="size-4" />
          Call the workshop
        </a>
      </nav>

      {/* 2. Hero — color block, phone-forward */}
      <section className="relative bg-[#141416] pt-20 md:pt-28">
        <div className="px-6 md:px-10 max-w-6xl mx-auto pb-16 md:pb-24">
          <Eyebrow>{suburb} — mobile &amp; workshop mechanical</Eyebrow>
          <h1 className="font-heading font-bold text-[clamp(3rem,8vw,7rem)] tracking-[-0.03em] leading-[0.92] uppercase text-[#F4F4F5]">
            Your car.
            <br />
            Fixed right.
          </h1>

          <a
            href={telHref}
            className="mt-10 inline-block font-heading font-bold text-[clamp(2.25rem,6vw,4.5rem)] tracking-[-0.03em] leading-none text-[#E11D2E] transition-all duration-300 hover:opacity-80"
          >
            {phone}
          </a>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-tech text-xs tracking-[0.2em] uppercase text-[#9D9DA6]">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#E11D2E]" />
              {suburb}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="size-3.5 fill-[#E11D2E] text-[#E11D2E]" />
              {rating} — {userRatingCount} reviews
            </span>
            <span className="flex items-center gap-1.5 text-[#F4F4F5]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E11D2E] animate-pulse" />
              BOOKINGS OPEN
            </span>
          </div>
        </div>

        <div className="w-full h-40 md:h-56 overflow-hidden">
          <img
            src={heroStrip}
            alt="Mechanic's workshop bay with a car up on a hoist, ready for inspection"
            className="w-full h-full object-cover grayscale contrast-125"
          />
        </div>
      </section>

      <DiagnosticStrip>SYSTEMS CHECK — ALL CLEAR</DiagnosticStrip>

      {/* 3. Services — bento grid, service checklist */}
      <section className="bg-[#141416] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>The job card — full service range</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#F4F4F5] mb-16 max-w-2xl">
            No surprises. Just your car, sorted.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.index}
                  className={`relative bg-[#1D1D21] border border-[#2C2C33] rounded-sm p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-[#E11D2E]/60 hover:-translate-y-1 ${service.span}`}
                >
                  {service.photo && (
                    <img
                      src={service.photo}
                      alt={service.alt}
                      className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />
                  )}
                  <div className="relative z-10">
                    <p className="font-tech text-xs tracking-[0.2em] uppercase text-[#E11D2E] mb-6">
                      {service.index} — {service.label}
                    </p>
                    <Icon className="size-7 text-[#F4F4F5] mb-4" />
                    <h3 className="font-heading text-xl md:text-2xl tracking-[-0.02em] uppercase text-[#F4F4F5]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm md:text-base leading-relaxed text-[#9D9DA6] max-w-sm">
                      {service.copy}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <DiagnosticStrip>NEXT AVAILABLE — THIS WEEK</DiagnosticStrip>

      {/* 4. Trust band — inverted light */}
      <section className="bg-[#F4F4F5] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <p className="font-tech text-xs tracking-[0.25em] uppercase text-[#E11D2E] mb-6">
            Credibility check
          </p>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#141416] mb-16 max-w-2xl">
            Straight answers. Fair prices.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl tracking-[-0.03em] text-[#141416]">
                {rating}★
              </p>
              <div className="mt-3 w-12 h-1 bg-[#E11D2E]" />
              <p className="mt-4 text-base text-[#55555E]">
                Average rating from {userRatingCount} Google reviews.
              </p>
            </div>
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl tracking-[-0.03em] text-[#141416]">
                Upfront
              </p>
              <div className="mt-3 w-12 h-1 bg-[#E11D2E]" />
              <p className="mt-4 text-base text-[#55555E]">
                Fixed quotes before we touch a spanner — no invoice shocks.
              </p>
            </div>
            <div>
              <p className="font-heading font-bold text-4xl md:text-5xl tracking-[-0.03em] text-[#141416]">
                Guaranteed
              </p>
              <div className="mt-3 w-12 h-1 bg-[#E11D2E]" />
              <p className="mt-4 text-base text-[#55555E]">
                All work guaranteed, all makes and models welcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The workshop — photo proof, asymmetric pair */}
      <section className="bg-[#141416] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <Eyebrow>Inside the workshop</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#F4F4F5] mb-16 max-w-2xl">
            A clean bay is an honest bay.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
            <div className="md:col-span-7">
              <img
                src={workshopPhotos[0].src}
                alt={workshopPhotos[0].alt}
                className="w-full h-[320px] md:h-[420px] object-cover rounded-sm"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#9D9DA6]">
                {workshopPhotos[0].caption}
              </p>
            </div>
            <div className="md:col-span-5 md:-mt-12">
              <img
                src={workshopPhotos[1].src}
                alt={workshopPhotos[1].alt}
                className="w-full h-[320px] md:h-[480px] object-cover rounded-sm"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#9D9DA6]">
                {workshopPhotos[1].caption}
              </p>
            </div>
          </div>
        </div>
      </section>

      <DiagnosticStrip>CUSTOMER FEEDBACK — LOGGED</DiagnosticStrip>

      {/* 6. Review marquee */}
      <section className="bg-[#141416] py-24 md:py-32 overflow-hidden">
        <div className="px-6 md:px-10 max-w-6xl mx-auto mb-12">
          <Eyebrow>{userRatingCount}+ Google reviews</Eyebrow>
          <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] uppercase text-[#F4F4F5] max-w-2xl">
            What Penrith says.
          </h2>
        </div>

        <div className="flex w-max" style={{ animation: "marquee 40s linear infinite" }}>
          {[...reviews, ...reviews].map((review, i) => (
            <div
              key={i}
              className="w-[340px] md:w-[400px] shrink-0 mx-3 bg-[#1D1D21] border border-[#2C2C33] rounded-sm p-8"
            >
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="size-4 fill-[#E11D2E] text-[#E11D2E]" />
                ))}
              </div>
              <p className="text-sm md:text-base leading-relaxed text-[#9D9DA6]">
                &ldquo;{review.text}&rdquo;
              </p>
              <p className="mt-6 font-tech text-xs tracking-[0.2em] uppercase text-[#F4F4F5]">
                — {review.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <DiagnosticStrip>BOOKING SYSTEM — READY</DiagnosticStrip>

      {/* 7. Booking CTA */}
      <section id="contact" className="bg-[#141416] px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 max-w-5xl mx-auto">
          <div className="md:col-span-6">
            <Eyebrow>Get it sorted</Eyebrow>
            <h2 className="font-heading font-bold text-[clamp(2.5rem,6vw,4.5rem)] tracking-[-0.03em] leading-[0.95] uppercase text-[#F4F4F5]">
              Book it in.
            </h2>
            <a
              href={telHref}
              className="mt-8 inline-block font-heading font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-[-0.03em] leading-none text-[#E11D2E] transition-all duration-300 hover:opacity-80"
            >
              {phone}
            </a>
            <p className="mt-6 flex items-center gap-2 text-base text-[#9D9DA6]">
              <MapPin className="size-4 text-[#E11D2E]" />
              {formattedAddress}
            </p>
          </div>

          <form className="md:col-span-6 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="font-tech text-xs uppercase tracking-[0.15em] text-[#9D9DA6]">
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                className="mt-2 bg-transparent border-[#2C2C33] text-[#F4F4F5] placeholder:text-[#9D9DA6]/60"
              />
            </div>
            <div>
              <label htmlFor="phone" className="font-tech text-xs uppercase tracking-[0.15em] text-[#9D9DA6]">
                Phone
              </label>
              <Input
                id="phone"
                placeholder="Your best contact number"
                className="mt-2 bg-transparent border-[#2C2C33] text-[#F4F4F5] placeholder:text-[#9D9DA6]/60"
              />
            </div>
            <div>
              <label htmlFor="rego" className="font-tech text-xs uppercase tracking-[0.15em] text-[#9D9DA6]">
                Rego &amp; make
              </label>
              <Input
                id="rego"
                placeholder="e.g. ABC12X, Toyota Corolla"
                className="mt-2 bg-transparent border-[#2C2C33] text-[#F4F4F5] placeholder:text-[#9D9DA6]/60"
              />
            </div>
            <div>
              <label htmlFor="issue" className="font-tech text-xs uppercase tracking-[0.15em] text-[#9D9DA6]">
                What's it doing?
              </label>
              <Textarea
                id="issue"
                placeholder="Warning light, strange noise, logbook service due..."
                className="mt-2 bg-transparent border-[#2C2C33] text-[#F4F4F5] placeholder:text-[#9D9DA6]/60"
              />
            </div>
            <Button className="mt-2 bg-[#E11D2E] text-[#F4F4F5] hover:bg-[#E11D2E]/90 font-semibold transition-all duration-300 w-fit px-8 rounded-sm">
              Request a booking
            </Button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#141416] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#2C2C33]">
        <span className="font-heading font-bold text-sm tracking-[-0.02em] uppercase text-[#F4F4F5]">
          {businessName}
        </span>
        <span className="text-sm text-[#9D9DA6]">{formattedAddress}</span>
      </footer>
    </div>
  )
}
