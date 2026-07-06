import { Phone, Star, MapPin, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function GeneratedPage() {
  const businessName = "Ember & Salt"
  const suburb = "Woollahra"
  const phone = "(02) 9327 6614"
  const telHref = "tel:0293276614"
  const formattedAddress = "212 Queen Street, Woollahra NSW 2025"
  const rating = "4.8"
  const userRatingCount = "364"

  const heroPhoto =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600"

  const storyPhoto =
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200"

  const galleryPhotos = [
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200",
  ]

  const menu = [
    {
      label: "TO START",
      items: [
        { name: "Wood-fired flatbread, whipped cod roe", price: "$14" },
        { name: "Kingfish crudo, finger lime, olive oil", price: "$24" },
        { name: "Charred broccolini, almond, chilli", price: "$18" },
      ],
    },
    {
      label: "MAINS",
      items: [
        { name: "Half chicken, embers, salsa verde", price: "$36" },
        { name: "Dry-aged porterhouse, bone marrow butter", price: "$58" },
        { name: "Market fish, burnt lemon, fennel", price: "$42" },
        { name: "Wood-oven mushroom risotto, pecorino", price: "$32" },
      ],
    },
    {
      label: "DESSERT",
      items: [
        { name: "Burnt honey tart, crème fraîche", price: "$16" },
        { name: "Affogato, hazelnut praline", price: "$14" },
      ],
    },
  ]

  const reviews = [
    { text: "Booked for a birthday and it turned into our new regular spot. The porterhouse is criminal.", name: "Georgia" },
    { text: "Every dish tastes like it's come straight off the coals. Service is warm, not fussy.", name: "Marcus" },
    { text: "Best wood-fired cooking east of the city, full stop. The flatbread alone is worth the drive.", name: "Priya" },
    { text: "Candlelit, loud in the best way, and the wine list actually matches the food.", name: "Tom" },
  ]

  return (
    <div className="bg-[#191512] font-sans">
      {/* 1. Nav */}
      <nav className="absolute top-0 left-0 right-0 z-30 px-6 md:px-10 py-6 flex items-center justify-between">
        <span className="font-elegant font-medium text-xl tracking-[-0.01em] text-[#F5EFE6]">
          {businessName}
        </span>
        <div className="flex items-center gap-5">
          <a
            href={telHref}
            className="hidden sm:inline text-sm text-[#B8AB9B] hover:text-[#F5EFE6] transition-all duration-300"
          >
            {phone}
          </a>
          <a
            href="#book"
            className="inline-flex items-center gap-2 border border-[#D97C2B] text-[#D97C2B] text-sm font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-[#D97C2B] hover:text-[#191512] hover:scale-105"
          >
            Book a table
          </a>
        </div>
      </nav>

      {/* 2. Hero — full bleed */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
        <img
          src={heroPhoto}
          alt={`Candlelit dining room at ${businessName} with wood-fired grill glowing in the background`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191512] via-[#191512]/50 to-[#191512]/10" />
        <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-16 md:pb-24 max-w-6xl mx-auto">
          <h1 className="font-elegant font-medium text-[clamp(3rem,8vw,7rem)] tracking-[-0.02em] leading-[0.98] text-[#F5EFE6] max-w-3xl">
            Wood-fired.
            <br />
            {suburb} born.
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-[#221D18] border border-[#352C24] rounded-full pl-3 pr-4 py-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-[#D97C2B] text-[#D97C2B]" />
                ))}
              </div>
              <span className="text-sm text-[#B8AB9B]">
                {rating} · {userRatingCount} Google reviews
              </span>
            </div>
            <span className="flex items-center gap-2 text-sm text-[#B8AB9B]">
              <MapPin className="size-4 text-[#D97C2B]" />
              {formattedAddress}
            </span>
          </div>
        </div>
      </section>

      {/* 3. The menu — cream paper, centrepiece */}
      <section className="bg-[#F5EFE6] px-6 md:px-10 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs tracking-[0.25em] text-[#D97C2B] mb-4">
            MENU HIGHLIGHTS
          </p>
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#191512] mb-16 max-w-xl">
            Come hungry. Leave planning your next visit.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-14">
            {menu.map((section) => (
              <div key={section.label} className={section.label === "MAINS" ? "md:row-span-2" : ""}>
                <p className="font-mono text-xs tracking-[0.25em] text-[#D97C2B] mb-6">
                  {section.label}
                </p>
                <div className="flex flex-col gap-6">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-baseline gap-3">
                      <span className="font-elegant text-xl md:text-2xl text-[#191512] whitespace-nowrap">
                        {item.name}
                      </span>
                      <span className="flex-1 border-b border-dotted border-[#57504A]/40 translate-y-[-4px]" />
                      <span className="font-mono text-lg text-[#D97C2B] whitespace-nowrap">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-16 text-sm text-[#57504A] max-w-md">
            A sample of what's coming off the grill this season — the full menu changes with what's good at the markets.
          </p>
        </div>
      </section>

      {/* 4. Story — split */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 max-w-6xl mx-auto items-center">
          <div className="md:col-span-5">
            <img
              src={storyPhoto}
              alt={`Chef tending the wood-fired grill at ${businessName}`}
              className="w-full h-[420px] md:h-[520px] object-cover rounded-2xl -rotate-1"
            />
          </div>
          <div className="md:col-span-7">
            <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#F5EFE6]">
              A room built around the fire.
            </h2>
            <p className="mt-8 font-elegant italic text-2xl md:text-3xl leading-snug text-[#D97C2B] max-w-lg">
              We'd rather feed you than impress you.
            </p>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-[#B8AB9B] max-w-lg">
              {businessName} runs on one wood-fired oven, a short list of
              suppliers we actually trust, and a dining room that stays
              lively past ten. No tasting menus, no tweezers — just
              proper cooking, plated simply, for a table of two or twelve.
            </p>
            <p className="mt-8 flex items-center gap-2 text-sm text-[#B8AB9B]">
              <MapPin className="size-4 text-[#D97C2B]" />
              {formattedAddress}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Review marquee */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="px-6 md:px-10 max-w-6xl mx-auto mb-12 flex items-end justify-between">
          <h2 className="font-elegant font-medium text-[clamp(2rem,4vw,3.5rem)] tracking-[-0.03em] leading-[1.05] text-[#F5EFE6]">
            What the tables are saying.
          </h2>
          <span className="hidden sm:block text-sm text-[#B8AB9B]">
            {userRatingCount} Google reviews
          </span>
        </div>

        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
        <div className="flex w-max" style={{ animation: "marquee 40s linear infinite" }}>
          {[...reviews, ...reviews].map((review, i) => (
            <div
              key={i}
              className="w-[360px] shrink-0 mx-4 bg-[#221D18] border border-[#352C24] rounded-2xl p-8"
            >
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="size-3.5 fill-[#D97C2B] text-[#D97C2B]" />
                ))}
              </div>
              <Quote className="size-6 text-[#D97C2B] mb-3" />
              <p className="text-base leading-relaxed text-[#F5EFE6]">
                {review.text}
              </p>
              <p className="mt-4 text-sm text-[#B8AB9B]">— {review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Gallery strip */}
      <section className="px-6 md:px-10 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-end">
          <img
            src={galleryPhotos[0]}
            alt={`Wood-fired dish plated at ${businessName}`}
            className="w-full h-[320px] object-cover rounded-2xl"
          />
          <img
            src={galleryPhotos[1]}
            alt={`Dining room detail at ${businessName}`}
            className="w-full h-[400px] object-cover rounded-2xl -mt-8"
          />
          <img
            src={galleryPhotos[2]}
            alt={`Dessert course at ${businessName}`}
            className="w-full h-[320px] object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* 7. Reservation CTA */}
      <section id="book" className="px-6 md:px-10 py-24 md:py-32 bg-[#221D18] border-t border-[#352C24]">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-elegant font-medium text-[clamp(2.5rem,5.5vw,4rem)] tracking-[-0.02em] leading-[1.05] text-[#F5EFE6]">
            Your table's waiting.
          </h2>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#B8AB9B]">
            <a href={telHref} className="inline-flex items-center gap-2 hover:text-[#F5EFE6] transition-all duration-300">
              <Phone className="size-4 text-[#D97C2B]" />
              {phone}
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-[#D97C2B]" />
              {formattedAddress}
            </span>
          </p>
        </div>

        <form className="max-w-2xl mx-auto bg-[#F5EFE6] rounded-3xl p-8 md:p-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="name" className="text-sm text-[#57504A]">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Your full name"
              className="mt-2 bg-white border-[#57504A]/20 text-[#191512] placeholder:text-[#57504A]/60"
            />
          </div>
          <div>
            <Label htmlFor="contact" className="text-sm text-[#57504A]">
              Phone or email
            </Label>
            <Input
              id="contact"
              placeholder="Best way to reach you"
              className="mt-2 bg-white border-[#57504A]/20 text-[#191512] placeholder:text-[#57504A]/60"
            />
          </div>
          <div>
            <Label htmlFor="date" className="text-sm text-[#57504A]">
              Date
            </Label>
            <Input
              id="date"
              placeholder="e.g. Saturday 12 July"
              className="mt-2 bg-white border-[#57504A]/20 text-[#191512] placeholder:text-[#57504A]/60"
            />
          </div>
          <div>
            <Label htmlFor="guests" className="text-sm text-[#57504A]">
              Guests
            </Label>
            <Input
              id="guests"
              placeholder="Number of people"
              className="mt-2 bg-white border-[#57504A]/20 text-[#191512] placeholder:text-[#57504A]/60"
            />
          </div>
          <Button className="sm:col-span-2 mt-2 bg-[#D97C2B] text-[#191512] hover:bg-[#c46f26] font-medium transition-all duration-300 w-fit px-8 rounded-full mx-auto">
            Request a table
          </Button>
        </form>
      </section>

      {/* 8. Footer */}
      <footer className="bg-[#191512] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#352C24]">
        <span className="font-elegant font-medium text-base text-[#F5EFE6]">
          {businessName}
        </span>
        <span className="text-sm text-[#B8AB9B]">{formattedAddress}</span>
        <a href={telHref} className="text-sm text-[#B8AB9B] hover:text-[#F5EFE6] transition-all duration-300">
          {phone}
        </a>
      </footer>
    </div>
  )
}
