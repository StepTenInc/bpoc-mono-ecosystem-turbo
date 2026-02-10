/**
 * Parse AI-generated JSON responses
 * 
 * AI models often return JSON wrapped in markdown code blocks or with extra text.
 * This utility extracts and parses the JSON reliably.
 */

export function parseAIJson<T = any>(content: string, context: string = 'AI Response'): T {
  if (!content) {
    throw new Error(`${context}: Empty content received`);
  }

  // Strategy 1: Try direct parse (cleanest case)
  try {
    return JSON.parse(content.trim());
  } catch {
    // Continue to extraction strategies
  }

  // Strategy 2: Extract from markdown code blocks
  const codeBlockPatterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
  ];

  for (const pattern of codeBlockPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // Continue to next pattern
      }
    }
  }

  // Strategy 3: Find JSON object/array boundaries
  const jsonPatterns = [
    /(\{[\s\S]*\})/,  // Object
    /(\[[\s\S]*\])/,  // Array
  ];

  for (const pattern of jsonPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Continue to next pattern
      }
    }
  }

  // Strategy 4: Clean common issues and retry
  let cleaned = content
    .replace(/^[^{\[]*/, '')  // Remove leading non-JSON
    .replace(/[^}\]]*$/, '')  // Remove trailing non-JSON
    .replace(/,\s*([\]}])/g, '$1')  // Remove trailing commas
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // Quote unquoted keys
    .replace(/:\s*'([^']*)'/g, ': "$1"')  // Single to double quotes
    .replace(/\\'/g, "'")  // Unescape single quotes
    .replace(/\n/g, '\\n')  // Escape newlines in strings
    .trim();

  // Handle Infinity values (common in some AI responses)
  cleaned = cleaned.replace(/:\s*Infinity\s*([,}])/gi, ': null$1');
  cleaned = cleaned.replace(/:\s*-Infinity\s*([,}])/gi, ': null$1');
  cleaned = cleaned.replace(/:\s*NaN\s*([,}])/gi, ': null$1');

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Final strategy: Try to fix common JSON errors
    try {
      // Replace escaped newlines back for proper JSON string handling
      const reFixed = cleaned.replace(/\\n/g, '\n');
      // Use a more lenient parse
      return JSON.parse(reFixed);
    } catch {
      throw new Error(
        `${context}: Failed to parse JSON after all strategies.\n` +
        `Original (first 500 chars): ${content.slice(0, 500)}...\n` +
        `Error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

export default parseAIJson;
