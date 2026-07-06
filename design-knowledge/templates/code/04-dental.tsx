import { Phone, Star, MapPin, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function GeneratedPage() {
  const businessName = "Shoreline Dental Cronulla"
  const suburb = "Cronulla"
  const phone = "(02) 9523 4187"
  const telHref = "tel:0295234187"
  const formattedAddress = "4 Gerrale Street, Cronulla NSW 2230"
  const rating = "4.9"
  const userRatingCount = "212+"

  const heroPhoto =
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1600"

  const services = [
    {
      title: "Check-ups & cleans",
      copy: "Six-monthly examinations and a gentle scale and clean, with plain-English notes on anything worth watching.",
    },
    {
      title: "Teeth whitening",
      copy: "In-chair and take-home whitening, colour-matched to a shade that still looks like your smile.",
    },
    {
      title: "Crowns & veneers",
      copy: "Custom-made restorations that repair or reshape a tooth without anyone noticing the join.",
    },
    {
      title: "Implants",
      copy: "A permanent, natural-feeling replacement for a missing tooth, planned end-to-end under one roof.",
    },
    {
      title: "Emergency dentistry",
      copy: "Same-day relief for chips, breaks and toothache — call before nine and we'll find you a chair.",
    },
    {
      title: "Children's dentistry",
      copy: "Unhurried first visits designed to make the dentist a normal, unremarkable part of growing up.",
    },
  ]

  const storyPhotos = [
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80&w=1200",
  ]

  const review = {
    text: "I've never left a dental appointment feeling relaxed before this place. They talk you through everything and there's genuinely no judgement about the years I put it off.",
    name: "Isabelle",
  }

  return (
    <div className="bg-[#F6F5F1] font-sans">
      {/* 1. Nav */}
      <nav className="bg-[#F6F5F1] px-6 md:px-10 py-6 flex items-center justify-between sticky top-0 z-20 border-b border-[#E4E1D8]">
        <span className="font-elegant font-medium text-xl tracking-[-0.01em] text-[#1F2937]">
          {businessName}
        </span>
        <div className="flex items-center gap-5">
          <a
            href={telHref}
            className="hidden sm:inline text-sm text-[#5B6472] hover:text-[#3E7C6F] transition-all duration-300"
          >
            {phone}
          </a>
          <a
            href="#book"
            className="inline-flex items-center gap-2 bg-[#3E7C6F] text-[#F6F5F1] text-sm font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-[#2F4A43] hover:scale-105"
          >
            Book an appointment
          </a>
        </div>
      </nav>

      {/* 2. Hero — split editorial */}
      <section className="px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 items-center max-w-6xl mx-auto">
          <div className="md:col-span-6">
            <h1 className="font-elegant font-medium text-[clamp(2.75rem,6.5vw,5.5rem)] tracking-[-0.02em] leading-[1.02] text-[#1F2937]">
              Gentle <em className="text-[#3E7C6F] italic">dentistry</em>
              <br />
              in {suburb}.
            </h1>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-[#5B6472] max-w-md">
              Unhurried appointments, upfront pricing, and a team that
              explains before it treats. Book in with a dentist who takes
              the time.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#book"
                className="inline-flex items-center gap-2 bg-[#3E7C6F] text-[#F6F5F1] font-medium text-sm px-7 py-3.5 rounded-full transition-all duration-300 hover:bg-[#2F4A43] hover:scale-105 hover:shadow-lg hover:shadow-[#3E7C6F]/20"
              >
                Book an appointment
              </a>
              <a
                href={telHref}
                className="inline-flex items-center gap-2 text-[#1F2937] font-medium text-sm transition-all duration-300 hover:text-[#3E7C6F]"
              >
                <Phone className="size-4" />
                {phone}
              </a>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 bg-white rounded-full pl-3 pr-4 py-2 border border-[#E4E1D8]">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#3E7C6F] text-[#3E7C6F]" />
                ))}
              </div>
              <span className="text-sm text-[#5B6472]">
                {rating} from {userRatingCount} Google reviews
              </span>
            </div>
          </div>

          <div className="md:col-span-6">
            <img
              src={heroPhoto}
              alt="Bright, calm dental treatment room with natural light at Shoreline Dental Cronulla"
              className="w-full h-[420px] md:h-[560px] object-cover rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* 3. Reassurance row */}
      <section className="px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 max-w-6xl mx-auto">
          {[
            {
              title: "Pain-free focus",
              copy: "Numbing that actually works, and a team happy to slow down the moment you need them to.",
            },
            {
              title: "Upfront pricing",
              copy: "A written quote before any treatment starts — no surprises when you get to the desk.",
            },
            {
              title: "Same-week appointments",
              copy: "Real availability for check-ups and urgent problems, not a three-month waitlist.",
            },
          ].map((item) => (
            <div key={item.title} className="pt-6 border-t border-[#3E7C6F]">
              <h3 className="font-elegant font-medium text-2xl tracking-[-0.01em] text-[#1F2937]">
                {item.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-[#5B6472]">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Services — editorial list */}
      <section className="px-6 md:px-10 py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#1F2937] mb-16">
            Treatments, plainly explained.
          </h2>
          <div>
            {services.map((service) => (
              <div
                key={service.title}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-8 border-t border-[#E4E1D8] last:border-b"
              >
                <h3 className="md:col-span-5 font-elegant font-medium text-2xl md:text-3xl tracking-[-0.01em] text-[#1F2937]">
                  {service.title}
                </h3>
                <p className="md:col-span-7 text-base md:text-lg leading-relaxed text-[#5B6472] self-center">
                  {service.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. The practice — photo + story */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 max-w-6xl mx-auto items-center">
          <div className="md:col-span-6 relative h-[420px] md:h-[520px]">
            <img
              src={storyPhotos[0]}
              alt={`Reception and waiting area at ${businessName}`}
              className="absolute top-0 left-0 w-3/4 h-3/4 object-cover rounded-3xl"
            />
            <img
              src={storyPhotos[1]}
              alt={`Dentist and patient sharing a smile at ${businessName}`}
              className="absolute bottom-0 right-0 w-3/5 h-3/5 object-cover rounded-3xl border-4 border-[#F6F5F1]"
            />
          </div>
          <div className="md:col-span-6">
            <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#1F2937]">
              The practice
            </h2>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-[#5B6472] max-w-md">
              {businessName} sits two minutes from Cronulla
              Beach, fitted out to feel more like a quiet studio than a
              waiting room. Our dentists trained together, still work
              together, and take the time to explain every option before
              you decide on one.
            </p>
            <p className="mt-6 flex items-center gap-2 text-sm text-[#5B6472]">
              <MapPin className="size-4 text-[#3E7C6F]" />
              {formattedAddress}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Testimonial — oversized quote */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="size-10 text-[#3E7C6F] mx-auto mb-6" />
          <p className="font-elegant italic font-medium text-[clamp(1.5rem,3.5vw,2.5rem)] leading-[1.25] text-[#1F2937]">
            {review.text}
          </p>
          <p className="mt-8 text-sm tracking-[0.1em] uppercase text-[#5B6472]">
            — {review.name}, Google review
          </p>
        </div>
      </section>

      {/* 7. Booking CTA (deep sage) */}
      <section id="book" className="px-6 md:px-10 py-24 md:py-32 bg-[#2F4A43]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 max-w-5xl mx-auto">
          <div className="md:col-span-5">
            <h2 className="font-elegant font-medium text-[clamp(2.5rem,5.5vw,4rem)] tracking-[-0.02em] leading-[1.05] text-[#F6F5F1]">
              Ready when <em className="text-[#3E7C6F] italic">you</em> are.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#9DB4AC]">
              New patients welcome, same-week appointments most weeks.
            </p>
            <a
              href={telHref}
              className="mt-8 inline-flex items-center gap-2 text-[#F6F5F1] font-medium text-lg transition-all duration-300 hover:text-[#9DB4AC]"
            >
              <Phone className="size-5" />
              {phone}
            </a>
            <p className="mt-4 flex items-center gap-2 text-sm text-[#9DB4AC]">
              <MapPin className="size-4" />
              {formattedAddress}
            </p>
          </div>

          <form className="md:col-span-7 bg-[#F6F5F1] rounded-3xl p-8 md:p-10 flex flex-col gap-5">
            <div>
              <Label htmlFor="name" className="text-sm text-[#5B6472]">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Your full name"
                className="mt-2 bg-white border-[#E4E1D8] text-[#1F2937] placeholder:text-[#5B6472]/60"
              />
            </div>
            <div>
              <Label htmlFor="phone-field" className="text-sm text-[#5B6472]">
                Phone
              </Label>
              <Input
                id="phone-field"
                placeholder="Your best contact number"
                className="mt-2 bg-white border-[#E4E1D8] text-[#1F2937] placeholder:text-[#5B6472]/60"
              />
            </div>
            <div>
              <Label htmlFor="day" className="text-sm text-[#5B6472]">
                Preferred day
              </Label>
              <Input
                id="day"
                placeholder="e.g. Tuesday morning"
                className="mt-2 bg-white border-[#E4E1D8] text-[#1F2937] placeholder:text-[#5B6472]/60"
              />
            </div>
            <Button className="mt-2 bg-[#3E7C6F] text-[#F6F5F1] hover:bg-[#2F4A43] font-medium transition-all duration-300 w-fit px-8 rounded-full">
              Request an appointment
            </Button>
          </form>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#F6F5F1] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E4E1D8]">
        <span className="font-elegant font-medium text-base text-[#1F2937]">
          {businessName}
        </span>
        <span className="text-sm text-[#5B6472]">{formattedAddress}</span>
      </footer>
    </div>
  )
}

