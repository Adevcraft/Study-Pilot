import { getGeminiApiKey } from './_lib/gemini';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKeyPresent = !!getGeminiApiKey();
  return res.status(200).json({
    status: 'ok',
    apiKeyConfigured: apiKeyPresent,
    environment: process.env.NODE_ENV || 'production',
    time: new Date().toISOString()
  });
}
