/**
 * GrokAIService.js
 * 
 * Direct client integration with xAI Grok API (https://api.x.ai/v1/chat/completions)
 * Supports:
 * - Dynamic generation of bespoke multiple-choice & coding questions
 * - Real-time subject targeting across chosen topics & difficulties
 * - Multi-select, single-select, boolean, and code output prediction formats
 * - Safe credential storage in localStorage
 * - Seamless fallback to high-quality simulated Grok AI generation if offline/unconfigured
 */

export class GrokAIService {
  constructor() {
    this.storageKey = 'dino_colosseum_ai_config';
    this.legacyStorageKey = 'dino_colosseum_grok_config';
    this.config = this.loadConfig();
    this.cache = [];
    this.isFetching = false;
  }

  loadConfig() {
    try {
      // Check modern config first, then legacy
      let saved = localStorage.getItem(this.storageKey);
      if (!saved) saved = localStorage.getItem(this.legacyStorageKey);

      if (saved) {
        const parsed = JSON.parse(saved);
        const provider = parsed.provider || 'gemini';
        const geminiApiKey = (parsed.geminiApiKey || (!parsed.apiKey?.startsWith('xai-') ? parsed.apiKey : '') || '').trim().replace(/^["']|["']$/g, '');
        const xaiApiKey = (parsed.xaiApiKey || (parsed.apiKey?.startsWith('xai-') ? parsed.apiKey : '') || '').trim().replace(/^["']|["']$/g, '');
        const activeKey = provider === 'gemini' ? geminiApiKey : xaiApiKey;
        const hasKey = Boolean(activeKey && activeKey.length > 5);

        return {
          provider,
          geminiApiKey,
          geminiModel: parsed.geminiModel || 'gemini-1.5-flash',
          xaiApiKey,
          xaiModel: parsed.xaiModel || parsed.model || 'grok-2-latest',
          apiKey: activeKey,
          model: provider === 'gemini' ? (parsed.geminiModel || 'gemini-1.5-flash') : (parsed.xaiModel || 'grok-2-latest'),
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          demoMode: hasKey ? false : (parsed.demoMode !== undefined ? parsed.demoMode : false),
          customEndpoint: parsed.customEndpoint || ''
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI config from localStorage:', e);
    }

    return {
      provider: 'gemini', // Default to Google Gemini (free tier & ultra-fast)
      geminiApiKey: '',
      geminiModel: 'gemini-1.5-flash',
      xaiApiKey: '',
      xaiModel: 'grok-2-latest',
      apiKey: '',
      model: 'gemini-1.5-flash',
      enabled: true,
      demoMode: false,
      customEndpoint: ''
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    // Synchronize active apiKey and model
    if (this.config.provider === 'gemini') {
      this.config.geminiApiKey = (this.config.geminiApiKey || '').trim().replace(/^["']|["']$/g, '');
      this.config.apiKey = this.config.geminiApiKey;
      this.config.model = this.config.geminiModel || 'gemini-1.5-flash';
    } else {
      this.config.xaiApiKey = (this.config.xaiApiKey || '').trim().replace(/^["']|["']$/g, '');
      this.config.apiKey = this.config.xaiApiKey;
      this.config.model = this.config.xaiModel || 'grok-2-latest';
    }

    // Auto-disable demoMode when an API key is saved so real AI calls execute
    if (this.config.apiKey && this.config.apiKey.length > 5) {
      this.config.demoMode = false;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      localStorage.setItem(this.legacyStorageKey, JSON.stringify(this.config));
    } catch (e) {
      console.error('Could not save AI config:', e);
    }
  }

  getActiveApiKey() {
    const raw = this.config.provider === 'gemini'
      ? (this.config.geminiApiKey || this.config.apiKey || '')
      : (this.config.xaiApiKey || this.config.apiKey || '');
    return raw.trim().replace(/^["']|["']$/g, '');
  }

  getActiveModel() {
    return this.config.provider === 'gemini'
      ? (this.config.geminiModel || 'gemini-1.5-flash')
      : (this.config.xaiModel || 'grok-2-latest');
  }

  isConnected() {
    if (!this.config.enabled) return false;
    if (this.config.demoMode) return true;
    const key = this.getActiveApiKey();
    return Boolean(key && key.length > 5);
  }

  isRealApiActive() {
    if (!this.config.enabled) return false;
    const key = this.getActiveApiKey();
    return Boolean(key && key.length > 5 && !this.config.demoMode);
  }

  /**
   * Universal test connection method supporting both Google Gemini and xAI Grok
   */
  async testConnection(options = {}) {
    const provider = options.provider || this.config.provider || 'gemini';
    const apiKey = (options.apiKey !== undefined ? options.apiKey : this.getActiveApiKey()).trim().replace(/^["']|["']$/g, '');
    const model = options.model || (provider === 'gemini' ? (this.config.geminiModel || 'gemini-1.5-flash') : (this.config.xaiModel || 'grok-2-latest'));

    if (provider === 'gemini') {
      return this.testGeminiConnection(apiKey, model);
    } else {
      return this.testXAIConnection(apiKey, model);
    }
  }

  /**
   * Test connection to Google Gemini API
   */
  async testGeminiConnection(apiKey, model = 'gemini-1.5-flash') {
    const cleanKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
    if (!cleanKey || cleanKey.length < 5) {
      return {
        success: false,
        message: 'Please paste your Google Gemini API key (starts with AIzaSy...). Get one free at https://aistudio.google.com/app/apikey'
      };
    }

    if (cleanKey.startsWith('xai-')) {
      return {
        success: false,
        message: 'This key starts with "xai-". It is an xAI Grok key. Please switch to the "⚡ xAI Grok" tab above!'
      };
    }

    const t0 = performance.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Respond with: OK' }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 20
          }
        })
      });

      const elapsed = Math.round(performance.now() - t0);

      if (!response.ok) {
        let errDetail = response.statusText;
        try {
          const errData = await response.json();
          if (errData?.error?.message) errDetail = errData.error.message;
        } catch (_) {}

        let hint = '';
        if (response.status === 400) {
          hint = ' • Check that your API key was copied completely from https://aistudio.google.com/app/apikey.';
        } else if (response.status === 403) {
          hint = ' • Permission denied. Verify your API key has "Generative Language API" enabled in Google AI Studio.';
        } else if (response.status === 404) {
          hint = ` • Model "${model}" not found. Try selecting "gemini-1.5-flash".`;
        } else if (response.status === 429) {
          hint = ' • Google Gemini rate limit reached (15 RPM on free tier). Wait a minute and try again.';
        }

        return {
          success: false,
          status: response.status,
          message: `Google Gemini Error (${response.status}): ${errDetail}${hint}`,
          latencyMs: elapsed
        };
      }

      return {
        success: true,
        message: `Successfully connected to Google Gemini ${model}! (${elapsed}ms latency) - Click 'SAVE & ACTIVATE' below!`,
        latencyMs: elapsed
      };
    } catch (err) {
      return {
        success: false,
        message: `Network or browser restriction connecting to Gemini API: ${err.message}. If you have an ad-blocker enabled, please allow generativelanguage.googleapis.com.`,
        error: err
      };
    }
  }

  /**
   * Test connection to xAI Grok API
   */
  async testXAIConnection(apiKey, model = 'grok-2-latest') {
    if (!apiKey || apiKey.length < 5) {
      return {
        success: false,
        message: 'Please enter a valid xAI Grok API key (starts with xai-...).'
      };
    }

    const t0 = performance.now();
    try {
      const endpoint = this.config.customEndpoint || 'https://api.x.ai/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: 'Reply with JSON only: {"status":"connected","model":"' + model + '"}'
            },
            {
              role: 'user',
              content: 'Ping test.'
            }
          ],
          temperature: 0.1,
          max_tokens: 60
        })
      });

      const elapsed = Math.round(performance.now() - t0);

      if (!response.ok) {
        let errDetail = response.statusText;
        try {
          const errData = await response.json();
          if (errData?.error?.message) errDetail = errData.error.message;
        } catch (_) {}

        return {
          success: false,
          status: response.status,
          message: `xAI Grok Error (${response.status}): ${errDetail}`,
          latencyMs: elapsed
        };
      }

      return {
        success: true,
        message: `Successfully connected to xAI ${model}! (${elapsed}ms latency)`,
        latencyMs: elapsed
      };
    } catch (err) {
      return {
        success: false,
        message: `Network error connecting to xAI API: ${err.message}`,
        error: err
      };
    }
  }

  /**
   * Generates a fresh question from AI (Google Gemini or xAI Grok) based on active subjects and difficulty
   */
  async generateQuestion(subjectNames = ['JavaScript & TypeScript'], difficulty = 'medium') {
    const chosenSubject = Array.isArray(subjectNames) && subjectNames.length > 0
      ? subjectNames[Math.floor(Math.random() * subjectNames.length)]
      : 'Computer Science';

    // If real API key is enabled and available, call the configured AI Provider
    if (this.isRealApiActive()) {
      try {
        if (this.config.provider === 'gemini') {
          const aiQuestion = await this.fetchQuestionFromGemini(chosenSubject, difficulty);
          if (aiQuestion) return aiQuestion;
        } else {
          const aiQuestion = await this.fetchQuestionFromXAI(chosenSubject, difficulty);
          if (aiQuestion) return aiQuestion;
        }
      } catch (err) {
        console.warn(`${this.config.provider} API fetch error, falling back to simulated AI engine:`, err);
      }
    }

    // Otherwise generate via Simulated AI Generator
    return this.generateSimulatedQuestion(chosenSubject, difficulty);
  }

  /**
   * Prompts Google Gemini API for a structured quiz question
   */
  async fetchQuestionFromGemini(subjectName, difficulty) {
    const questionTypes = ['single', 'multi', 'boolean', 'code_output'];
    const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const rawKey = this.config.geminiApiKey || this.config.apiKey || '';
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
    const model = this.config.geminiModel || 'gemini-1.5-flash';

    if (!apiKey || apiKey.length < 5) {
      throw new Error('Google Gemini API key missing or invalid');
    }

    const prompt = `You are Google Gemini, acting as the Grandmaster Quiz Engine in Dino Coding Colosseum.
Generate 1 high quality, engaging, scientifically and technically accurate quiz question for:
- Subject: ${subjectName}
- Difficulty: ${difficulty} (easy, medium, hard, or pro)
- Type: ${chosenType} ('single' = 4 options, 1 correct index 0-3; 'multi' = 4 options, array of 2+ correct indices e.g. [0, 2]; 'boolean' = 2 options ["True", "False"], correct is 0 or 1; 'code_output' = short code snippet in "code" field, 4 prediction options).

Return ONLY raw JSON matching this schema:
{
  "id": "gemini_${Date.now()}",
  "topic": "${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}",
  "topicName": "${subjectName}",
  "difficulty": "${difficulty}",
  "type": "${chosenType}",
  "question": "Clear, concise question text",
  "code": null,
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": ${chosenType === 'multi' ? '[0, 2]' : 0},
  "explanation": "Clear educational explanation highlighting why the answer is correct.",
  "aiGenerated": true,
  "provider": "gemini",
  "model": "${model}"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 900
        }
      })
    });

    if (!response.ok) {
      let errDetail = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch (_) {}
      throw new Error(`Google Gemini HTTP ${response.status}: ${errDetail}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanJson);
    parsed.aiGenerated = true;
    parsed.provider = 'gemini';
    parsed.model = model;
    if (!parsed.topicName) parsed.topicName = subjectName;

    return parsed;
  }

  /**
   * Prompts xAI Grok API for a structured quiz question
   */
  async fetchQuestionFromXAI(subjectName, difficulty) {
    const questionTypes = ['single', 'multi', 'boolean', 'code_output'];
    const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const apiKey = (this.config.xaiApiKey || this.config.apiKey || '').trim();
    const model = this.config.xaiModel || 'grok-2-latest';

    const prompt = `You are Grok by xAI, acting as the Grandmaster Quiz Engine in Dino Coding Colosseum.
Generate 1 high quality, scientifically accurate, engaging question for:
- Subject: ${subjectName}
- Difficulty: ${difficulty} (easy, medium, hard, or pro)
- Type: ${chosenType} ('single' = 4 options, 1 correct index; 'multi' = 4 options, array of 2+ correct indices; 'boolean' = 2 options ["True", "False"], 0 or 1; 'code_output' = short code snippet in "code" field, 4 prediction options).

Return ONLY raw JSON with NO markdown formatting, NO surrounding backticks, matching this exact schema:
{
  "id": "grok_${Date.now()}",
  "topic": "${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}",
  "topicName": "${subjectName}",
  "difficulty": "${difficulty}",
  "type": "${chosenType}",
  "question": "Clear question text here",
  "code": "Optional code block or null if not needed",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": ${chosenType === 'multi' ? '[0, 2]' : 0},
  "explanation": "Thorough, educational explanation highlighting the underlying concept and why other options fail.",
  "aiGenerated": true,
  "provider": "xai",
  "model": "${model}"
}`;

    const response = await fetch(this.config.customEndpoint || 'https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You generate strictly valid JSON for educational quiz games. Never output preamble or commentary.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 650
      })
    });

