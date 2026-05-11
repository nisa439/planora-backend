import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

const SYSTEM_PROMPT = `Sen Planora'nın akıllı asistanısın. Planora, Jira benzeri bir proje yönetim uygulamasıdır.

Kullanıcılara şu konularda yardım edebilirsin:
- Proje ve görev yönetimi hakkında tavsiyeler
- Kanban metodolojisi ve iş akışı optimizasyonu
- Önceliklendirme stratejileri (MoSCoW, Eisenhower Matrix vb.)
- Sprint planlama ve backlog yönetimi
- Takım işbirliği ve iletişim ipuçları
- Planora'nın özellikleri hakkında sorular

Kısa, net ve pratik cevaplar ver. Türkçe konuş.`;

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, message: 'messages array is required' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-...') {
    res.status(503).json({ success: false, message: 'Chat service not configured' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } };
      throw new Error(err.error?.message || 'OpenAI API error');
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };
    const reply = data.choices[0]?.message?.content || 'Bir cevap üretilemedi.';

    res.json({ success: true, data: { reply } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    res.status(500).json({ success: false, message });
  }
};
