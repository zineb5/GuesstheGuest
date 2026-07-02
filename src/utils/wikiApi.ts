import axios from 'axios'

export interface WikiResult {
  title: string
  canonicalName?: string
  aliases?: string[]
  description: string
  imageUrl?: string
  extract?: string
  pageUrl?: string
  facts?: WikiFacts
  source?: 'wikipedia' | 'fandom'
}

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|a|an|from|in|of|tv|series|film|movie|version)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Common first names and surnames that cause false partial matches across many people
const COMMON_NAME_BLOCKLIST = new Set([
  'john', 'jane', 'james', 'robert', 'michael', 'william', 'david', 'richard',
  'joseph', 'thomas', 'charles', 'daniel', 'matthew', 'anthony', 'mark', 'donald',
  'steven', 'paul', 'andrew', 'kenneth', 'joshua', 'kevin', 'brian', 'george',
  'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary',
  'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'gregory', 'frank', 'alexander', 'raymond', 'patrick',
  'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam', 'nathan', 'henry',
  'douglas', 'zachary', 'peter', 'kyle', 'walter', 'ethan', 'jeremy', 'harold',
  'keith', 'christian', 'roger', 'noah', 'gerald', 'carl', 'terry', 'sean',
  'austin', 'arthur', 'lawrence', 'jesse', 'dylan', 'bryan', 'joe', 'jordan',
  'billy', 'bruce', 'albert', 'willie', 'gabriel', 'logan', 'alan', 'juan',
  'wayne', 'roy', 'ralph', 'randy', 'eugene', 'vincent', 'russell', 'elijah',
  'louis', 'bobby', 'philip', 'mary', 'patricia', 'jennifer', 'linda', 'elizabeth',
  'barbara', 'susan', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty',
  'margaret', 'sandra', 'ashley', 'kimberly', 'emily', 'donna', 'michelle',
  'dorothy', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca',
  'laura', 'sharon', 'cynthia', 'kathleen', 'amy', 'shirley', 'angela', 'helen',
  'anna', 'brenda', 'pamela', 'nicole', 'emma', 'samantha', 'katherine',
  'christine', 'debra', 'rachel', 'catherine', 'carolyn', 'janet', 'ruth',
  'maria', 'heather', 'diane', 'virginia', 'julie', 'joyce', 'victoria',
  'olivia', 'kelly', 'christina', 'lauren', 'joan', 'evelyn', 'judith',
  'megan', 'cheryl', 'andrea', 'hannah', 'martha', 'jacqueline', 'frances',
  'gloria', 'ann', 'teresa', 'kathryn', 'sara', 'janice', 'jean', 'alice',
  'madison', 'doris', 'abigail', 'julia', 'judy', 'grace', 'denise', 'amber',
  'marilyn', 'beverly', 'danielle', 'theresa', 'sophia', 'marie', 'diana',
  'brittany', 'natalie', 'isabella', 'charlotte', 'rose', 'alexis', 'kayla',
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller',
  'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez',
  'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin',
  'lee', 'perez', 'thompson', 'white', 'harris', 'sanchez', 'clark',
  'ramirez', 'lewis', 'robinson', 'walker', 'young', 'allen', 'king',
  'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores', 'green',
  'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell', 'mitchell',
  'carter', 'roberts', 'gomez', 'phillips', 'evans', 'turner', 'diaz',
  'parker', 'cruz', 'edwards', 'collins', 'reyes', 'stewart', 'morris',
  'morales', 'murphy', 'cook', 'rogers', 'gutierrez', 'ortiz', 'morgan',
  'cooper', 'peterson', 'bailey', 'reed', 'kelly', 'howard', 'ramos',
  'kim', 'cox', 'ward', 'richardson', 'watson', 'brooks', 'chavez',
  'wood', 'james', 'bennett', 'gray', 'mendoza', 'ruiz', 'hughes',
  'price', 'alvarez', 'castillo', 'sanders', 'patel', 'myers', 'long',
  'ross', 'foster', 'jimenez', 'powell', 'jenkins', 'perry', 'russell',
  'sullivan', 'bell', 'coleman', 'butler', 'henderson', 'barnes',
  'gonzales', 'fisher', 'vasquez', 'simmons', 'romero', 'jordan',
  'patterson', 'alexander', 'hamilton', 'graham', 'reynolds', 'griffin',
  'wallace', 'moreno', 'west', 'cole', 'hayes', 'bryant', 'herrera',
  'gibson', 'ellis', 'tran', 'medina', 'aguilar', 'stanley', 'daniels',
  'munoz', 'hicks', 'hunt', 'crawford', 'henry', 'boyd', 'mason',
  'moran', 'kennedy', 'dunn', 'navarro', 'spencer', 'stephens', 'berry',
  'payne', 'pierce', 'george', 'bradley', 'goodman', 'burns', 'hardy',
  'shaw', 'fleming', 'ford', 'stone', 'holland', 'woods', 'weaver',
  'davidson', 'fuller', 'andrews', 'ryan', 'holmes', 'rice', 'hudson',
  'webb', 'gordon', 'dean', 'wells', 'little', 'newman', 'palmer',
  'willis', 'bishop', 'boyle', 'mccarthy', 'lucas', 'carr', 'watkins',
  'hart', 'brady', 'elliott', 'chambers', 'norton', 'mccoy', 'gross',
  'soto', 'flynn', 'osborne', 'cobb', 'stokes', 'clayton', 'massey',
  'lamb', 'potts', 'mckinney', 'frost', 'benton', 'hahn', 'haley',
  'brennan', 'huff', 'bird', 'downs', 'vance', 'mcbride', 'macdonald',
  'callahan', 'dougherty', 'blackwell', 'mckee', 'barry', 'mcconnell',
  'mcguire', 'oneill', 'mcleod', 'merritt', 'mcintosh', 'mclean',
  'mcmahon', 'mcfadden', 'mckenna', 'mcnally', 'mccabe', 'mccann',
  'mccarty', 'mccall', 'mccray', 'mccormick', 'mccullough', 'mccauley',
])