    if (!response.ok) {
      throw new Error(`Grok HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    
    // Clean potential markdown code blocks
    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    parsed.aiGenerated = true;
    parsed.provider = 'xai';
    parsed.model = model;
    if (!parsed.topicName) parsed.topicName = subjectName;

    return parsed;
  }

  generateSimulatedQuestion(subjectName, difficulty) {
    const bank = this.getSimulatedQuestionBank(subjectName, difficulty);
    const chosen = bank[Math.floor(Math.random() * bank.length)];
    const isGemini = (this.config.provider || 'gemini') === 'gemini';

    return {
      ...chosen,
      id: `${isGemini ? 'gemini' : 'grok'}_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      aiGenerated: true,
      provider: isGemini ? 'gemini' : 'xai',
      simulated: !this.isRealApiActive(),
      model: this.isRealApiActive() ? this.getActiveModel() : (isGemini ? 'gemini-1.5-flash (demo)' : 'grok-2 (demo)')
    };
  }

  generateSimulatedGrokQuestion(subjectName, difficulty) {
    return this.generateSimulatedQuestion(subjectName, difficulty);
  }

  getSimulatedQuestionBank(subjectName, difficulty) {
    const s = subjectName.toLowerCase();

    // Python & Data Science
    if (s.includes('python') || s.includes('data')) {
      return [
        {
          topic: 'python',
          topicName: 'Python & Data Science',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which of the following Python constructs create a new generator object rather than evaluating immediately into memory?',
          code: `# Example generators vs collections
g = (x ** 2 for x in range(10_000_000))
def stream_batches(data):
    for i in range(0, len(data), 64):
        yield data[i:i + 64]`,
          options: [
            'Parenthesized generator expressions `(x for x in seq)`',
            'List comprehensions `[x for x in seq]`',
            'Functions containing the `yield` statement',
            'Dictionary comprehensions `{k: v for k, v in pairs}`'
          ],
          correct: [0, 2],
          explanation: 'Generator expressions and generator functions with `yield` return lazy iterators that produce values on-demand via `next()`, conserving memory for massive datasets.'
        },
        {
          topic: 'python',
          topicName: 'Python & Data Science',
          difficulty: difficulty,
          type: 'code_output',
          question: 'What is the exact output of this Python mutable default argument snippet?',
          code: `def append_item(val, items=[]):
    items.append(val)
    return len(items)

print(append_item(1), append_item(2), append_item(3))`,
          options: ['1 1 1', '1 2 3', 'Error: mutable argument', '3 3 3'],
          correct: 1,
          explanation: 'In Python, default parameter expressions are evaluated once at function definition time, so the list persists across consecutive calls, resulting in lengths 1, 2, and 3.'
        },
        {
          topic: 'python',
          topicName: 'Python & Data Science',
          difficulty: difficulty,
          type: 'single',
          question: 'In NumPy and Pandas, what operation allows applying mathematical operations element-wise across arrays of differing shapes without copying data?',
          code: null,
          options: ['Array Broadcasting', 'Vector Memory Pointers', 'GIL Bypass Allocation', 'Dynamic Subsetting'],
          correct: 0,
          explanation: 'Broadcasting describes how NumPy treats arrays with different shapes during arithmetic operations by virtually stretching the smaller array to match dimensions.'
        }
      ];
    }

    // Machine Learning & AI
    if (s.includes('machine learning') || s.includes('ai') || s.includes('neural')) {
      return [
        {
          topic: 'ml_ai',
          topicName: 'Machine Learning & AI',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which core mechanisms enable the Transformer architecture (Vaswani et al.) to process entire sequences in parallel compared to recurrent architectures (RNNs/LSTMs)?',
          code: null,
          options: [
            'Multi-Head Self-Attention mechanisms',
            'Positional Encodings to preserve token ordering',
            'Sequential hidden state unrolling through time',
            'Cross-attention with key, query, and value projection tensors'
          ],
          correct: [0, 1, 3],
          explanation: 'Self-Attention and Positional Encodings eliminate recurrent temporal unrolling, allowing parallel tensor matrix multiplications across GPUs/TPUs during training.'
        },
        {
          topic: 'ml_ai',
          topicName: 'Machine Learning & AI',
          difficulty: difficulty,
          type: 'single',
          question: 'Which loss function is mathematically equivalent to the negative log-likelihood of a Bernoulli distribution in binary classification?',
          code: null,
          options: ['Binary Cross-Entropy Loss (Log Loss)', 'Mean Absolute Error (L1 Loss)', 'Hinge Loss (SVM Margin)', 'Huber Robust Loss'],
          correct: 0,
          explanation: 'Binary Cross-Entropy represents the negative log-likelihood of the true distribution when modeled as Bernoulli trials: -[y log(p) + (1-y) log(1-p)].'
        }
      ];
    }

    // Physics & Space Science
    if (s.includes('physics') || s.includes('space')) {
      return [
        {
          topic: 'physics',
          topicName: 'Physics & Space Science',
          difficulty: difficulty,
          type: 'single',
          question: 'According to General Relativity, what is the boundary around a black hole beyond which nothing—not even light—can escape called?',
          code: null,
          options: ['Event Horizon (Schwarzschild Radius)', 'Accretion Photon Sphere', 'Ergosphere Perimeter', 'Hawking Horizon'],
          correct: 0,
          explanation: 'The event horizon is the spacetime threshold where the escape velocity strictly equals the speed of light in vacuum (c).'
        },
        {
          topic: 'physics',
          topicName: 'Physics & Space Science',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which of the following are fundamental forces of nature in modern standard physics?',
          code: null,
          options: [
            'Gravitational Force',
            'Electromagnetic Force',
            'Strong Nuclear Force',
            'Centrifugal Force'
          ],
          correct: [0, 1, 2],
          explanation: 'Gravity, Electromagnetism, Strong Nuclear, and Weak Nuclear are the 4 fundamental interactions. Centrifugal force is an apparent/fictitious inertial force.'
        },
        {
          topic: 'physics',
          topicName: 'Physics & Space Science',
          difficulty: difficulty,
          type: 'boolean',
          question: 'Quantum entanglement permits instantaneous transmission of arbitrary classical information faster than the speed of light.',
          code: null,
          options: ['True', 'False'],
          correct: 1,
          explanation: 'False. The No-Communication Theorem in quantum mechanics proves that quantum entanglement cannot be exploited to send classical data faster than light.'
        }
      ];
    }

    // Mathematics & Logic
    if (s.includes('math') || s.includes('logic')) {
      return [
        {
          topic: 'mathematics',
          topicName: 'Mathematics & Logic',
          difficulty: difficulty,
          type: 'single',
          question: 'What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + 1/16 + ... ?',
          code: `S = sum_{k=0}^{infinity} (1/2)^k = a / (1 - r)`,
          options: ['2', '1.5', 'Infinity', 'e (Euler constant)'],
          correct: 0,
          explanation: 'Using the infinite geometric series formula S = a / (1 - r) with first term a = 1 and common ratio r = 0.5, we get 1 / (1 - 0.5) = 2.'
        },
        {
          topic: 'mathematics',
          topicName: 'Mathematics & Logic',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which of the following numbers are prime numbers?',
          code: null,
          options: ['2', '51', '97', '1'],
          correct: [0, 2],
          explanation: '2 is the only even prime. 97 is prime. 51 is composite (3 * 17 = 51). 1 is by definition neither prime nor composite.'
        }
      ];
    }

    // Cybersecurity & Networks
    if (s.includes('cyber') || s.includes('security') || s.includes('network')) {
      return [
        {
          topic: 'cybersecurity',
          topicName: 'Cybersecurity & Networks',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which cryptographic properties are guaranteed by modern TLS 1.3 handshakes when Ephemeral Diffie-Hellman (ECDHE) is employed?',
          code: null,
          options: [
            'Perfect Forward Secrecy (PFS)',
            'End-to-end data confidentiality & tampering integrity',
            'Immunity to distributed denial of service (DDoS)',
            'Mutual or server authentication via X.509 certificates'
          ],
          correct: [0, 1, 3],
          explanation: 'TLS 1.3 provides PFS (past sessions remain secret even if server private keys are later compromised), cryptographic integrity/confidentiality, and certificate authentication.'
        },
        {
          topic: 'cybersecurity',
          topicName: 'Cybersecurity & Networks',
          difficulty: difficulty,
          type: 'single',
          question: 'What attack exploits trust that a website has in a user’s browser by transmitting unauthorized commands via session cookies without the user’s awareness?',
          code: null,
          options: ['Cross-Site Request Forgery (CSRF)', 'Cross-Site Scripting (XSS)', 'SQL Injection (SQLi)', 'Buffer Overflow'],
          correct: 0,
          explanation: 'CSRF forces an authenticated browser to send forged HTTP requests to a target site. It is defended with SameSite cookie attributes and CSRF anti-forgery tokens.'
        }
      ];
    }

    // World History & Civilizations
    if (s.includes('history') || s.includes('civilization')) {
      return [
        {
          topic: 'history',
          topicName: 'World History & Civilizations',
          difficulty: difficulty,
          type: 'single',
          question: 'Which ancient monument was constructed by the Egyptian Pharaoh Khufu around 2560 BCE and was the tallest human-made structure for over 3,800 years?',
          code: null,
          options: ['The Great Pyramid of Giza', 'The Colossus of Rhodes', 'The Lighthouse of Alexandria', 'The Parthenon of Athens'],
          correct: 0,
          explanation: 'The Great Pyramid of Giza remained the tallest human construction in the world until the completion of Lincoln Cathedral in England in 1311 CE.'
        },
        {
          topic: 'history',
          topicName: 'World History & Civilizations',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which of the following breakthroughs originated during the Islamic Golden Age (8th–14th centuries)?',
          code: null,
          options: [
            'Foundations of Algebra (Al-Khwarizmi)',
            'Advances in scientific optics and visual refraction (Ibn al-Haytham)',
            'Comprehensive clinical medical encyclopedias (Ibn Sina / Avicenna)',
            'The steam engine for railway locomotion'
          ],
          correct: [0, 1, 2],
          explanation: 'Al-Khwarizmi founded algebra; Ibn al-Haytham revolutionized experimental optics; Ibn Sina wrote the Canon of Medicine. The railway steam engine emerged during Britain\'s 18th-century Industrial Revolution.'
        }
      ];
    }

    // General Science & Biology
    if (s.includes('science') || s.includes('bio')) {
      return [
        {
          topic: 'general_science',
          topicName: 'General Science & Biology',
          difficulty: difficulty,
          type: 'single',
          question: 'What cellular organelle is responsible for generating the majority of chemical energy (adenosine triphosphate, ATP) required by eukaryotic cells?',
          code: null,
          options: ['Mitochondrion', 'Golgi Apparatus', 'Endoplasmic Reticulum', 'Lysosome'],
          correct: 0,
          explanation: 'Mitochondria produce ATP through oxidative phosphorylation and cellular respiration, earning the moniker of the powerhouse of the cell.'
        },
        {
          topic: 'general_science',
          topicName: 'General Science & Biology',
          difficulty: difficulty,
          type: 'multi',
          question: 'Which of the following chemical elements make up more than 96% of the mass of the human body?',
          code: null,
          options: ['Oxygen', 'Carbon', 'Hydrogen & Nitrogen', 'Titanium'],
          correct: [0, 1, 2],
          explanation: 'The four CHON elements (Carbon, Hydrogen, Oxygen, Nitrogen) constitute roughly 96.2% of total human body mass.'
        }
      ];
    }

    // Default: JavaScript / Software Engineering
    return [
      {
        topic: 'javascript',
        topicName: 'JavaScript & TypeScript',
        difficulty: difficulty,
        type: 'code_output',
        question: 'Grok analyzes your microtask queue. What is the printed output order in Node.js / Modern V8?',
        code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
queueMicrotask(() => console.log('4'));
console.log('5');`,
        options: ['1, 5, 3, 4, 2', '1, 2, 3, 4, 5', '1, 5, 2, 3, 4', '1, 3, 4, 5, 2'],
        correct: 0,
        explanation: 'Synchronous execution logs 1 then 5. The microtask queue (Promise and queueMicrotask) empties completely (logging 3, 4) before the macro-task timer callback (2) runs.'
      },
      {
        topic: 'javascript',
        topicName: 'JavaScript & TypeScript',
        difficulty: difficulty,
        type: 'multi',
        question: 'Which of the following TypeScript features exist purely as type annotations and generate ZERO runtime JavaScript code?',
        code: null,
        options: [
          'Type Aliases (`type Point = { x: number }`)',
          'TypeScript Interfaces (`interface User {}`)',
          'Numeric Enums (`enum Status { OK, Fail }`)',
          'Classes with parameter properties (`class A { constructor(public id: number) {} }`)'
        ],
        correct: [0, 1],
        explanation: 'Type aliases and interfaces are completely erased during TypeScript compilation. Enums and classes generate real JavaScript objects and constructors.'
      }
    ];
  }
}

export const grokAI = new GrokAIService();
export const aiService = grokAI;
