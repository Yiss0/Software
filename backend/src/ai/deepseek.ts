import OpenAI from 'openai';

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export type ParsedPlan = {
  medications: Array<{
    name: string;
    dosage?: string;
    presentation?: string;
    instructions?: string;
    color?: string;
    schedules: Array<{
      timeLocal?: string;      // HH:mm local time (if specific times)
      daysCsv?: string;        // e.g. "mon,tue,wed" or "daily"
      repeatEveryMin?: number; // optional interval in minutes
      snoozeMin?: number;      // optional snooze duration
      maxSnoozeMin?: number;   // optional max snooze time
    }>;
  }>;
};

export async function parsePrescriptionWithImage(params: {
  prompt: string;
  imageUrlOrBase64: string; // data URL or remote URL
}): Promise<ParsedPlan> {
  const { prompt, imageUrlOrBase64 } = params;

  const completion = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content:
          'You are a medical assistant. From the user text and the image (a prescription or medication label), extract a safe, structured medication plan in strict JSON matching the schema. If unsure, ask for clarification. Do not hallucinate missing fields. Times should be HH:mm and daysCsv should be daily or comma-separated days.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrlOrBase64 } },
        ] as any,
      } as any,
    ],
    response_format: { type: 'json_object' } as any,
    temperature: 0,
  } as any);

  const text = completion.choices?.[0]?.message?.content || '{}';
  let parsed: ParsedPlan;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('AI response was not valid JSON');
  }
  if (!parsed || !Array.isArray(parsed.medications)) {
    throw new Error('Parsed plan missing medications array');
  }
  return parsed;
}
