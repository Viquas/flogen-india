import { Phone, Star, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function GeneratedPage() {
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

      {/* 2. Hero — oversized type, maximum aggression */}
      <section className="relative bg-[#F7F7F4] overflow-hidden">
        <div className="px-6 md:px-10 pt-16 md:pt-24 pb-10 max-w-7xl mx-auto relative">
          <h1 className="font-heading font-medium text-[clamp(3.5rem,10vw,8.5rem)] tracking-[-0.05em] leading-[0.88] uppercase text-[#121212] relative z-10">
            Train.
            <br />
            <span className="text-[#FF4D24]">Harder.</span>
            <br />
            <span className="relative inline-block">
              Here.
              <span className="hidden md:block absolute top-1/2 -translate-y-1/2 left-[55%] w-[55vw] max-w-[900px] h-[220px] -z-10">
                <img
                  src={heroPhoto}
                  alt="Athlete gripping a loaded barbell on an industrial gym floor in Alexandria"
                  className="w-full h-full object-cover rounded-sm"
                  style={{
                    maskImage: "linear-gradient(to right, transparent, black 25%)",
                    WebkitMaskImage: "linear-gradient(to right, transparent, black 25%)",
                  }}
                />
              </span>
            </span>
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

          <div className="md:hidden mt-8 -mx-6">
            <img
              src={heroPhoto}
              alt="Athlete gripping a loaded barbell on an industrial gym floor in Alexandria"
              className="w-full h-[260px] object-cover"
            />
          </div>
        </div>
        <div className="w-full h-1.5 bg-[#FF4D24]" />
      </section>

      {/* 3. Results stat band (ink) */}
      <section className="bg-[#121212] px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <p className="font-heading font-medium text-[clamp(3rem,7vw,5.5rem)] tracking-[-0.03em] leading-none text-[#FF4D24]">
              {rating}★
            </p>
            <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88]">
              Rated by lifters training here
            </p>
          </div>
          <div>
            <p className="font-heading font-medium text-[clamp(3rem,7vw,5.5rem)] tracking-[-0.03em] leading-none text-[#FF4D24]">
              {userRatingCount}+
            </p>
            <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#8F8F88]">
              Members&apos; reviews on record
            </p>
          </div>
          <div>
            <p className="font-heading font-medium text-[clamp(3rem,7vw,5.5rem)] tracking-[-0.03em] leading-none text-[#FF4D24]">
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
                      className="w-full h-[320px] md:h-[420px] object-cover rounded-sm transition-all duration-300 hover:scale-[1.02]"
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

      {/* 5. Coach note — oversized quote */}
      <section className="bg-[#F7F7F4] px-6 md:px-10 py-24 md:py-32 border-t border-[#121212]/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-heading text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.02em] leading-[1.1] text-[#121212]">
            &ldquo;Show up. We&apos;ll handle the rest.&rdquo;
          </p>
          <p className="mt-8 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
            — The coaching team
          </p>
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
                className="w-full h-[320px] md:h-[420px] object-cover rounded-sm"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
                {floorPhotos[0].caption}
              </p>
            </div>
            <div className="md:col-span-5 md:-mt-10">
              <img
                src={floorPhotos[1].src}
                alt={floorPhotos[1].alt}
                className="w-full h-[320px] md:h-[480px] object-cover rounded-sm"
              />
              <p className="mt-4 font-tech text-xs tracking-[0.2em] uppercase text-[#565650]">
                {floorPhotos[1].caption}
              </p>
            </div>
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
      <footer className="bg-[#F7F7F4] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#121212]/10">
        <span className="font-heading font-medium text-sm tracking-[-0.02em] uppercase text-[#121212]">
          {businessName}
        </span>
        <span className="text-sm text-[#565650]">{formattedAddress}</span>
      </footer>
    </div>
  )
}
