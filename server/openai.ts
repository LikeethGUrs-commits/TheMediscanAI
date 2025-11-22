import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generatePatientSummary(history: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model:"gpt-4.1-mini",
      messages: [
        {
          role: 'system',
          content: 'You are a medical professional summarizing patient medical histories. Provide a concise, professional summary highlighting key diagnoses, treatments, and risk levels.',
        },
        {
          role: 'user',
          content: `Please summarize the following patient medical history:\n\n${history}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });
    return response.choices[0].message.content || 'Summary not available';
  } catch (error) {
    console.error('OpenAI summarization error:', error);
    throw new Error('Failed to generate summary with OpenAI');
  }
}
