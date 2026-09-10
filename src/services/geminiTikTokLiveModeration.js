/**
 * Service de Modération & d'Intelligence Tchat TikTok Live via Gemini 1.5 Flash
 * 
 * Architecture 100% Gratuite (0,00 €) :
 * - Google AI Studio Free Tier (Gemini 1.5 Flash) : 15 RPM / 1M TPM / 1500 RPD gratuit
 * - Traitement par lots (Batch 15 à 30 secondes) pour regrouper les messages
 * - Filtrage anti-spam, déduplication et extraction de questions stratégiques
 * - max_output_tokens: 256 pour respecter strictement les quotas sans troncature
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class GeminiLiveChatModerator {
  constructor(apiKey = import.meta.env.VITE_GEMINI_API_KEY || '') {
    this.apiKey = apiKey;
    this.messageQueue = [];
    this.batchIntervalMs = 20000; // Lot toutes les 20 secondes
    this.timer = null;
    this.isProcessing = false;
    this.listeners = new Set();
  }

  enqueueMessage(message) {
    if (!message || !message.text) return;
    const cleanText = String(message.text).trim();
    if (cleanText.length < 2) return;

    this.messageQueue.push({
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user: message.user || 'Spectateur',
      text: cleanText,
      timestamp: message.timestamp || new Date().toISOString()
    });

    if (!this.timer) {
      this.timer = setTimeout(() => this.processBatch(), this.batchIntervalMs);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(result) {
    this.listeners.forEach(cb => {
      try {
        cb(result);
      } catch (e) {
        console.error('[GeminiModerator] Erreur listener:', e);
      }
    });
  }

  async processBatch() {
    this.timer = null;
    if (this.messageQueue.length === 0 || this.isProcessing) return;

    const batch = this.messageQueue.splice(0, 25);
    this.isProcessing = true;

    try {
      const analysis = await this.analyzeWithGemini(batch);
      this.notify(analysis);
    } catch (err) {
      console.warn('[GeminiModerator] Analyse en fallback heuristique (0,00 €) :', err.message);
      const fallback = this.heuristicFallback(batch);
      this.notify(fallback);
    } finally {
      this.isProcessing = false;
      if (this.messageQueue.length > 0) {
        this.timer = setTimeout(() => this.processBatch(), this.batchIntervalMs);
      }
    }
  }

  async analyzeWithGemini(messages) {
    if (!this.apiKey) {
      return this.heuristicFallback(messages);
    }

    const messagesText = messages.map(m => `[${m.user}]: ${m.text}`).join('\n');

    const systemPrompt = `Tu es le modérateur IA expert du live TikTok de Karamokho DRAMÉ (@karam.drame).
Analyse ces messages du tchat en direct.
Tâches strictes :
1. Ignore tout le spam, emojis seuls, insultes, et salutations simples ("salut", "cc").
2. Extrais les questions clés stratégiques (business, webdesign, code, agence, devis, clients).
3. Identifie les 3 utilisateurs les plus pertinents/actifs.

Réponds UNIQUEMENT sous forme d'un objet JSON brut valide (sans markdown) :
{
  "topQuestions": [{"original": "texte exact ou reformulé", "count": 1}],
  "topContributors": [{"rank": 1, "name": "pseudo", "badge": "Actif", "comments": 2}],
  "spamFilteredCount": 0
}`;

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nMessages à analyser :\n${messagesText}` }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}`);
    }

    const resData = await response.json();
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    return {
      topQuestions: Array.isArray(parsed.topQuestions) ? parsed.topQuestions.slice(0, 4) : [],
      topContributors: Array.isArray(parsed.topContributors) ? parsed.topContributors.slice(0, 3) : [],
      spamFilteredCount: Number(parsed.spamFilteredCount || 0),
      timestamp: new Date().toISOString()
    };
  }

  heuristicFallback(messages) {
    const userCounts = {};
    const questionCandidates = [];
    let spamCount = 0;

    messages.forEach(m => {
      userCounts[m.user] = (userCounts[m.user] || 0) + 1;
      const text = m.text.trim();

      if (text.includes('?') || /^(comment|pourquoi|combien|quel|quelle|est-ce)/i.test(text)) {
        if (text.length > 10) {
          questionCandidates.push(text);
        }
      } else if (text.length < 4 || /^(salut|bjr|yo|cc|coucou|mdr|lol)$/i.test(text)) {
        spamCount++;
      }
    });

    const topContributors = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count], idx) => ({
        rank: idx + 1,
        name,
        badge: idx === 0 ? "Top Fan" : (idx === 1 ? "VIP" : "Membre"),
        comments: count
      }));

    const topQuestions = questionCandidates.slice(0, 4).map(q => ({
      original: q,
      count: 1
    }));

    return {
      topQuestions,
      topContributors,
      spamFilteredCount: spamCount,
      timestamp: new Date().toISOString()
    };
  }
}

export const liveChatModerator = new GeminiLiveChatModerator();
