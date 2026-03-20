/**
 * Industry → Image ID Registry
 *
 * Maps industries to verified Unsplash photo IDs and industry-specific
 * Pexels fallback IDs. Used by the generator to inject the correct images
 * into prompts, removing the AI's freedom to pick wrong categories or
 * hallucinate IDs.
 *
 * IMPORTANT: All IDs here must be manually verified to load correctly.
 * Unsplash format: https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&q=80&w=1200
 * Pexels format:   https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=1200
 */

export interface IndustryImageSet {
  /** Unsplash photo IDs (without "photo-" prefix) for primary src */
  unsplash: string[]
  /** Pexels photo IDs for onError fallback (industry-matched, NOT generic workspace) */
  pexelsFallback: string[]
}

export const INDUSTRY_IMAGES: Record<string, IndustryImageSet> = {
  'beauty-salon': {
    unsplash: [
      '1487412720507-e7ab37603c6f', // woman portrait beauty
      '1516975080664-ed2fc6a32937', // salon chairs
      '1470259078422-826894b933aa', // woman with styled hair
      '1562322140-8baeececf3df', // hair coloring process
      '1595476108010-b4d1f102b1b1', // salon mirror station
      '1559599101-f09722fb4948', // beauty treatment
      '1457972851104-4fd469440bf9', // haircut in progress
      '1522335789203-aabd1fc54bc9', // beauty styling
      '1633681926022-84c23e8cb2d6', // salon interior
    ],
    pexelsFallback: ['3993449', '3738355', '3997989'],
  },
  'restaurant': {
    unsplash: [
      '1504674900247-0877df9cc836', // plated food
      '1414235077428-338989a2e8c0', // restaurant interior
      '1565299624946-b28f40a0ae38', // pizza
      '1517248135467-4c7edcad34c4', // fine dining restaurant
      '1555396273-367ea4eb4db5', // chef cooking
      '1466978913421-dad2ebd01d17', // food spread
      '1476224203421-9ac39bcb3327', // beautiful dish
      '1544025162-d76694265947', // coffee and pastry
      '1559339352-11d035aa65de', // restaurant table setting
      '1424847651672-bf20a4b0982b', // food photography
    ],
    pexelsFallback: ['1640777', '67468', '262978'],
  },
  'fitness': {
    unsplash: [
      '1517836357463-d25dfeac3438', // weight training
      '1518611012118-696072aa579a', // group fitness
      '1574680096145-d05b474e2155', // stretching
      '1571019613576-2b22c76fd955', // gym workout
      '1605497788044-5a32c7078486', // yoga
      '1558981806-ec527fa84c39', // fitness training
      '1590439471364-192aa70c0b53', // running outdoors
    ],
    pexelsFallback: ['841130', '1552242', '1954524'],
  },
  'technology': {
    unsplash: [
      '1518770660439-4636190af475', // laptop workspace
      '1461749280684-dccba630e2f6', // code on screen
      '1498050108023-c5249f4df085', // tech workspace
      '1519389950473-47ba0277781c', // office tech
      '1504639725590-34d0984388bd', // programming
      '1550751827-4bd374c3f58b', // data center
      '1558494949-ef010cbdcc31', // circuit board
      '1535223289827-42f1e9919769', // tech abstract
    ],
    pexelsFallback: ['546819', '1181298', '3861969'],
  },
  'healthcare': {
    unsplash: [
      '1576091160399-112ba8d25d1d', // medical professional
      '1559839734-2b71ea197ec2', // stethoscope
      '1631815589968-fdb09a223b1e', // healthcare setting
      '1579684385127-1ef15d508118', // medical consultation
      '1551190822-a9ec456efb94', // hospital hallway
      '1538108149393-fbbd81895907', // doctor with patient
      '1559757175-5700dde675bc', // medical equipment
    ],
    pexelsFallback: ['263402', '4386467', '3259629'],
  },
  'dental': {
    unsplash: [
      '1606811841689-23dfddce3e95', // dental office
      '1588776814546-1ffcf47267a5', // bright smile
      '1445527815795-3b3bf5bfe792', // smile close-up
      '1598256989800-fe5f95da9787', // dental tools
      '1609840114035-3c981b782dfe', // dental chair
      '1629909613654-28e377c37b09', // dental examination
    ],
    pexelsFallback: ['3845810', '3845653', '3779706'],
  },
  'real-estate': {
    unsplash: [
      '1560518883-ce09059eeffa', // modern house exterior
      '1512917774080-9991f1c4c750', // luxury home
      '1582407947304-d5a4b9e8e595', // apartment building
      '1600596542815-ffad4c1539a9', // house interior
      '1600585154340-be6161a56a0c', // modern living room
      '1560448204-e02f11c3d0e2', // kitchen
      '1564013799919-ab600027ffc6', // residential neighborhood
      '1600607687939-ce8a6c25118c', // real estate exterior
    ],
    pexelsFallback: ['106399', '1396122', '323780'],
  },
  'auto': {
    unsplash: [
      '1492144534655-ae79c964c9d7', // sports car
      '1503376780353-7e6692767b70', // car detail
      '1507136566006-cfc505b114fc', // car detailing
      '1494976388531-d1058494cdd8', // engine detail
      '1558981806-ec527fa84c39', // auto service
    ],
    pexelsFallback: ['3354648', '3807517', '4480505'],
  },
  'legal': {
    unsplash: [
      '1589829545856-d10d557cf95f', // law books
      '1507679799987-c73779587ccf', // professional handshake
      '1521791055366-0d553872125f', // business meeting
      '1567401893414-76b7b1e5a7a5', // professional office
    ],
    pexelsFallback: ['5668858', '5668473', '5669619'],
  },
  'education': {
    unsplash: [
      '1523050854058-8df90110c9f1', // students studying
      '1434030216411-0b3acf1bc645', // library
      '1503676260728-1c00da094a0b', // classroom
      '1524178232363-1fb2b075b655', // university building
      '1427504350979-f2cac7de03b8', // notebook and pen
      '1509062522246-3755977927d7', // learning environment
    ],
    pexelsFallback: ['256395', '1370296', '5427868'],
  },
  'spa': {
    unsplash: [
      '1544161515-4ab6ce6db874', // spa candles
      '1600334089648-b0d9d3028eb2', // spa stones
      '1507652313519-d4e9174996dd', // spa treatment room
      '1515377905703-c4788e51af15', // relaxation
      '1596178065887-1198b6148b2b', // spa products
    ],
    pexelsFallback: ['3188', '3757952', '3757942'],
  },
  'retail': {
    unsplash: [
      '1441986300917-64674bd600d8', // retail store
      '1472851294608-062f824d29cc', // shopping bags
      '1567401893414-76b7b1e5a7a5', // retail display
      '1528698827591-e19cef791fa2', // shop window
    ],
    pexelsFallback: ['1488463', '1005638', '3965545'],
  },
  'pet': {
    unsplash: [
      '1548199973-03cce0bbc87b', // dog portrait
      '1587300003388-59208cc962cb', // cat close-up
      '1601758228041-f3b2795255f1', // dog grooming
      '1415369629372-26f2fe60c467', // dogs playing
      '1450778869180-41d0601e0e36', // cat lounging
      '1583337130417-3346a1be7dee', // pet clinic
    ],
    pexelsFallback: ['1108099', '45201', '6131007'],
  },
  'general-business': {
    unsplash: [
      '1497366216548-37526070297c', // office space
      '1522202176988-66273c7fd55a', // business meeting
      '1600880292203-757bb62b4baf', // professional team
      '1556761175-4b46a572b786', // startup office
      '1542744173-8e7e91415657', // business handshake
      '1553877522-43269d4ea984', // modern office
    ],
    pexelsFallback: ['3184291', '3184339', '3184465'],
  },
}

