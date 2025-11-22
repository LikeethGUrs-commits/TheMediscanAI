import { generatePatientSummary } from './openai';

async function testOpenAISummarization() {
  console.log('Testing OpenAI summarization function...');

  // Sample patient history
  const sampleHistory = `Date: 2023-10-01
Hospital: Chikkamagalur District Hospital
Doctor: Dr. Rajesh Kumar
Disease: Hypertension
Description: Elevated blood pressure
Treatment: Prescribed medication and lifestyle changes
Risk Level: high
---

Date: 2023-09-15
Hospital: Chikkamagalur District Hospital
Doctor: Dr. Priya Sharma
Disease: Migraine
Description: Severe recurring headaches
Treatment: Pain management and rest
Risk Level: low
---

Date: 2023-08-20
Hospital: Sri Siddhartha Medical College
Doctor: Dr. Arjun Reddy
Disease: Arthritis
Description: Joint inflammation
Treatment: Physical therapy sessions
Risk Level: medium
Warnings: Physical therapy recommended`;

  try {
    console.log('Calling generatePatientSummary with sample history...');
    const summary = await generatePatientSummary(sampleHistory);
    console.log('Summary generated successfully:');
    console.log(summary);
  } catch (error) {
    console.error('Error during summarization:', error);
  }
}

testOpenAISummarization();