export function generateAliases(title: string, description = '', extract = '', extraAliases: string[] = []): string[] {
  const aliases = new Set<string>()
  const add = (value?: string) => {
    const clean = value?.trim()
    if (clean && clean.length > 1 && !COMMON_NAME_BLOCKLIST.has(clean.toLowerCase())) {
      aliases.add(clean)
    }
  }

  add(title)
  add(title.replace(/\([^)]*\)/g, '').trim())

  const alsoKnownMatch = extract.match(/also known as ([^,.]+)/i)
  if (alsoKnownMatch) {
    alsoKnownMatch[1].split(/\bor\b|\/|;/i).forEach(add)
  }

  const aliasMatch = extract.match(/alias ([^,.]+)/i)
  if (aliasMatch) add(aliasMatch[1])

  const fullNameMatch = extract.match(/^([^,.]+),/)
  if (fullNameMatch) add(fullNameMatch[1])

  if (/fictional character|character in/i.test(`${description} ${extract}`)) {
    add(title.replace(/\s*\([^)]*\)/g, '').trim())
  }

  // Add name-order variants and parts for multi-word names
  const words = title.replace(/\([^)]*\)/g, '').trim().split(/\s+/)
  if (words.length >= 2) {
    add(words.join(' '))
    add([...words].reverse().join(' '))
    words.forEach(add)
    // Add "First Last" and "Last First" without parenthetical qualifiers
    add(words.slice(0, 2).join(' '))
    add([words[0], words[words.length - 1]].join(' '))
  }

  // Extra aliases from infobox / nicknames
  extraAliases.forEach(add)

  return Array.from(aliases)
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
    }
  }
  return matrix[b.length][a.length]
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  const dist = levenshtein(a, b)
  return 1 - dist / Math.max(a.length, b.length)
}

export function matchAlias(guess: string, aliases: string[]): 'exact' | 'partial' | 'none' {
  const normalizedGuess = normalizeName(guess)
  const normalizedAliases = aliases.map(normalizeName).filter(Boolean)

  if (!normalizedGuess || normalizedAliases.length === 0) return 'none'

  // Exact match, including fuzzy exact (small typos)
  const fuzzyExact = normalizedAliases.some(alias => {
    if (alias === normalizedGuess) return true
    if (Math.abs(alias.length - normalizedGuess.length) > 3) return false
    return similarity(alias, normalizedGuess) >= 0.85
  })
  if (fuzzyExact) return 'exact'

  // Partial substring match
  const partial = normalizedAliases.some((alias) => {
    if (normalizedGuess.length < 3 || alias.length < 3) return false
    return alias.includes(normalizedGuess) || normalizedGuess.includes(alias)
  })

  return partial ? 'partial' : 'none'
}

export interface InfoboxData {
  name?: string
  image?: string
  alias?: string
  aliases?: string
  nicknames?: string
  hair?: string
  hairColor?: string
  eye?: string
  eyeColor?: string
  skin?: string
  skinColor?: string
  species?: string
  race?: string
  gender?: string
  sex?: string
  age?: string
  height?: string
  weight?: string
  status?: string
  birthDate?: string
  birthPlace?: string
  birthplace?: string
  nationality?: string
  language?: string
  languages?: string
  affiliation?: string
  affiliations?: string
  occupation?: string
  occupations?: string
  team?: string
  school?: string
  universe?: string
  franchise?: string
  series?: string
  debut?: string
  appearsIn?: string
  [key: string]: string | undefined
}

export interface WikiFacts {
  alive?: boolean
  gender?: string
  occupations: string[]
  nationalities: string[]
  birthPlace?: string
  isFictional?: boolean
  infobox?: InfoboxData
}

export interface FactSuggestion {
  answer: 'Yes' | 'No' | 'Unknown'
  reason: string
}

const nationalityAliases: Record<string, string[]> = {
  american: ['american', 'united states', 'u.s.', 'usa'],
  british: ['british', 'united kingdom', 'english', 'scottish', 'welsh'],
  canadian: ['canadian', 'canada'],
  french: ['french', 'france'],
  german: ['german', 'germany'],
  south_african: ['south african', 'south africa'],
  moroccan: ['moroccan', 'morocco'],
  spanish: ['spanish', 'spain'],
  italian: ['italian', 'italy'],
  japanese: ['japanese', 'japan'],
  chinese: ['chinese', 'china'],
  indian: ['indian', 'india'],
  brazilian: ['brazilian', 'brazil'],
  mexican: ['mexican', 'mexico'],
  russian: ['russian', 'russia'],
  korean: ['korean', 'korea'],
  australian: ['australian', 'australia'],
  argentinian: ['argentinian', 'argentina'],
  turkish: ['turkish', 'turkey'],
  egyptian: ['egyptian', 'egypt'],
  greek: ['greek', 'greece'],
  swedish: ['swedish', 'sweden'],
  norwegian: ['norwegian', 'norway'],
  dutch: ['dutch', 'netherlands'],
  polish: ['polish', 'poland'],
  portuguese: ['portuguese', 'portugal'],
  irish: ['irish', 'ireland'],
  scottish: ['scottish', 'scotland'],
  welsh: ['welsh', 'wales'],
  austrian: ['austrian', 'austria'],
  belgian: ['belgian', 'belgium'],
  danish: ['danish', 'denmark'],
  finnish: ['finnish', 'finland'],
  hungarian: ['hungarian', 'hungary'],
  indonesian: ['indonesian', 'indonesia'],
  malaysian: ['malaysian', 'malaysia'],
  pakistani: ['pakistani', 'pakistan'],
  philippine: ['philippine', 'philippines'],
  swiss: ['swiss', 'switzerland'],
  thai: ['thai', 'thailand'],
  ukrainian: ['ukrainian', 'ukraine'],
  vietnamese: ['vietnamese', 'vietnam'],
  colombian: ['colombian', 'colombia'],
  nigerian: ['nigerian', 'nigeria'],
  southkorean: ['south korean', 'south korea'],
  northkorean: ['north korean', 'north korea'],
}

