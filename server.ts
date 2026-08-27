import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

console.log(
  'Gemini API Key loaded:',
  !!process.env.GEMINI_API_KEY
);

const app = express();

// Render provides PORT automatically
const PORT = Number(process.env.PORT) || 3000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// --------------------------------------------------
// Gemini AI Client
// --------------------------------------------------

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        'GEMINI_API_KEY environment variable is missing.'
      );

      throw new Error(
        'GEMINI_API_KEY is not configured on the server.'
      );
    }

    genAIClient = new GoogleGenAI({
      apiKey: apiKey
    });
  }

  return genAIClient;
}

// --------------------------------------------------
// Gemini Model Fallback Ladder
// --------------------------------------------------

const MODEL_FALLBACK_LADDER = [
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

// --------------------------------------------------
// Gemini Content Generation
// --------------------------------------------------

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<{
  text: string;
  modelUsed: string;
}> {
  const ai = getGeminiClient();

  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });

      if (response && response.text) {
        console.log(`Gemini model succeeded: ${model}`);

        return {
          text: response.text,
          modelUsed: model
        };
      }
    } catch (error: any) {
      console.warn(
        `Model ${model} failed:`,
        error?.message || error
      );

      lastError = error;
    }
  }

  throw new Error(
    `All Gemini models failed. Last error: ${
      lastError?.message || 'Unknown error'
    }`
  );
}

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get(
  '/api/health',
  (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  }
);

// --------------------------------------------------
// GEMINI CHAT
// --------------------------------------------------

app.post(
  '/api/gemini/chat',
  async (req: Request, res: Response) => {
    try {
      const data =
        req.body &&
        typeof req.body === 'object'
          ? req.body
          : {};

      const messages = Array.isArray(data.messages)
        ? data.messages
        : [];

      const journalContext =
        typeof data.journalContext === 'string'
          ? data.journalContext
          : '';

      if (messages.length === 0) {
        res.status(400).json({
          error:
            'Messages array is required and must not be empty.'
        });

        return;
      }

      const systemInstruction = `
You are a supportive, insightful, and mindful AI Journaling Companion.

Your role:

- Guide the user through meaningful self-reflection,
  journaling, gratitude, creative brainstorming,
  and personal growth.

- Ask thoughtful, open-ended follow-up questions
  to help users explore their emotions,
  achievements, or dilemmas.

- Provide empathetic, non-judgmental,
  grounded responses.

- Keep responses concise,
  around 2 to 4 paragraphs maximum.

- You are a reflective journaling aid,
  NOT a medical or mental health professional.

- Do not make psychiatric or clinical diagnoses.

- If a user expresses extreme crisis or self-harm,
  gently encourage reaching out to professional help.
`;

      const formattedContents = messages.map(
        (m: any) => ({
          role:
            m.role === 'model' ||
            m.role === 'assistant'
              ? 'model'
              : 'user',

          parts: [
            {
              text: String(m.content || '')
            }
          ]
        })
      );

      if (journalContext) {
        formattedContents.unshift({
          role: 'user',
          parts: [
            {
              text: `
Here is additional journal context:

${journalContext}
`
            }
          ]
        });
      }

      const result =
        await generateContentWithFallback({
          contents: formattedContents,

          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });

      res.json({
        reply: result.text,
        modelUsed: result.modelUsed
      });

    } catch (error: any) {
      console.error(
        'Chat endpoint error:',
        error
      );

      res.status(500).json({
        error:
          error?.message ||
          'Failed to process chat message.'
      });
    }
  }
);

// --------------------------------------------------
// GEMINI SUMMARY
// --------------------------------------------------

