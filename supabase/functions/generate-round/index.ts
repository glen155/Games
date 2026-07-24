// Deno Edge Function — generates fresh round content for a game, on demand.
//
// POST { gameSlug: 'family-feud' | 'one-percent-club', topic?: string, difficulty?: string }
// -> { gameSlug, generatedAt, data }
//
// Family Feud: calls the Anthropic API server-side (ANTHROPIC_API_KEY secret,
// never reaches the browser) for a themed, LLM-generated round -- a human
// host always judges correctness in this game, so creative/subjective
// content generation is a safe fit.
//
// 1% Club: sources from the free, keyless Open Trivia DB instead of an LLM --
// this game's correctness is objective and asserted by the app with no human
// check, which is exactly where an LLM is most likely to confidently
// hallucinate a wrong "fact". A vetted trivia dataset is the safer choice.
//
// Deploy: supabase functions deploy generate-round
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// (See supabase/README.md for the full walkthrough. Requires the default
// "Verify JWT" setting to stay ON, so only signed-in devices can call this.)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  gameSlug: 'family-feud' | 'one-percent-club';
  topic?: string;
  difficulty?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    if (body.gameSlug === 'family-feud') {
      const data = await generateFamilyFeudRound(body.topic);
      return json({ gameSlug: body.gameSlug, generatedAt: new Date().toISOString(), data });
    }
    if (body.gameSlug === 'one-percent-club') {
      const data = await generateOnePercentClubQuestions(body.topic, body.difficulty);
      return json({ gameSlug: body.gameSlug, generatedAt: new Date().toISOString(), data });
    }
    return json({ error: `Unknown gameSlug: ${body.gameSlug}` }, 400);
  } catch (err) {
    console.error('generate-round failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Generation failed' }, 502);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Family Feud — LLM-generated ranked survey round
// ---------------------------------------------------------------------------

interface FeudAnswer {
  text: string;
  points: number;
}
interface FeudRound {
  name: string;
  answers: FeudAnswer[];
}

const FEUD_TOOL_NAME = 'submit_round';

async function generateFamilyFeudRound(topic?: string): Promise<FeudRound> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const prompt = topic
    ? `Create a Family Feud round about: ${topic}`
    : 'Create a Family Feud round about a fun, family-friendly everyday topic of your choosing.';

  let lastError = 'Model did not return a usable round';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const round = await callAnthropicForRound(apiKey, prompt, attempt > 0);
    if (isValidFeudRound(round)) return round;
    lastError = `Malformed round on attempt ${attempt + 1}: ${JSON.stringify(round)}`;
  }
  throw new Error(lastError);
}

async function callAnthropicForRound(apiKey: string, prompt: string, isRetry: boolean): Promise<unknown> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system:
        'You generate rounds for a Family Feud-style party game played by families with kids. ' +
        'Always keep content wholesome and appropriate for all ages -- no violence, no adult themes, ' +
        'no offensive content. Survey answers should be genuinely plausible things real people would say, ' +
        'phrased naturally and concisely (a few words each). Provide exactly 8 answers, ordered from most ' +
        'to least popular, with descending point values (ties allowed) that sum to roughly 100-200.',
      messages: [
        {
          role: 'user',
          content: isRetry
            ? `${prompt}\n\nYour previous attempt was malformed. Call ${FEUD_TOOL_NAME} again with exactly 8 answers and non-increasing point values.`
            : prompt,
        },
      ],
      tools: [
        {
          name: FEUD_TOOL_NAME,
          description: 'Submit the generated Family Feud round.',
          input_schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'The category name shown to players.' },
              answers: {
                type: 'array',
                minItems: 8,
                maxItems: 8,
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    points: { type: 'integer' },
                  },
                  required: ['text', 'points'],
                },
              },
            },
            required: ['name', 'answers'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: FEUD_TOOL_NAME },
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const toolUse = data.content?.find((block: { type: string }) => block.type === 'tool_use');
  if (!toolUse) throw new Error('No tool_use block in Anthropic response');
  return toolUse.input;
}

function isValidFeudRound(round: unknown): round is FeudRound {
  if (!round || typeof round !== 'object') return false;
  const r = round as Partial<FeudRound>;
  if (typeof r.name !== 'string' || !r.name.trim()) return false;
  if (!Array.isArray(r.answers) || r.answers.length !== 8) return false;
  let lastPoints = Infinity;
  for (const a of r.answers) {
    if (!a || typeof a.text !== 'string' || !a.text.trim()) return false;
    if (typeof a.points !== 'number' || !Number.isFinite(a.points) || a.points <= 0) return false;
    if (a.points > lastPoints) return false; // must be non-increasing
    lastPoints = a.points;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 1% Club — Open Trivia DB-sourced question ladder
// ---------------------------------------------------------------------------

interface QuestionTier {
  percent: number;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

const TIER_COUNT = 12;
const PERCENT_LADDER = [92, 82, 71, 61, 52, 44, 36, 28, 20, 12, 6, 1];
const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

// A few common topic words mapped to Open Trivia DB's numeric category ids.
// An unrecognized topic just falls through to an unfiltered (broader) pool.
const OTDB_CATEGORIES: Record<string, number> = {
  'general knowledge': 9,
  film: 11,
  movies: 11,
  music: 12,
  television: 14,
  tv: 14,
  'video games': 15,
  science: 17,
  nature: 17,
  computers: 18,
  math: 19,
  mathematics: 19,
  mythology: 20,
  sports: 21,
  geography: 22,
  history: 23,
  animals: 27,
};

async function generateOnePercentClubQuestions(
  topic?: string,
  difficulty?: string,
): Promise<QuestionTier[]> {
  const category = topic ? OTDB_CATEGORIES[topic.trim().toLowerCase()] : undefined;
  const normalizedDifficulty = ['easy', 'medium', 'hard'].includes(difficulty ?? '')
    ? difficulty
    : undefined;

  let results = await fetchOtdbQuestions(category, normalizedDifficulty);
  if (results.length < TIER_COUNT) {
    // A narrow category/difficulty may not have enough questions -- widen the net.
    results = await fetchOtdbQuestions(undefined, undefined);
  }
  if (results.length < TIER_COUNT) {
    throw new Error('Open Trivia DB did not return enough questions');
  }

  const picked = results
    .slice(0, TIER_COUNT)
    .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1));

  return picked.map((q, i) => {
    const options = shuffle([q.correct_answer, ...q.incorrect_answers]);
    return {
      percent: PERCENT_LADDER[i],
      prompt: q.question,
      options: options as [string, string, string, string],
      correctIndex: options.indexOf(q.correct_answer) as 0 | 1 | 2 | 3,
    };
  });
}

interface OtdbQuestion {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  difficulty: string;
}

async function fetchOtdbQuestions(
  category: number | undefined,
  difficulty: string | undefined,
): Promise<OtdbQuestion[]> {
  const params = new URLSearchParams({ amount: String(TIER_COUNT), type: 'multiple', encode: 'url3986' });
  if (category) params.set('category', String(category));
  if (difficulty) params.set('difficulty', difficulty);

  const res = await fetch(`https://opentdb.com/api.php?${params}`);
  if (!res.ok) throw new Error(`Open Trivia DB error ${res.status}`);
  const data = await res.json();
  if (data.response_code !== 0 || !Array.isArray(data.results)) return [];

  return data.results.map((r: OtdbQuestion) => ({
    question: decodeURIComponent(r.question),
    correct_answer: decodeURIComponent(r.correct_answer),
    incorrect_answers: r.incorrect_answers.map(decodeURIComponent),
    difficulty: r.difficulty,
  }));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