/* â”€â”€ Axios setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const WIKI_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary'
const WIKI_ACTION_API  = 'https://en.wikipedia.org/w/api.php'

const axiosWiki = axios.create({
  headers: {
    'Accept': 'application/json',
  },
  timeout: 8000,
})

/* â”€â”€ LLM fallback (Gemini) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const llmCache = new Map<string, FactSuggestion>()

function buildLLMPrompt(question: string, referenceExtract: string, infobox?: InfoboxData): string {
  return `You are a fact-checking assistant for a guessing game.
Answer ONLY Yes, No, or Unknown.
Prefer the reference text and infobox below when they contain the answer.
If they do not contain enough information, you may use your general knowledge about well-known public figures and fictional characters.
If the answer is still unclear, subjective, or not reliably knowable, say Unknown.

Reference text:
${referenceExtract || 'No reference extract available.'}

Infobox:
${infobox ? JSON.stringify(infobox, null, 2) : 'No infobox available.'}

Question: ${question}
Answer (Yes / No / Unknown):`
}

function parseLLMResponse(text: string): 'Yes' | 'No' | 'Unknown' {
  const normalized = text.trim().toLowerCase()
  if (normalized.startsWith('yes')) return 'Yes'
  if (normalized.startsWith('no')) return 'No'
  return 'Unknown'
}

function hashText(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return String(hash)
}

export async function askLLM(
  question: string,
  referenceExtract: string,
  infobox?: InfoboxData
): Promise<FactSuggestion | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  const model = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-1.5-flash'

  if (!apiKey) return null

  const cacheKey = `${question}|${hashText(referenceExtract)}|${hashText(JSON.stringify(infobox || {}))}`
  const cached = llmCache.get(cacheKey)
  if (cached) return cached

  try {
    const prompt = buildLLMPrompt(question, referenceExtract, infobox)
    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 20,
        },
      },
      { timeout: 6000, headers: { 'Content-Type': 'application/json' } }
    )

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const answer = parseLLMResponse(outputText)
    const suggestion: FactSuggestion = {
      answer,
      reason: answer === 'Unknown'
        ? 'The AI assistant could not determine a clear answer from the reference.'
        : `AI assistant suggests ${answer} based on the reference.`,
    }

    llmCache.set(cacheKey, suggestion)
    return suggestion
  } catch (err) {
    console.warn('LLM fallback failed:', err)
    return null
  }
}

/** Fix protocol-relative URLs (//example.com â†’ https://example.com) */
function fixUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('//')) return 'https:' + url
  return url
}

/* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function looksLikePerson(result: { title: string; description?: string; extract?: string; source?: string }) {
  const text = `${result.title} ${result.description || ''} ${result.extract || ''}`.toLowerCase()
  const personSignals = [
    'born', 'actor', 'actress', 'singer', 'player', 'politician', 'scientist', 'writer',
    'artist', 'inventor', 'entrepreneur', 'fictional character', 'character', 'king',
    'queen', 'president', 'footballer', 'musician', 'director', 'rapper', 'comedian',
    'historian', 'philosopher', 'mathematician'
  ]
  const nonPersonSignals = [
    'city', 'country', 'building', 'river', 'mountain', 'company', 'album', 'song',
    'film series', 'species', 'animal', 'concept', 'theory', 'event', 'organization',
    'football club', 'video game', 'novel', 'television series'
  ]

  const hasPersonSignal    = personSignals.some(signal => text.includes(signal))
  const hasNonPersonSignal = nonPersonSignals.some(signal => text.includes(signal))
  const isClearlyCharacter = text.includes('fictional character') || text.includes('character in')
  const isClearlyPerson    = text.includes('born') || text.includes(' is a ') || text.includes(' is an ') || text.includes(' was a ') || text.includes(' was an ')
  const isFandomCharacterPage = result.source === 'fandom' && !hasNonPersonSignal

  return (hasPersonSignal && (isClearlyPerson || !hasNonPersonSignal || isClearlyCharacter)) || isFandomCharacterPage
}

async function fetchWikipediaResult(title: string): Promise<WikiResult | null> {
  try {
    const { data: summary } = await axiosWiki.get(
      `${WIKI_SUMMARY_URL}/${encodeURIComponent(title)}`,
      { timeout: 5000 }
    )
    if (summary.type === 'disambiguation') return null

    const result: WikiResult = {
      title: summary.title || title,
      canonicalName: summary.title || title,
      aliases: generateAliases(summary.title || title, summary.description || '', summary.extract || ''),
      description: summary.description || '',
      imageUrl: fixUrl(summary.thumbnail?.source),
      extract: summary.extract || '',
      pageUrl: summary.content_urls?.desktop?.page,
      facts: buildFacts(summary.description || '', summary.extract || ''),
      source: 'wikipedia',
    }

    return looksLikePerson(result) ? result : null
  } catch {
    return null
  }
}

/** Simple concurrency limiter to avoid rate-limiting Wikipedia */
async function pLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = []
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const current = index++
      results[current] = await tasks[current]()
    }
  }

  const workers = Array.from({ length: limit }, () => worker())
  await Promise.all(workers)
  return results
}

