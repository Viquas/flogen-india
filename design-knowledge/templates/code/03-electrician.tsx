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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function GeneratedPage() {
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
    <div className="bg-[#111113] font-sans">
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
                {rating}★
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

      {/* 6. Testimonial — oversized quote */}
      <section className="bg-[#111113] px-6 md:px-10 py-24 md:py-32 border-t border-[#2A2A30]">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow>
            <span className="mx-auto">From the job book</span>
          </Eyebrow>
          <span className="font-heading text-[#A3E635] text-6xl md:text-8xl leading-none">
            &ldquo;
          </span>
          <p className="font-heading text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.02em] leading-[1.15] text-[#FAFAF9] -mt-6">
            {reviews[0].text}
          </p>
          <p className="mt-8 font-tech text-xs tracking-[0.2em] uppercase text-[#A1A1AA]">
            — {reviews[0].name}, Google review
          </p>
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
    </div>
  )
}
