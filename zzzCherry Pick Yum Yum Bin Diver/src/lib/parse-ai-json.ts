/**
 * Multi-strategy JSON parser for AI model responses.
 * AI models often wrap JSON in markdown code blocks or add explanation text.
 * This tries multiple strategies to extract valid JSON.
 */
export function parseAIJson<T = any>(rawContent: string, label: string = 'AI'): T {
  // Log for debugging
  console.log(`🔍 ${label} response length: ${rawContent.length}`);
  console.log(`🔍 ${label} first 300 chars:`, rawContent.slice(0, 300));
  console.log(`🔍 ${label} last 300 chars:`, rawContent.slice(-300));

  const strategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(rawContent.trim()),
    
    // Strategy 2: Strip markdown code blocks
    () => {
      let c = rawContent.trim();
      c = c.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      return JSON.parse(c);
    },
    
    // Strategy 3: Find first { to last }
    () => {
      const start = rawContent.indexOf('{');
      const end = rawContent.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found');
      return JSON.parse(rawContent.slice(start, end + 1));
    },
    
    // Strategy 4: Find first [ to last ] (for array responses)
    () => {
      const start = rawContent.indexOf('[');
      const end = rawContent.lastIndexOf(']');
      if (start === -1 || end === -1 || end <= start) throw new Error('No JSON array found');
      return JSON.parse(rawContent.slice(start, end + 1));
    },
    
    // Strategy 5: Regex extract largest JSON block
    () => {
      const match = rawContent.match(/[\{\[][\s\S]*[\}\]]/);
      if (!match) throw new Error('No JSON match');
      return JSON.parse(match[0]);
    },

    // Strategy 6: Fix unescaped control characters inside JSON string values.
    // LLMs (especially Grok) often put literal newlines inside JSON strings
    // when the content contains markdown. Walk char-by-char to escape them.
    () => {
      let text = rawContent.trim();
      text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('No JSON object');
      text = text.slice(start, end + 1);

      let result = '';
      let inString = false;
      let escaped = false;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (escaped) { result += ch; escaped = false; continue; }
        if (ch === '\\') { escaped = true; result += ch; continue; }
        if (ch === '"') { inString = !inString; result += ch; continue; }
        if (inString) {
          if (ch === '\n') { result += '\\n'; continue; }
          if (ch === '\r') { result += '\\r'; continue; }
          if (ch === '\t') { result += '\\t'; continue; }
        }
        result += ch;
      }
      return JSON.parse(result);
    },
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      if (result && typeof result === 'object') {
        console.log(`✅ ${label} JSON parsed using strategy ${i + 1}`);
        return result as T;
      }
    } catch {
      console.log(`⚠️ ${label} strategy ${i + 1} failed`);
    }
  }

  console.error(`❌ ${label} ALL JSON parse strategies failed`);
  console.error(`Full response:`, rawContent);
  throw new Error(`${label} response was not valid JSON`);
}