/* â”€â”€ Fandom infobox helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

async function fetchFandomWikitext(wiki: string, title: string): Promise<string | null> {
  try {
    const actionApi = `https://${wiki}.fandom.com/api.php`
    const { data } = await axiosWiki.get(actionApi, {
      params: {
        action: 'parse',
        page: title,
        prop: 'wikitext',
        format: 'json',
        origin: '*',
      },
      timeout: 5000,
    })
    return data.parse?.wikitext?.['*'] || null
  } catch {
    return null
  }
}

async function fetchWikipediaWikitext(title: string): Promise<string | null> {
  try {
    const { data } = await axiosWiki.get(WIKI_ACTION_API, {
      params: {
        action: 'parse',
        page: title,
        prop: 'wikitext',
        format: 'json',
        origin: '*',
      },
      timeout: 5000,
    })
    return data.parse?.wikitext?.['*'] || null
  } catch {
    return null
  }
}

export async function fetchWikipediaInfobox(title: string): Promise<InfoboxData | undefined> {
  const wikitext = await fetchWikipediaWikitext(title)
  return wikitext ? parseInfobox(wikitext) : undefined
}

function cleanInfoboxValue(value: string): string {
  return value
    .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<ref[^>]*>.*?<\/ref>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/'{2,}/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .trim()
}

function normalizeInfoboxKey(key: string): string {
  const normalized = key.toLowerCase().trim().replace(/[\s_-]+/g, '')
  const aliases: Record<string, string> = {
    haircolor: 'hair',
    haircolour: 'hair',
    haicolor: 'hair',
    eyecolor: 'eye',
    eyecolour: 'eye',
    eyes: 'eye',
    skincolor: 'skin',
    'skin colour': 'skin',
    skintone: 'skin',
    race: 'species',
    sex: 'gender',
    height: 'height',
    age: 'age',
    weight: 'weight',
    status: 'status',
    birthdate: 'birthDate',
    dateofbirth: 'birthDate',
    born: 'birthDate',
    birthplace: 'birthPlace',
    placeofbirth: 'birthPlace',
    nationality: 'nationality',
    language: 'language',
    languages: 'language',
    affiliations: 'affiliation',
    occupations: 'occupation',
    team: 'team',
    school: 'school',
    universe: 'universe',
    franchise: 'universe',
    series: 'universe',
    fandom: 'universe',
    appearsin: 'appearsIn',
    debut: 'debut',
    firstappearance: 'debut',
    alias: 'aliases',
    aka: 'aliases',
    nicknames: 'nicknames',
    nickname: 'nicknames',
  }
  return aliases[normalized] || normalized
}

function findTemplate(wikitext: string, predicate: (name: string) => boolean): string | undefined {
  let depth = 0
  let start = -1
  let nameStart = -1
  let i = 0

  while (i < wikitext.length - 1) {
    if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
      if (depth === 0) {
        start = i
        nameStart = i + 2
      }
      depth++
      i += 2
      continue
    }

    if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
      if (depth > 0) {
        depth--
        if (depth === 0 && start !== -1) {
          const name = wikitext.slice(nameStart, wikitext.indexOf('|', nameStart) > -1 ? wikitext.indexOf('|', nameStart) : i).trim()
          if (predicate(name)) {
            const bodyStart = wikitext.indexOf('|', nameStart)
            if (bodyStart > -1 && bodyStart < i) {
              return wikitext.slice(bodyStart + 1, i)
            }
          }
          start = -1
          nameStart = -1
        }
      }
      i += 2
      continue
    }

    i++
  }

  return undefined
}

export async function fetchFandomInfobox(wiki: string, title: string): Promise<InfoboxData | undefined> {
  const wikitext = await fetchFandomWikitext(wiki, title)
  return wikitext ? parseInfobox(wikitext) : undefined
}

function parseInfobox(wikitext: string): InfoboxData | undefined {
  if (!wikitext) return undefined

  // Find a template whose name looks like an infobox / character template.
  const body = findTemplate(wikitext, (name) => {
    const lower = name.toLowerCase()
    return lower.includes('infobox')
      || lower.includes('character')
      || lower.includes('template')
      || lower.includes('database:')
  })

  if (!body) return undefined

  const entries: InfoboxData = {}

  // Split body into parameters, respecting nested {{...}}, [[...]], and newlines.
  const params: string[] = []
  let current = ''
  let templateDepth = 0
  let linkDepth = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    const next = body[i + 1]

    if (ch === '{' && next === '{') {
      templateDepth++
      current += ch
    } else if (ch === '}' && next === '}') {
      templateDepth--
      current += ch
    } else if (ch === '[' && next === '[') {
      linkDepth++
      current += ch
    } else if (ch === ']' && next === ']') {
      linkDepth--
      current += ch
    } else if (ch === '|' && templateDepth === 0 && linkDepth === 0) {
      params.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) params.push(current)

  for (const param of params) {
    const eqIndex = param.indexOf('=')
    if (eqIndex === -1) continue

    const rawKey = param.slice(0, eqIndex).trim()
    const rawValue = param.slice(eqIndex + 1).trim()

    const key = normalizeInfoboxKey(rawKey)
    const value = cleanInfoboxValue(rawValue)

    if (key && value) {
      entries[key] = value
    }
  }

  return Object.keys(entries).length > 0 ? entries : undefined
}

/* â”€â”€ Fandom (multi-wiki search) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// Major Fandom wikis that cover most popular fictional characters
const FANDOM_WIKIS = [
  'marvel', 'starwars', 'harrypotter', 'disney', 'dc', 'gameofthrones',
  'naruto', 'onepiece', 'pokemon', 'lordoftherings', 'minecraft', 'fortnite',
  'attackontitan', 'dragonball', 'bleach', 'hunterxhunter', 'demonslayer',
  'jujutsukaisen', 'myheroacademia', 'sao', 'fullmetal', 'deathnote',
  'simpsons', 'familyguy', 'rickandmorty', 'southpark', 'adventuretime',
  'spongebob', 'pixar', 'dreamworks', 'pixar', 'nintendo', 'zelda',
  'mario', 'sonic', 'fallout', 'elderscrolls', 'witcher', 'leagueoflegends',
  'valorant', 'overwatch', 'apexlegends', 'genshin-impact', 'honkai-star-rail',
  'residentevil', 'silenthill', 'metalgear', 'godofwar', 'uncharted',
  'lastofus', 'batman', 'superman', 'wonderwoman', 'flash', 'arrow',
  'strangerthings', 'squidgame', 'breakingbad', 'sherlock',
]

async function searchSingleFandomWiki(wiki: string, query: string): Promise<WikiResult[]> {
  const actionApi = `https://${wiki}.fandom.com/api.php`
  const restApi   = `https://${wiki}.fandom.com/api/rest_v1/page/summary`

  try {
    const { data } = await axiosWiki.get(actionApi, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query.trim(),
        format: 'json',
        origin: '*',
        srlimit: 5,
      },
      timeout: 6000,
    })

    const items = data.query?.search || []
    if (!items.length) return []

    const results = await pLimit(
      items.slice(0, 5).map((item: any) => async () => {
        let imageUrl: string | undefined
        let extract = ''
        let pageUrl: string | undefined
        let description = item.snippet.replace(/<[^>]*>/g, '')

        try {
          const { data: summary } = await axiosWiki.get(
            `${restApi}/${encodeURIComponent(item.title)}`,
            { timeout: 4000 }
          )
          imageUrl = fixUrl(summary.thumbnail?.source)
          extract = summary.extract || ''
          description = summary.description || description
          pageUrl = summary.content_urls?.desktop?.page
        } catch {
          // fallback to snippet-only
        }

        const result: WikiResult = {
          title: item.title,
          canonicalName: item.title,
          aliases: generateAliases(item.title, description, extract),
          description,
          imageUrl,
          extract,
          pageUrl: pageUrl || `https://${wiki}.fandom.com/wiki/${encodeURIComponent(item.title.replace(/\s/g, '_'))}`,
          facts: buildFacts(description, extract),
          source: 'fandom',
        }

        return looksLikePerson(result) ? result : null
      }),
      2
    )

    return results.filter((r): r is WikiResult => r !== null)
  } catch {
    return []
  }
}

async function searchFandom(query: string): Promise<WikiResult[]> {
  if (!query.trim()) return []

  // Pick a subset of wikis based on query hints, or search all
  const queryLower = query.toLowerCase()
  let wikisToSearch = FANDOM_WIKIS

  // Quick heuristic: if query hints at a specific universe, prioritize those wikis first
  const universeHints: Record<string, string[]> = {
    marvel: ['marvel', 'iron man', 'spider', 'thor', 'hulk', 'avengers', 'x-men', 'deadpool', 'wolverine'],
    starwars: ['star wars', 'jedi', 'sith', 'skywalker', 'yoda', 'vader', 'mandalorian'],
    harrypotter: ['harry potter', 'hogwarts', 'dumbledore', 'voldemort', 'snape', 'hermione'],
    disney: ['disney', 'mickey', 'elsa', 'moana', 'mulan', 'belle', 'ariel'],
    dc: ['dc', 'batman', 'superman', 'wonder woman', 'flash', 'joker', 'harley'],
    gameofthrones: ['game of thrones', 'got', 'stark', 'lannister', 'targaryen', 'dragon'],
    naruto: ['naruto', 'sasuke', 'sakura', 'kakashi', 'hinata', 'itachi'],
    onepiece: ['one piece', 'luffy', 'zoro', 'nami', 'sanji', 'shanks'],
    pokemon: ['pokemon', 'pikachu', 'charizard', 'ash', 'misty', 'brock'],
    lordoftherings: ['lotr', 'lord of the rings', 'gandalf', 'frodo', 'aragorn', 'legolas'],
    attackontitan: ['aot', 'attack on titan', 'eren', 'mikasa', 'levi', 'armin'],
    dragonball: ['dragon ball', 'goku', 'vegeta', 'bulma', 'piccolo', 'frieza'],
    bleach: ['bleach', 'ichigo', 'rukia', 'aizen', 'byakuya'],
    demonslayer: ['demon slayer', 'tanjiro', 'nezuko', 'zenitsu', 'inosuke'],
    jujutsukaisen: ['jujutsu', 'gojo', 'yuji', 'megumi', 'nobara'],
    myheroacademia: ['mha', 'my hero', 'deku', 'bakugo', 'todoroki', 'all might'],
    deathnote: ['death note', 'light', 'L', 'ryuk', 'misa'],
    simpsons: ['simpson', 'homer', 'bart', 'marge', 'lisa'],
    rickandmorty: ['rick', 'morty', 'pickle rick'],
    strangerthings: ['stranger things', 'eleven', 'hopper', 'dustin'],
    breakingbad: ['breaking bad', 'walter white', 'jesse', 'heisenberg'],
    witcher: ['witcher', 'geralt', 'ciri', 'yennefer'],
    leagueoflegends: ['lol', 'league of legends', 'jinx', 'yasuo', 'ahri'],
    genshin: ['genshin', 'paimon', 'zhongli', 'raiden', 'nahida'],
    zelda: ['zelda', 'link', 'ganon', 'hyrule'],
    mario: ['mario', 'luigi', 'peach', 'bowser', 'toad'],
    sonic: ['sonic', 'tails', 'knuckles', 'eggman'],
    fallout: ['fallout', 'vault', 'brotherhood', 'nuka'],
    elderscrolls: ['skyrim', 'elderscrolls', 'dragonborn', 'talos'],
    residentevil: ['resident evil', 'leon', 'jill', 'wesker', 'zombie'],
    godofwar: ['god of war', 'kratos', 'atreus', 'freya'],
    lastofus: ['last of us', 'ellie', 'joel', 'clicker'],
  }

  const hintedWikis = new Set<string>()
  for (const [wiki, hints] of Object.entries(universeHints)) {
    if (hints.some(h => queryLower.includes(h))) {
      hintedWikis.add(wiki)
    }
  }

  if (hintedWikis.size > 0) {
    // Search hinted wikis first, then a random sample of others
    const hinted = Array.from(hintedWikis)
    const others = FANDOM_WIKIS.filter(w => !hintedWikis.has(w))
    // Shuffle others and take up to 10 more to keep it fast
    const shuffled = others.sort(() => Math.random() - 0.5)
    wikisToSearch = [...hinted, ...shuffled.slice(0, 10)]
  } else {
    // No hints: search a random sample of 12 wikis to keep latency reasonable
    wikisToSearch = FANDOM_WIKIS.sort(() => Math.random() - 0.5).slice(0, 12)
  }

  const allResults = await pLimit(
    wikisToSearch.map(wiki => () => searchSingleFandomWiki(wiki, query)),
    3
  )

  const flat = allResults.flat()

  // Deduplicate by title
  const seen = new Set<string>()
  return flat.filter(r => {
    const key = r.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 8)
}

/* â”€â”€ Wikipedia search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function rankByTitleMatch(result: WikiResult, query: string): number {
  const q = query.toLowerCase()
  const t = result.title.toLowerCase()
  if (t === q) return 3
  if (t.startsWith(q)) return 2
  if (t.includes(q)) return 1
  return 0
}

export async function searchWikipedia(query: string, category?: string): Promise<WikiResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const normalizedQuery = trimmed.toLowerCase()
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)

  try {
    // 1. Exact title matches (case variants matter on Wikipedia).
    const exactPromises: Promise<WikiResult | null>[] = [
      fetchWikipediaResult(trimmed),
      fetchWikipediaResult(capitalized),
    ]
    if (category === 'Fictional Character') {
      exactPromises.push(fetchWikipediaResult(`${capitalized} (character)`))
    }
    const exactResults = (await Promise.all(exactPromises)).filter(Boolean) as WikiResult[]

    // 2. Title-only search for stronger relevance than full-text.
    const [titleSearchData, textSearchData] = await Promise.all([
      axiosWiki.get(WIKI_ACTION_API, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: `intitle:"${trimmed}"`,
          srwhat: 'title',
          format: 'json',
          origin: '*',
          srlimit: 10,
        },
        timeout: 8000,
      }),
      axiosWiki.get(WIKI_ACTION_API, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: trimmed,
          format: 'json',
          origin: '*',
          srlimit: 15,
        },
        timeout: 8000,
      }),
    ])

    const titleItems = titleSearchData.data.query?.search || []
    const textItems = textSearchData.data.query?.search || []

    // Merge title-first, then full-text, keeping order and deduplicating by title.
    const seenTitles = new Set<string>()
    const searchItems: any[] = []
    for (const item of [...titleItems, ...textItems]) {
      if (seenTitles.has(item.title)) continue
      seenTitles.add(item.title)
      searchItems.push(item)
    }

    if (searchItems.length === 0 && exactResults.length === 0) {
      return []
    }

    // Limit to 3 concurrent summary fetches to avoid rate limits
    const results = await pLimit(
      searchItems.slice(0, 15).map((item: any) => async () => {
        let imageUrl: string | undefined
        let extract = ''
        let pageUrl: string | undefined
        let facts: WikiFacts | undefined
        let description = item.snippet.replace(/<[^>]*>/g, '')

        try {
          const { data: summary } = await axiosWiki.get(
            `${WIKI_SUMMARY_URL}/${encodeURIComponent(item.title)}`,
            { timeout: 5000 }
          )
          imageUrl = fixUrl(summary.thumbnail?.source)
          extract = summary.extract || ''
          description = summary.description || description
          pageUrl = summary.content_urls?.desktop?.page
          facts = buildFacts(summary.description || '', summary.extract || '')
        } catch {
          imageUrl = undefined
        }

        return {
          title: item.title,
          canonicalName: item.title,
          aliases: generateAliases(item.title, description, extract),
          description,
          imageUrl,
          extract,
          pageUrl,
          facts,
          source: 'wikipedia' as const,
        }
      }),
      3
    )

    // Drop pages that have no description AND no extract — these are usually
    // low-quality full-text matches (redirects, disambiguation stubs, etc.).
    const withContent = (results as WikiResult[]).filter(
      (r) => r.description?.trim() || r.extract?.trim()
    )
    const filtered = withContent.filter(looksLikePerson)
    const fandomResults = await searchFandom(query)

    const isFictionalCategory = category === 'Fictional Character'

    const merged: WikiResult[] = [
      ...exactResults,
      ...filtered,
      ...fandomResults,
    ].filter((result: WikiResult, index, all: WikiResult[]) => {
      const key = `${result.title}-${result.source}`
      return all.findIndex(item => `${item.title}-${item.source}` === key) === index
    })

    // Rank by how closely the title matches the query, then by source preference.
    merged.sort((a, b) => {
      const rankA = rankByTitleMatch(a, trimmed)
      const rankB = rankByTitleMatch(b, trimmed)
      if (rankB !== rankA) return rankB - rankA

      if (isFictionalCategory) {
        if (a.source === 'fandom' && b.source !== 'fandom') return -1
        if (a.source !== 'fandom' && b.source === 'fandom') return 1
      }
      return 0
    })

    return merged.slice(0, 12)
  } catch (err) {
    console.error('Wiki search failed:', err)
    // Fallback to Fandom-only if Wikipedia fails completely
    return searchFandom(query)
  }
}

function buildFacts(description: string, extract: string): WikiFacts {
  const text = `${description} ${extract}`.toLowerCase()

  const knownOccupations = [
    'actor', 'actress', 'singer', 'musician', 'rapper', 'footballer', 'basketball player',
    'politician', 'entrepreneur', 'engineer', 'scientist', 'writer', 'author', 'director',
    'comedian', 'artist', 'inventor', 'philosopher', 'mathematician', 'astronaut', 'athlete',
    'broadcaster', 'businessman', 'businesswoman', 'chef', 'dancer', 'designer', 'doctor',
    'economist', 'filmmaker', 'journalist', 'judge', 'lawyer', 'military officer', 'model',
    'nurse', 'painter', 'photographer', 'physician', 'pilot', 'poet', 'producer', 'programmer',
    'psychologist', 'researcher', 'soldier', 'teacher', 'violinist', 'voice actor',
  ]
  const occupations = knownOccupations.filter(job => text.includes(job))

  const nationalities = Object.values(nationalityAliases)
    .map(aliases => aliases[0])
    .filter(alias => text.includes(alias))

  // Alive heuristic: explicit death signals override living signals
  const hasDeathSignal = /\bdied\b|\bpassed away\b|\bdeath\b|\bmurdered\b|\bkilled\b/.test(text)
    || /\(\d{4}\s*-\s*\d{4}\)/.test(text)
  const hasLifeSignal = /\bis alive\b|\bis living\b|\bis a \w+\b|\bis an \w+\b/.test(text)
    || /\bwas born\b/.test(text)

  let alive: boolean | undefined
  if (hasDeathSignal) alive = false
  else if (hasLifeSignal) alive = true

  // Gender detection: prefer explicit words, then pronouns
  let gender: string | undefined
  const explicitMale = /\bmale\b|\bman\b|\bboy\b/.test(text)
  const explicitFemale = /\bfemale\b|\bwoman\b|\bgirl\b/.test(text)
  if (explicitMale && !explicitFemale) gender = 'male'
  else if (explicitFemale && !explicitMale) gender = 'female'
  else {
    const malePronouns = /\b(he|his|him|himself)\b/.test(text)
    const femalePronouns = /\b(she|her|hers|herself)\b/.test(text)
    if (malePronouns && !femalePronouns) gender = 'male'
    else if (femalePronouns && !malePronouns) gender = 'female'
  }

  // Fictional-character detection: explicit signals, role signals, and context signals.
  const hasExplicitFictionSignal = /\b(fictional|fiction|make-believe)\b/.test(text)
  const hasCharacterRoleSignal = /\b(protagonist|deuteragonist|antagonist|main character|supporting character|title character|fictional character|character in)\b/.test(text)
  const hasFictionContextSignal = /\bcharacter\b/.test(text) && /\b(anime|manga|series|film|movie|show|cartoon|comic|video game|game|novel|book|franchise|universe)\b/.test(text)
  const isFictional = hasExplicitFictionSignal || hasCharacterRoleSignal || hasFictionContextSignal

  return {
    alive,
    gender,
    occupations,
    nationalities,
    isFictional,
  }
}

function isNegated(q: string): boolean {
  // Simple negation detection: "not", "n't", "isn't", "aren't", "doesn't", etc.
  return /\bnot\b|\bn['â€™]t\b|\bisnt\b|\baren't\b|\bdoesnt\b|\bdont\b|\bwont\b|\bnever\b/.test(q)
}

function flipIfNegated(answer: boolean, negated: boolean): boolean {
  return negated ? !answer : answer
}

const COMMON_COLORS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'brown', 'blonde', 'blond', 'gray', 'grey', 'silver', 'gold', 'aqua', 'cyan',
  'magenta', 'violet', 'indigo', 'turquoise', 'maroon', 'beige', 'crimson',
  'scarlet', 'emerald', 'sapphire', 'ruby', 'amber', 'jet-black', 'jet black',
  'light blue', 'dark blue', 'light brown', 'dark brown', 'dark green',
]

function splitInfoboxValues(value: string): string[] {
  return value
    .split(/\n|\r|\*|,|\/|;/)
    .map(s => s.replace(/^[-\sâ€¢]*/, '').trim())
    .filter(Boolean)
}

