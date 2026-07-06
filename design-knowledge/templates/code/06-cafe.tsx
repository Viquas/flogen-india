import { MapPin, Phone, Star, Quote } from "lucide-react"

export default function GeneratedPage() {
  const businessName = "Fernback Coffee"
  const suburb = "Erskineville"
  const phone = "(02) 9557 3391"
  const telHref = "tel:0295573391"
  const formattedAddress = "58 Swanson Street, Erskineville NSW 2043"
  const directionsHref =
    "https://www.google.com/maps/search/?api=1&query=58+Swanson+Street+Erskineville+NSW+2043"
  const rating = "4.9"
  const userRatingCount = "512"

  const heroPhoto =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1600"

  const scrollPhotos = [
    {
      src: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=900",
      caption: "LATTE ART, DAILY",
      h: "h-[320px]",
    },
    {
      src: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=900",
      caption: "SMASHED AVO",
      h: "h-[400px]",
    },
    {
      src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=900",
      caption: "THE CORNER TABLE",
      h: "h-[280px]",
    },
    {
      src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=900",
      caption: "BATCH BREW, ON TAP",
      h: "h-[380px]",
    },
    {
      src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=900",
      caption: "SUNDAY CROWD",
      h: "h-[300px]",
    },
  ]

  const favourites = [
    {
      name: "Smashed avo",
      description: "Sourdough, whipped feta, chilli oil, lemon",
      price: "16",
      coffee: false,
    },
    {
      name: "Big breakfast",
      description: "Eggs your way, bacon, mushroom, hash brown",
      price: "24",
      coffee: false,
    },
    {
      name: "Ricotta hotcakes",
      description: "Honeycomb butter, seasonal fruit, maple",
      price: "19",
      coffee: false,
    },
    {
      name: "Single-origin batch brew",
      description: "Rotating filter, roasted up the road",
      price: "5.5",
      coffee: true,
    },
  ]

  const review = {
    text: "I've tried every café within walking distance and Fernback is the only one that gets my flat white right every single time. It's basically my second kitchen at this point.",
    name: "Priya",
    since: "2021",
  }

  return (
    <div className="bg-[#FFFDF9] font-sans">
      {/* 1. Nav */}
      <nav className="px-6 md:px-10 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-heading font-medium text-xl tracking-[-0.02em] text-[#292524]">
          {businessName}
        </span>
        <div className="flex items-center gap-5">
          <span className="hidden sm:inline text-sm text-[#78716C]">
            Open from 6:30am · 7 days
          </span>
          <a
            href={directionsHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#C65D3B] hover:text-[#a94a2c] transition-all duration-300"
          >
            <MapPin className="size-4" />
            Directions
          </a>
        </div>
      </nav>

      {/* 2. Hero — oversized type with photo underlap */}
      <section className="px-6 md:px-10 pt-8 md:pt-12 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="relative z-10">
            <h1 className="font-heading font-medium text-[clamp(3rem,9vw,7.5rem)] tracking-[-0.045em] leading-[0.92] text-[#292524]">
              Flat whites done
              <br />
              properly since{" "}
              <span className="relative inline-block">
                day one.
                <svg
                  className="absolute left-0 -bottom-2 w-full h-3"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9 Q 50 2, 100 7 T 198 5"
                    fill="none"
                    stroke="#C65D3B"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-[#F6F1E8] rounded-full pl-3 pr-4 py-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-[#C65D3B] text-[#C65D3B]" />
                  ))}
                </div>
                <span className="text-sm text-[#78716C]">
                  {rating} · {userRatingCount} Google reviews
                </span>
              </div>
              <span className="text-sm text-[#78716C]">{suburb}, Sydney</span>
            </div>
          </div>

          <div className="relative -mt-10 md:-mt-16 z-0">
            <img
              src={heroPhoto}
              alt={`Barista pouring latte art at ${businessName} in ${suburb}`}
              className="w-full h-[360px] md:h-[560px] object-cover rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* 3. Photo scroll */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-[0.25em] text-[#C65D3B] mb-8">
            THE FEED, IN PERSON
          </p>
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 -mx-6 px-6 md:mx-0 md:px-0">
            {scrollPhotos.map((photo) => (
              <div
                key={photo.caption}
                className="shrink-0 w-[220px] md:w-[280px] snap-start flex flex-col gap-3"
              >
                <img
                  src={photo.src}
                  alt={`${photo.caption.toLowerCase()} at ${businessName}`}
                  className={`w-full ${photo.h} object-cover rounded-2xl`}
                />
                <span className="font-mono text-xs tracking-[0.15em] text-[#78716C]">
                  {photo.caption}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Menu favourites */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-[#F6F1E8]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#292524] mb-16 max-w-xl">
            What to order.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {favourites.map((item) =>
              item.coffee ? (
                <div
                  key={item.name}
                  className="bg-[#C65D3B] rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    <h3 className="text-xl font-medium text-[#FFFDF9]">{item.name}</h3>
                    <p className="mt-2 text-base text-[#FFFDF9]/85">{item.description}</p>
                  </div>
                  <p className="mt-6 text-lg text-[#FFFDF9] flex items-center gap-1">
                    <span className="text-[#FFFDF9]">•</span> {item.price}
                  </p>
                </div>
              ) : (
                <div
                  key={item.name}
                  className="bg-[#FFFDF9] rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    <h3 className="text-xl font-medium text-[#292524]">{item.name}</h3>
                    <p className="mt-2 text-base text-[#78716C]">{item.description}</p>
                  </div>
                  <p className="mt-6 text-lg text-[#292524] flex items-center gap-1">
                    <span className="text-[#C65D3B]">•</span> {item.price}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* 5. Hours + location band (roasted) */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-[#292524]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-7">
            <h2 className="font-heading font-medium text-[clamp(2.5rem,5vw,4.5rem)] tracking-[-0.03em] leading-[1.05] text-[#FFFDF9]">
              Open early.
              <br />
              Every day.
            </h2>
            <a
              href={directionsHref}
              className="mt-8 inline-flex items-center gap-2 text-base text-[#A8A29E] hover:text-[#FFFDF9] transition-all duration-300"
            >
              <MapPin className="size-4 text-[#C65D3B]" />
              {formattedAddress}
            </a>
          </div>
          <div className="md:col-span-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-4 border-b border-[#44403C]">
                <span className="text-base text-[#A8A29E]">Mon – Fri</span>
                <span className="text-base text-[#FFFDF9]">6:30am – 3:00pm</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-[#44403C]">
                <span className="text-base text-[#A8A29E]">Sat – Sun</span>
                <span className="text-base text-[#FFFDF9]">7:00am – 2:00pm</span>
              </div>
              <p className="text-xs text-[#A8A29E]">Typical hours — call to confirm on public holidays.</p>
              <a
                href={telHref}
                className="mt-2 inline-flex items-center gap-2 text-base text-[#FFFDF9] hover:text-[#C65D3B] transition-all duration-300"
              >
                <Phone className="size-4 text-[#C65D3B]" />
                {phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Review pull */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="size-10 text-[#C65D3B] mx-auto mb-6" />
          <p className="font-heading font-medium text-[clamp(1.75rem,3.5vw,2.75rem)] tracking-[-0.02em] leading-[1.15] text-[#292524]">
            {review.text}
          </p>
          <p className="mt-8 text-base text-[#78716C]">
            — {review.name}, regular since {review.since}
          </p>
        </div>
      </section>

      {/* 7. Visit CTA */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-[#F6F1E8]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading font-medium text-[clamp(2.5rem,5.5vw,4rem)] tracking-[-0.03em] leading-[1.05] text-[#292524]">
            Find us.
          </h2>
          <p className="mt-6 text-lg text-[#78716C]">{formattedAddress}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <a
              href={directionsHref}
              className="inline-flex items-center gap-2 bg-[#C65D3B] text-[#FFFDF9] text-sm font-medium px-8 py-4 rounded-full transition-all duration-300 hover:bg-[#a94a2c] hover:scale-105"
            >
              <MapPin className="size-4" />
              Get directions
            </a>
            <a
              href={telHref}
              className="text-base text-[#78716C] hover:text-[#292524] transition-all duration-300"
            >
              {phone}
            </a>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#EDE6D8]">
        <span className="font-heading font-medium text-base text-[#292524]">{businessName}</span>
        <span className="text-sm text-[#78716C]">{formattedAddress}</span>
      </footer>
    </div>
  )
}