app.post(
  '/api/gemini/summary',
  async (req: Request, res: Response) => {
    try {
      const data =
        req.body &&
        typeof req.body === 'object'
          ? req.body
          : {};

      const messages =
        Array.isArray(data.messages)
          ? data.messages
          : [];

      if (messages.length === 0) {
        res.status(400).json({
          error:
            'Messages array is required for summary generation.'
        });

        return;
      }

      const conversationTranscript =
        messages
          .map(
            (m: any) =>
              `${
                m.role === 'user'
                  ? 'User'
                  : 'Journal Companion'
              }: ${m.content}`
          )
          .join('\n\n');

      const prompt = `
Analyze this reflective journaling conversation
and output a structured JSON summary.

CONVERSATION TRANSCRIPT:

${conversationTranscript}

YOUR TASK:

1. Title:
A creative, descriptive 3-7 word title
reflecting the core topic.

2. Summary:
A cohesive 2-3 sentence overview
summarizing the user's thoughts,
experiences, and breakthroughs.

3. Key Highlights:
2 to 4 bullet points capturing
key reflections or events.

4. Action Items:
1 to 3 practical self-care or productivity
steps the user decided on or can try.

5. Mood & Positive Insight:

- mood:
One of:
"Grateful",
"Optimistic",
"Reflective",
"Calm",
"Energetic",
"Thoughtful",
"Determined",
"Peaceful",
"Challenged",
"Curious"

- moodConfidence:
Integer percentage from 0 to 100.

- sentimentScore:
Float from -1.0 to 1.0.

- positiveInsight:
A 2-sentence encouraging,
constructive and positive insight.

- keyThemes:
Array of 2 to 5 short keyword tags.

- energyLevel:
"Low" | "Moderate" | "High"

- suggestedAction:
A 1-sentence mindful recommendation.

Return ONLY a valid JSON object.

Use this exact structure:

{
  "title": "string",
  "summary": "string",
  "keyHighlights": ["string"],
  "actionItems": ["string"],
  "moodInsight": {
    "mood": "Reflective",
    "moodConfidence": 85,
    "sentimentScore": 0.6,
    "positiveInsight": "string",
    "keyThemes": ["string"],
    "energyLevel": "Moderate",
    "suggestedAction": "string"
  }
}
`;

      const result =
        await generateContentWithFallback({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          config: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        });

      let parsedResponse: any;

      try {
        const cleanJson =
          result.text
            .replace(/```json\n?|\n?```/gi, '')
            .trim();

        parsedResponse =
          JSON.parse(cleanJson);

      } catch (parseError) {
        console.warn(
          'JSON parse error:',
          parseError
        );

        parsedResponse = {
          title: 'Daily Journal Reflection',

          summary:
            result.text.slice(0, 300),

          keyHighlights: [
            'Journal session recorded'
          ],

          actionItems: [
            'Review journal thoughts'
          ],

          moodInsight: {
            mood: 'Reflective',

            moodConfidence: 80,

            sentimentScore: 0.5,

            positiveInsight:
              'Taking time to journal brings clarity and groundedness to your journey.',

            keyThemes: [
              'Reflection',
              'Daily Life'
            ],

            energyLevel: 'Moderate',

            suggestedAction:
              'Take a gentle breath and acknowledge your mindful progress today.'
          }
        };
      }

      res.json({
        data: parsedResponse,
        modelUsed: result.modelUsed
      });

    } catch (error: any) {
      console.error(
        'Summary endpoint error:',
        error
      );

      res.status(500).json({
        error:
          error?.message ||
          'Failed to generate journal summary.'
      });
    }
  }
);

// --------------------------------------------------
// GEMINI INSIGHTS
// --------------------------------------------------

app.post(
  '/api/gemini/insights',
  async (req: Request, res: Response) => {
    try {
      const data =
        req.body &&
        typeof req.body === 'object'
          ? req.body
          : {};

      const entries =
        Array.isArray(data.entries)
          ? data.entries
          : [];

      if (entries.length === 0) {
        res.json({
          weeklyTheme:
            'Beginning Your Mindfulness Journey',

          coachingTip:
            'Consistency in journaling helps identify thought patterns and boost self-awareness.',

          encouragement:
            'Start your first journal chat today to unlock personalized insights!'
        });

        return;
      }

      const summaries =
        entries
          .slice(0, 10)
          .map((e: any) => ({
            title: e.title,
            mood: e.mood,
            themes: e.keyThemes,
            summary: e.summary
          }));

      const prompt = `
Analyze these recent user journal entries
to provide an aggregated mindful growth synthesis.

RECENT ENTRIES:

${JSON.stringify(
  summaries,
  null,
  2
)}

Provide a JSON output with:

{
  "weeklyTheme":
    "A 3-5 word overarching theme of their current life focus",

  "coachingTip":
    "A constructive 2-sentence piece of personal wisdom based on recurring themes",

  "encouragement":
    "An uplifting, warm motivational note to celebrate their consistency"
}
`;

      const result =
        await generateContentWithFallback({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          config: {
            responseMimeType:
              'application/json',

            temperature: 0.4
          }
        });

      const cleanJson =
        result.text
          .replace(/```json\n?|\n?```/gi, '')
          .trim();

      const parsed =
        JSON.parse(cleanJson);

      res.json(parsed);

    } catch (error: any) {
      console.error(
        'Insights aggregation error:',
        error
      );

      res.status(500).json({
        error:
          error?.message ||
          'Failed to aggregate journal insights.'
      });
    }
  }
);

// --------------------------------------------------
// VITE + STATIC SERVING
// --------------------------------------------------

async function startServer() {

  if (
    process.env.NODE_ENV !== 'production'
  ) {

    const vite =
      await createViteServer({
        server: {
          middlewareMode: true
        },

        appType: 'spa'
      });

    app.use(
      vite.middlewares
    );

  } else {

    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(distPath)
    );

    app.get(
      '*',
      (req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Personal Gemini Journal server running on port ${PORT}`
      );
    }
  );
}

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

startServer();