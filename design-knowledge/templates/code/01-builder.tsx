import { Phone, MapPin, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function GeneratedPage() {
  const businessName = "Marrick & Vane Building Co."
  const phone = "(02) 9557 4128"
  const suburb = "Marrickville"
  const formattedAddress = "14 Fitzroy Street, Marrickville NSW 2204"
  const rating = "4.9★"
  const reviews = "120+ reviews"

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
  ]

  const services = [
    { title: "Renovations", copy: "Whole-house or single-room, done properly the first time." },
    { title: "Extensions", copy: "Second storeys, rear additions, more space where you need it." },
    { title: "New builds", copy: "Knock-down rebuilds and ground-up homes across the Inner West." },
    { title: "Decks & outdoor", copy: "Hardwood decks, pergolas and outdoor living that lasts." },
    { title: "Project management", copy: "One point of contact from council approval to handover." },
  ]

  const testimonial = {
    quote:
      "They pulled our 1920s terrace apart and put it back together better than we imagined — on the timeline they promised, with none of the excuses.",
    author: "Renee & Tom, Marrickville",
  }

  return (
    <div className="bg-[#FAF9F7] font-sans">
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
        <h1 className="font-heading font-bold text-[clamp(3.5rem,9vw,8rem)] leading-[0.9] tracking-[-0.04em] text-[#171412] max-w-5xl">
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
            <p className="font-heading font-bold text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[-0.03em] text-[#FAF9F7]">
              {rating}
            </p>
            <p className="mt-3 text-sm text-[#A8A29E]">Average client rating</p>
          </div>
          <div>
            <p className="font-heading font-bold text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[-0.03em] text-[#FAF9F7]">
              {reviews}
            </p>
            <p className="mt-3 text-sm text-[#A8A29E]">From homeowners across Sydney's Inner West</p>
          </div>
          <div>
            <p className="font-heading font-bold text-[clamp(2.5rem,6vw,4.5rem)] leading-none tracking-[-0.03em] text-[#FAF9F7]">
              Licensed
              <span className="text-[#C2410C]">.</span>
            </p>
            <p className="mt-3 text-sm text-[#A8A29E]">Fully licensed &amp; insured. Free quotes.</p>
          </div>
        </div>
      </section>

      {/* 4. Portfolio — the proof */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <h2 className="font-heading text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#171412] mb-16 max-w-2xl">
          Recent work, not a portfolio of promises.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7 md:-mt-16">
            <div className="relative">
              <img
                src={portfolio[0].src}
                alt={portfolio[0].alt}
                className="w-full h-[420px] md:h-[620px] object-cover"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#57534E]">
                <span className="text-[#C2410C]">01</span> — {portfolio[0].caption.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
            {portfolio.slice(1).map((item, i) => (
              <div key={item.caption}>
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-[260px] md:h-[290px] object-cover"
                />
                <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#57534E]">
                  <span className="text-[#C2410C]">{String(i + 2).padStart(2, "0")}</span> — {item.caption.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* 6. Testimonial — oversized quote */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-white">
        <blockquote className="max-w-3xl mx-auto text-center">
          <p className="font-heading text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.2] tracking-[-0.02em] text-[#171412]">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <footer className="mt-8 text-sm tracking-[0.05em] uppercase text-[#57534E]">
            {testimonial.author}
          </footer>
        </blockquote>
      </section>

      {/* 7. Contact / CTA (dark) */}
      <section className="bg-[#171412] px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          <div className="md:col-span-7">
            <h2 className="font-heading font-bold text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.04em] text-[#FAF9F7]">
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
    </div>
  )
}