function isAmbiguousValue(value: string): boolean {
  const tokens = splitInfoboxValues(value)
  // Multiple distinct values often indicate a changing trait (e.g., "Black, Red" or "Male -> Female")
  if (tokens.length > 1) return true
  // Words like "sometimes", "varies", "depends", "cursed" hint at ambiguity
  return /\b(sometimes|varies|changes?|depends|cursed|transform|alternate|former|currently|originally)\b/i.test(value)
}

function matchInfoboxValue(question: string, value: string | undefined): { match: boolean; hasData: boolean; ambiguous?: boolean } {
  if (!value) return { match: false, hasData: false }
  const q = question.toLowerCase()
  const v = value.toLowerCase()
  const ambiguous = isAmbiguousValue(value)

  // Color-specific matching: if the question names a color and any infobox token
  // contains that color, it's a match.
  const askedColor = COMMON_COLORS.find(color => q.includes(color))
  if (askedColor) {
    const normalizedAsked = askedColor.replace(/[-\s]/g, '')
    const tokens = splitInfoboxValues(v)
    const colorMatch = tokens.some(token => {
      const normalizedToken = token.replace(/[-\s]/g, '')
      return normalizedToken.includes(normalizedAsked) || token.includes(askedColor)
    })
    return { match: colorMatch, hasData: true, ambiguous }
  }

  // Generic keyword matching over all tokens.
  const words = q.split(/[^a-z0-9]+/).filter(w => w.length > 2)
  const meaningful = words.filter(w => !['does', 'have', 'with', 'from', 'they', 'them', 'their', 'there', 'this', 'that', 'what', 'when', 'where', 'which', 'color', 'colour', 'like', 'look'].includes(w))
  if (meaningful.length === 0) return { match: false, hasData: true, ambiguous }
  const tokens = splitInfoboxValues(v)
  const matched = meaningful.some(w => tokens.some(token => token.includes(w)))
  return { match: matched, hasData: true, ambiguous }
}

