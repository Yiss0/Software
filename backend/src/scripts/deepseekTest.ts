import 'dotenv/config';
import OpenAI from 'openai';

async function run() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('Missing DEEPSEEK_API_KEY env var. Set it before running.');
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  try {
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ],
    });

    console.log(completion.choices?.[0]?.message?.content ?? '(no content)');
  } catch (err: any) {
    console.error('DeepSeek request failed:', err?.message || err);
    if (err?.response?.data) {
      console.error('Details:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

run();