/**
 * Industry name aliases — maps common industry strings to registry keys.
 */
const INDUSTRY_ALIASES: Record<string, string> = {
  // Beauty
  'hair salon': 'beauty-salon', 'salon': 'beauty-salon', 'beauty': 'beauty-salon',
  'barber': 'beauty-salon', 'barbershop': 'beauty-salon', 'hair': 'beauty-salon',
  'beauty salon': 'beauty-salon', 'nail salon': 'beauty-salon', 'lash studio': 'beauty-salon',
  // Food
  'restaurant': 'restaurant', 'cafe': 'restaurant', 'bakery': 'restaurant',
  'food': 'restaurant', 'dining': 'restaurant', 'bar': 'restaurant', 'pizzeria': 'restaurant',
  'coffee shop': 'restaurant', 'catering': 'restaurant',
  // Fitness
  'gym': 'fitness', 'fitness': 'fitness', 'yoga': 'fitness', 'pilates': 'fitness',
  'personal training': 'fitness', 'crossfit': 'fitness', 'martial arts': 'fitness',
  // Tech
  'technology': 'technology', 'tech': 'technology', 'software': 'technology',
  'it': 'technology', 'saas': 'technology', 'startup': 'technology',
  // Healthcare
  'healthcare': 'healthcare', 'medical': 'healthcare', 'clinic': 'healthcare',
  'hospital': 'healthcare', 'pharmacy': 'healthcare', 'health': 'healthcare',
  // Dental
  'dental': 'dental', 'dentist': 'dental', 'orthodontist': 'dental',
  // Real estate
  'real estate': 'real-estate', 'property': 'real-estate', 'realty': 'real-estate',
  'realtor': 'real-estate', 'housing': 'real-estate',
  // Auto
  'auto': 'auto', 'automotive': 'auto', 'car': 'auto', 'mechanic': 'auto',
  'auto repair': 'auto', 'car wash': 'auto', 'car detailing': 'auto',
  // Legal
  'legal': 'legal', 'law': 'legal', 'attorney': 'legal', 'lawyer': 'legal',
  // Education
  'education': 'education', 'tutoring': 'education', 'school': 'education',
  'training': 'education', 'academy': 'education',
  // Spa
  'spa': 'spa', 'wellness': 'spa', 'massage': 'spa', 'skincare': 'spa',
  // Retail
  'retail': 'retail', 'shop': 'retail', 'store': 'retail', 'boutique': 'retail',
  'shopping': 'retail', 'ecommerce': 'retail',
  // Pet
  'pet': 'pet', 'veterinary': 'pet', 'vet': 'pet', 'pet grooming': 'pet',
  'dog': 'pet', 'animal': 'pet',
}

