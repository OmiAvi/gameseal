import { APP_NAME } from '#/lib/config'
import type { MomentCardData } from '#/lib/moment-card'

function createDemoPhoto({
  title,
  accent,
  glow,
  location,
}: {
  title: string
  accent: string
  glow: string
  location: string
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#06131f" />
          <stop offset="50%" stop-color="${accent}" />
          <stop offset="100%" stop-color="#05070b" />
        </linearGradient>
        <radialGradient id="lights" cx="50%" cy="12%" r="60%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.95" />
          <stop offset="70%" stop-color="${glow}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="1600" fill="url(#bg)" />
      <rect width="1200" height="1600" fill="url(#lights)" />
      <path d="M0 1080C160 980 320 900 540 915c220 15 335 95 660 40v645H0Z" fill="#081018" />
      <path d="M80 1160c170-94 312-130 502-114 180 14 334 89 536 24v530H80Z" fill="#112334" />
      <g opacity="0.85">
        <circle cx="255" cy="335" r="22" fill="#fff7d4" />
        <circle cx="395" cy="305" r="15" fill="#fff7d4" />
        <circle cx="810" cy="285" r="18" fill="#fff7d4" />
        <circle cx="950" cy="330" r="26" fill="#fff7d4" />
      </g>
      <rect x="135" y="220" width="930" height="60" rx="30" fill="#0a1520" fill-opacity="0.6" stroke="rgba(255,255,255,0.2)" />
      <text x="600" y="258" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="32" fill="#f8fafc" letter-spacing="10">${APP_NAME.toUpperCase()}</text>
      <text x="140" y="1325" font-family="Space Grotesk, sans-serif" font-size="96" font-weight="700" fill="#ffffff">${title}</text>
      <text x="142" y="1392" font-family="Space Grotesk, sans-serif" font-size="38" fill="#d7e3f0">${location}</text>
      <text x="140" y="1485" font-family="Space Grotesk, sans-serif" font-size="28" fill="#eef2ff" letter-spacing="8">SEALED MOMENT PREVIEW</text>
      <rect x="120" y="100" width="960" height="1400" rx="56" fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="4" />
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const demoMomentCards: MomentCardData[] = [
  {
    id: 'moment-demo-001',
    variant: 'base',
    momentId: 'GS-001',
    venue: 'Harbor Dome',
    matchup: 'Comets vs Lions',
    dateLabel: 'Jun 18, 2026',
    finalScore: '108-101',
    memoryRatingLabel: '9.2 Memory',
    hypeLabel: 'Hype A',
    rarity: 'Base Run',
    title: 'Opening Night Warm Glow',
    seatInfo: 'Section 112 • Row F • Seat 9',
    story:
      'The first night the new slab system felt real. Arena lights hit the lens just before tip, and the whole bowl looked like it was buzzing inside the card already.',
    gameDetails: [
      'Comets closed on a 14-4 run.',
      'Fourth-quarter swing began with a corner three at 2:11.',
      'First public mint candidate from the Harbor Dome set.',
    ],
    companions: ['Maya on aisle callouts', 'Jules on stat checks'],
    tags: ['opening-night', 'arena-lights', 'first-drop'],
    collectionBadges: ['Harbor Dome Series', 'Launch Season'],
    photoSrc: createDemoPhoto({
      title: 'Opening Night',
      accent: '#0f766e',
      glow: '#fde68a',
      location: 'Harbor Dome',
    }),
  },
  {
    id: 'moment-demo-002',
    variant: 'rivalry',
    momentId: 'GS-014',
    venue: 'Northline Arena',
    matchup: 'Kings vs Owls',
    dateLabel: 'Nov 22, 2026',
    finalScore: '96-94',
    memoryRatingLabel: '9.6 Memory',
    hypeLabel: 'Hype S',
    rarity: 'Rivalry Print',
    title: 'Cross-Town Silence',
    seatInfo: 'Lower Bowl • Row C • Seat 14',
    story:
      'Every possession felt personal. The winning baseline jumper dropped and the crowd shifted from roar to stunned silence in a single breath.',
    gameDetails: [
      'Deciding bucket came with 0:04 remaining.',
      'Defensive stop sealed the final possession.',
      'Second meeting of the season between the city rivals.',
    ],
    companions: ['Niko on camera timing', 'Ari recording crowd audio'],
    tags: ['rivalry', 'road-noise', 'late-bucket'],
    collectionBadges: ['City Clash', 'Heat Check'],
    photoSrc: createDemoPhoto({
      title: 'Cross-Town',
      accent: '#7f1d1d',
      glow: '#fb7185',
      location: 'Northline Arena',
    }),
  },
  {
    id: 'moment-demo-003',
    variant: 'playoff',
    momentId: 'GS-033',
    venue: 'Summit Center',
    matchup: 'Blaze vs Tide',
    dateLabel: 'May 09, 2026',
    finalScore: '117-110',
    memoryRatingLabel: '9.8 Memory',
    hypeLabel: 'Hype S+',
    rarity: 'Playoff Press',
    title: 'Whiteout Quarter',
    seatInfo: 'Section 101 • Row A • Seat 1',
    story:
      'The entire lower bowl was in white, flags waving before every inbound. By the time the star guard hit the step-back three, the place felt like a pressure chamber.',
    gameDetails: [
      'Series tied 2-2 after the final buzzer.',
      'Home team scored 39 in the third quarter.',
      'One of the loudest crowd clips from the postseason vault.',
    ],
    companions: ['Kira on lens swaps'],
    tags: ['playoff', 'whiteout', 'stepback'],
    collectionBadges: ['Postseason', 'Pressure Moments'],
    photoSrc: createDemoPhoto({
      title: 'Whiteout',
      accent: '#1d4ed8',
      glow: '#bfdbfe',
      location: 'Summit Center',
    }),
  },
  {
    id: 'moment-demo-004',
    variant: 'road-game',
    momentId: 'GS-041',
    venue: 'Iron District Pavilion',
    matchup: 'Voyagers vs Rails',
    dateLabel: 'Jan 14, 2026',
    finalScore: '88-84',
    memoryRatingLabel: '8.9 Memory',
    hypeLabel: 'Hype A-',
    rarity: 'Road Stamp',
    title: 'Hostile Floor Win',
    seatInfo: 'Visitor Tunnel • Row L • Seat 2',
    story:
      'A road crowd never gives you any free space. The photo landed with just enough tunnel light to make the visiting colors feel earned instead of polished.',
    gameDetails: [
      'Visitors trailed by 11 early in the second half.',
      'Bench unit changed the game with transition defense.',
      'Captured from the visitor-side tunnel section.',
    ],
    companions: ['Tess on transit sprint'],
    tags: ['road-game', 'tunnel-shot', 'comeback'],
    collectionBadges: ['Away Days'],
    photoSrc: createDemoPhoto({
      title: 'Hostile Floor',
      accent: '#0f172a',
      glow: '#67e8f9',
      location: 'Iron District Pavilion',
    }),
  },
  {
    id: 'moment-demo-005',
    variant: 'first-venue',
    momentId: 'GS-052',
    venue: 'Crescent Fieldhouse',
    matchup: 'Falcons vs Arrows',
    dateLabel: 'Feb 03, 2026',
    finalScore: '102-99',
    memoryRatingLabel: '9.0 Memory',
    hypeLabel: 'Hype B+',
    rarity: 'Passport Cut',
    title: 'First Look at Crescent',
    seatInfo: 'Club End • Row H • Seat 18',
    story:
      'New venue energy changes how every photo feels. I wanted one card that remembered the first walk-in view before the building became familiar.',
    gameDetails: [
      'First visit to Crescent Fieldhouse.',
      'Golden-hour concourse light carried into player intros.',
      'Saved as the start of a new venue streak.',
    ],
    companions: ['Dad on seat scouting'],
    tags: ['first-venue', 'new-arena', 'travel-day'],
    collectionBadges: ['Venue Passport'],
    photoSrc: createDemoPhoto({
      title: 'First Look',
      accent: '#713f12',
      glow: '#f59e0b',
      location: 'Crescent Fieldhouse',
    }),
  },
  {
    id: 'moment-demo-006',
    variant: 'overtime',
    momentId: 'GS-067',
    venue: 'Metro Hall',
    matchup: 'Jets vs Monarchs',
    dateLabel: 'Mar 27, 2026',
    finalScore: '121-118 OT',
    memoryRatingLabel: '9.4 Memory',
    hypeLabel: 'Hype S',
    rarity: 'Extra Frame',
    title: 'Bonus Basketball Glow',
    seatInfo: 'Section 116 • Row J • Seat 5',
    story:
      'Overtime always feels like borrowed time. The extra five minutes gave the whole image this electric, impossible feeling that only shows up after everyone thought it was over.',
    gameDetails: [
      'Game tied on a putback with 0:02 left in regulation.',
      'Overtime decided by a steal and breakaway finish.',
      'Highest combined score in the Metro Hall set.',
    ],
    companions: ['Zee on final possession notes', 'Rae on extra battery pack'],
    tags: ['overtime', 'extra-frame', 'late-steal'],
    collectionBadges: ['Overtime Club', 'Clutch Time'],
    photoSrc: createDemoPhoto({
      title: 'Bonus Time',
      accent: '#581c87',
      glow: '#c084fc',
      location: 'Metro Hall',
    }),
  },
  {
    id: 'moment-demo-007',
    variant: 'walkoff',
    momentId: 'GS-074',
    venue: 'Pier Park',
    matchup: 'Caps vs Anchors',
    dateLabel: 'Jul 19, 2026',
    finalScore: '5-4',
    memoryRatingLabel: '9.7 Memory',
    hypeLabel: 'Hype S+',
    rarity: 'Walkoff Foil',
    title: 'Ninth-Inning Launch',
    seatInfo: 'Third Base Line • Row N • Seat 21',
    story:
      'The swing connected and the whole row leaned forward before the ball even cleared the wall. It felt cinematic in person and somehow even more dramatic sealed under the slab glare.',
    gameDetails: [
      'Two-run walkoff in the bottom of the ninth.',
      'Ball exited at dead-center left.',
      'First baseball card treatment in the demo line.',
    ],
    companions: ['Leo on scorebook tracking'],
    tags: ['walkoff', 'baseball-night', 'ninth-inning'],
    collectionBadges: ['Bat Crack'],
    photoSrc: createDemoPhoto({
      title: 'Walkoff',
      accent: '#14532d',
      glow: '#86efac',
      location: 'Pier Park',
    }),
  },
  {
    id: 'moment-demo-008',
    variant: 'buzzer-beater',
    momentId: 'GS-081',
    venue: 'Eastline Forum',
    matchup: 'Stars vs Waves',
    dateLabel: 'Dec 02, 2026',
    finalScore: '92-90',
    memoryRatingLabel: '9.9 Memory',
    hypeLabel: 'Hype SS',
    rarity: 'Zero-Point-One',
    title: 'Glass Before Red Light',
    seatInfo: 'Corner 3 • Row D • Seat 3',
    story:
      'The release beat the light by a blink. You can almost hear the horn in the still frame, which is exactly the kind of memory a collectible card should preserve.',
    gameDetails: [
      'Winning shot banked in at the horn.',
      'Review confirmed the release before red light.',
      'Most requested variant in early user testing.',
    ],
    companions: ['Elle on instant replay', 'Dev on crowd reaction clip'],
    tags: ['buzzer-beater', 'bank-shot', 'instant-classic'],
    collectionBadges: ['Red Light', 'Closing Time'],
    photoSrc: createDemoPhoto({
      title: 'At the Horn',
      accent: '#9a3412',
      glow: '#fdba74',
      location: 'Eastline Forum',
    }),
  },
  {
    id: 'moment-demo-009',
    variant: 'legendary',
    momentId: 'GS-099',
    venue: 'Crown Arena',
    matchup: 'Giants vs Meteors',
    dateLabel: 'Apr 30, 2026',
    finalScore: '124-120',
    memoryRatingLabel: '10.0 Memory',
    hypeLabel: 'Hype Mythic',
    rarity: 'Legend Grade',
    title: 'Banner Night Forever',
    seatInfo: 'Center Court Club • Row A • Seat 6',
    story:
      'This is the kind of moment fans talk about years later without needing a recap. The card needed to feel archival, almost ceremonial, while still staying live and interactive.',
    gameDetails: [
      'Retired-number ceremony before tip-off.',
      'Star finished with a 41-point triple-double.',
      'Designed as the flagship legendary slab example.',
    ],
    companions: ['Whole crew on full capture mode'],
    tags: ['legendary', 'banner-night', 'all-timer'],
    collectionBadges: ['Hall Set', 'Founders Cut', 'Premium Slab'],
    photoSrc: createDemoPhoto({
      title: 'Banner Night',
      accent: '#78350f',
      glow: '#fef08a',
      location: 'Crown Arena',
    }),
  },
]

export const featuredMomentCard = demoMomentCards[0]

export const draftMomentCard: MomentCardData = {
  ...demoMomentCards[2],
  id: 'moment-draft-001',
  momentId: 'DRAFT-01',
  title: 'Draft slab preview',
  rarity: 'Draft Layout',
  story:
    'Use this live slab preview while composing metadata, checking crop, and tuning the story before the final mint.',
  collectionBadges: ['Mint Preview'],
}