function parseHeight(value: string): { cm?: number; ft?: number; inches?: number } | null {
  const text = value.toLowerCase()
  // e.g. "1.72 meters", "172 cm", "5'9\"", "5 ft 9 in"
  const cmMatch = text.match(/(\d+(?:\.\d+)?)\s*cm/)
  if (cmMatch) return { cm: parseFloat(cmMatch[1]) }

  const mMatch = text.match(/(\d+(?:\.\d+)?)\s*m(?:eter|eters)?\b/)
  if (mMatch) return { cm: parseFloat(mMatch[1]) * 100 }

  const ftInMatch = text.match(/(\d+)\s*['â€²]\s*(\d+)\s*["â€³]?/) || text.match(/(\d+)\s*ft\s*(\d+)\s*in/)
  if (ftInMatch) {
    const ft = parseInt(ftInMatch[1], 10)
    const inches = parseInt(ftInMatch[2], 10)
    return { ft, inches, cm: Math.round((ft * 12 + inches) * 2.54) }
  }

  return null
}

function suggestAnswerStructured(question: string, facts?: WikiFacts, referenceExtract = ''): FactSuggestion {
  if (!facts && !referenceExtract) {
    return { answer: 'Unknown', reason: 'No reference facts are available.' }
  }

  const q = question.toLowerCase()
  const ref = referenceExtract.toLowerCase()
  const negated = isNegated(q)
  const occupations = facts?.occupations || []
  const nationalities = facts?.nationalities || []
  const infobox = facts?.infobox

  // Real / fictional
  if (/\b(real|real person|actual person|fictional|made up|made-up|character)\b/.test(q) && facts?.isFictional !== undefined) {
    const asksReal = /\b(real|real person|actual person)\b/.test(q)
    const rawAnswer = asksReal ? !facts.isFictional : facts.isFictional
    const answer = flipIfNegated(rawAnswer, negated)
    return {
      answer: answer ? 'Yes' : 'No',
      reason: facts.isFictional
        ? 'Reference describes this target as a fictional character.'
        : 'Reference describes this target as a real person.',
    }
  }

  // Alive / dead (infobox status takes priority)
  if (/\b(alive|living|dead|deceased)\b/.test(q)) {
    let statusValue: boolean | undefined = facts?.alive
    if (infobox?.status) {
      const status = infobox.status.toLowerCase()
      if (/\b(dead|deceased|killed|died|passed away)\b/.test(status)) statusValue = false
      else if (/\b(alive|living|active)\b/.test(status)) statusValue = true
    }
    if (statusValue !== undefined) {
      const asksDead = /\b(dead|deceased|died)\b/.test(q)
      const rawAnswer = asksDead ? !statusValue : statusValue
      const answer = flipIfNegated(rawAnswer, negated)
      return { answer: answer ? 'Yes' : 'No', reason: statusValue ? 'Reference suggests the person is alive.' : 'Reference suggests the person is deceased.' }
    }
  }

  // Gender
  if (/\b(male|man|boy)\b/.test(q) && facts?.gender) {
    const rawAnswer = facts.gender === 'male'
    const answer = flipIfNegated(rawAnswer, negated)
    return { answer: answer ? 'Yes' : 'No', reason: `Reference suggests ${facts.gender}.` }
  }

  if (/\b(female|woman|girl)\b/.test(q) && facts?.gender) {
    const rawAnswer = facts.gender === 'female'
    const answer = flipIfNegated(rawAnswer, negated)
    return { answer: answer ? 'Yes' : 'No', reason: `Reference suggests ${facts.gender}.` }
  }

  // Nationality
  for (const aliases of Object.values(nationalityAliases)) {
    if (aliases.some(alias => q.includes(alias))) {
      const match = aliases.some(alias => nationalities.includes(alias) || ref.includes(alias))
      const answer = flipIfNegated(match, negated)
      return {
        answer: answer ? 'Yes' : 'No',
        reason: match ? `Reference mentions ${aliases[0]}.` : `Reference does not mention ${aliases[0]}.`,
      }
    }
  }

  // Occupation
  const askedOccupation = occupations.find(job => q.includes(job))
  if (askedOccupation) {
    const answer = flipIfNegated(true, negated)
    return { answer: answer ? 'Yes' : 'No', reason: `Reference mentions ${askedOccupation}.` }
  }

  const knownJobs = [
    'actor', 'actress', 'singer', 'musician', 'rapper', 'footballer', 'basketball player',
    'politician', 'entrepreneur', 'engineer', 'scientist', 'writer', 'author', 'director',
    'comedian', 'artist', 'inventor', 'astronaut', 'chef', 'dancer', 'doctor', 'lawyer',
    'nurse', 'painter', 'photographer', 'producer', 'teacher', 'voice actor',
  ]
  const askedKnownJob = knownJobs.find(job => q.includes(job))
  if (askedKnownJob && occupations.length > 0) {
    const answer = flipIfNegated(false, negated)
    return { answer: answer ? 'Yes' : 'No', reason: `Reference mentions ${occupations.join(', ')}, not ${askedKnownJob}.` }
  }

  // â”€â”€ Infobox-based answerers (Fandom characters) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (infobox) {
    // Helper to build a Yes/No/Unknown response from an infobox value.
    const answerFromValue = (fieldValue: string | undefined, fieldLabel: string): FactSuggestion | null => {
      if (!fieldValue) return null
      const { match, hasData, ambiguous } = matchInfoboxValue(q, fieldValue)
      if (!hasData) return null
      if (ambiguous && match) {
        return {
          answer: 'Unknown',
          reason: `Reference mentions multiple ${fieldLabel} states (${fieldValue}), so the answer may depend on context.`,
        }
      }
      const answer = flipIfNegated(match, negated)
      return {
        answer: answer ? 'Yes' : 'No',
        reason: match
          ? `Reference says ${fieldLabel} is ${fieldValue}.`
          : `Reference says ${fieldLabel} is ${fieldValue}, which does not match.`,
      }
    }

    // Hair
    const hairAnswer = answerFromValue(infobox.hair, 'hair')
    if (hairAnswer) return hairAnswer

    // Eyes
    const eyeAnswer = answerFromValue(infobox.eye, 'eyes')
    if (eyeAnswer) return eyeAnswer

    // Skin
    const skinAnswer = answerFromValue(infobox.skin, 'skin')
    if (skinAnswer) return skinAnswer

    // Species / race / type
    if (/\b(species|race|human|animal|alien|creature|monster|demon|angel|god|wizard|witch|vampire|werewolf|elf|dwarf|orc|goblin|titan|dragon)\b/.test(q)) {
      const speciesAnswer = answerFromValue(infobox.species || infobox.race, 'species/race')
      if (speciesAnswer) return speciesAnswer
    }

    // Age
    if (/\b(age|old|young|child|adult|teenager|teen)\b/.test(q) && infobox.age) {
      const ageText = infobox.age.toLowerCase()
      let ageMatch = false
      if (/\b(child|kid|young)\b/.test(q)) ageMatch = /\b(child|kid|young|teen|minor)\b/.test(ageText)
      else if (/\b(teen|teenager)\b/.test(q)) ageMatch = /\b(teen|adolescent)\b/.test(ageText)
      else if (/\b(adult|grown)\b/.test(q)) ageMatch = /\b(adult|grown|middle-aged|elder)\b/.test(ageText)
      else if (/\b(old|elderly)\b/.test(q)) ageMatch = /\b(old|elderly|senior|elder)\b/.test(ageText)
      else ageMatch = true // generic "do they have an age?"
      const answer = flipIfNegated(ageMatch, negated)
      return { answer: answer ? 'Yes' : 'No', reason: `Reference says age is ${infobox.age}.` }
    }

    // Height (numeric comparisons + token matching)
    if (/\b(height|tall|short)\b/.test(q) && infobox.height) {
      const height = parseHeight(infobox.height)
      let heightMatch = false
      if (height?.cm !== undefined) {
        if (/\btall\b/.test(q)) heightMatch = height.cm >= 180
        else if (/\bshort\b/.test(q)) heightMatch = height.cm <= 160
        else if (/\b\d+\s*cm\b/.test(q)) {
          const askedCm = parseInt(q.match(/\b(\d+)\s*cm\b/)?.[1] || '0', 10)
          heightMatch = askedCm > 0 && Math.abs(height.cm - askedCm) <= 5
        }
      }
      if (!heightMatch) {
        const { match } = matchInfoboxValue(q, infobox.height)
        heightMatch = match
      }
      const answer = flipIfNegated(heightMatch, negated)
      return {
        answer: answer ? 'Yes' : 'No',
        reason: `Reference says height is ${infobox.height}.`,
      }
    }

    // Country / origin / nationality
    if (/\b(from|country|nationality|national|origin|born in)\b/.test(q)) {
      const placeValue = infobox.nationality || infobox.birthPlace || infobox.birthplace
      if (placeValue) {
        const placeAnswer = answerFromValue(placeValue, 'origin/nationality')
        if (placeAnswer) return placeAnswer
      }
    }

    // Language
    if (/\b(speak|language|talk)\b/.test(q) && (infobox.language || infobox.languages)) {
      const langAnswer = answerFromValue(infobox.language || infobox.languages, 'language')
      if (langAnswer) return langAnswer
    }

    // Affiliation / group / team / school
    if (/\b(affiliation|group|team|school|organization|member|belong|work for|work with|part of)\b/.test(q)) {
      const affiliationAnswer = answerFromValue(infobox.affiliation || infobox.team || infobox.school, 'affiliation')
      if (affiliationAnswer) return affiliationAnswer
    }

    // Universe / franchise / series / appearances
    if (/\b(universe|franchise|series|from|in the|game|anime|manga|movie|show|appear|debut)\b/.test(q)) {
      const universeAnswer = answerFromValue(
        infobox.universe || infobox.series || infobox.franchise || infobox.appearsIn || infobox.debut,
        'series/appearance',
      )
      if (universeAnswer) return universeAnswer
    }

    // Generic infobox field search for any field that appears in the question
    for (const [key, value] of Object.entries(infobox)) {
      if (!value) continue
      if (q.includes(key.toLowerCase())) {
        const genericAnswer = answerFromValue(value, key)
        if (genericAnswer) return genericAnswer
      }
    }
  }

  return { answer: 'Unknown', reason: 'The reference is not clear enough for this question.' }
}

export async function suggestAnswer(
  question: string,
  facts?: WikiFacts,
  referenceExtract = ''
): Promise<FactSuggestion> {
  const structured = suggestAnswerStructured(question, facts, referenceExtract)
  if (structured.answer !== 'Unknown') return structured
  if (!referenceExtract) return structured

  try {
    const llm = await askLLM(question, referenceExtract, facts?.infobox)
    if (llm) return llm
  } catch {
    // Silently fall back to Unknown so the selector is never blocked.
  }
  return structured
}

export async function getWikipediaSummary(title: string): Promise<{ description: string; imageUrl?: string; pageUrl?: string } | null> {
  try {
    const { data } = await axiosWiki.get(
      `${WIKI_SUMMARY_URL}/${encodeURIComponent(title)}`,
      { timeout: 5000 }
    )
    if (data.type === 'disambiguation') return null
    return {
      description: data.extract || '',
      imageUrl: fixUrl(data.thumbnail?.source),
      pageUrl: data.content_urls?.desktop?.page,
    }
  } catch {
    return null
  }
}