/**
 * Get image set for an industry. Falls back to general-business if no match.
 */
export function getImagesForIndustry(industry: string | null | undefined): IndustryImageSet {
  if (!industry) return INDUSTRY_IMAGES['general-business']

  const normalized = industry.toLowerCase().trim()

  // Direct key match
  if (INDUSTRY_IMAGES[normalized]) return INDUSTRY_IMAGES[normalized]

  // Alias match
  if (INDUSTRY_ALIASES[normalized]) return INDUSTRY_IMAGES[INDUSTRY_ALIASES[normalized]]

  // Partial match — check if any alias is a substring of the industry
  for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return INDUSTRY_IMAGES[key]
    }
  }

  return INDUSTRY_IMAGES['general-business']
}

/**
 * Format image IDs for injection into an AI prompt.
 * Returns a block of text listing all Unsplash IDs and the Pexels fallback URL.
 */
export function formatImageIdsForPrompt(industry: string | null | undefined): string {
  const images = getImagesForIndustry(industry)
  const unsplashIds = images.unsplash.join(' | ')
  const pexelsFallbackUrl = `https://images.pexels.com/photos/${images.pexelsFallback[0]}/pexels-photo-${images.pexelsFallback[0]}.jpeg?auto=compress&cs=tinysrgb&w=1200`

  return `## IMAGES FOR THIS INDUSTRY (USE ONLY THESE):
Unsplash IDs: ${unsplashIds}
onError fallback URL: ${pexelsFallbackUrl}

Use these Unsplash IDs for ALL images: \`https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&q=80&w=1200\`
For onError, use ONLY this industry-specific fallback: \`${pexelsFallbackUrl}\`
NEVER use the generic workspace fallback (pexels-photo-3183150). NEVER invent Unsplash IDs.`
}
