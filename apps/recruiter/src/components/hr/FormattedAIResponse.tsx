/**
 * Formats AI markdown response into beautiful styled HTML
 * Removes raw markdown and applies proper styling
 */

interface FormattedContentProps {
  content: string;
  accentColor: 'cyan' | 'orange' | 'blue';
}

export function FormattedAIResponse({ content, accentColor }: FormattedContentProps) {
  // Parse markdown-style content
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentList: string[] = [];
  let listType: 'ordered' | 'unordered' | null = null;

  const colors = {
    cyan: {
      number: 'text-cyan-400',
      bullet: 'text-cyan-400',
      bold: 'text-cyan-300',
      heading: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10'
    },
    orange: {
      number: 'text-orange-400',
      bullet: 'text-orange-400',
      bold: 'text-orange-300',
      heading: 'text-orange-400',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/10'
    },
    blue: {
      number: 'text-cyan-400',
      bullet: 'text-cyan-400',
      bold: 'text-cyan-300',
      heading: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10'
    }
  };

  const color = colors[accentColor];

  function flushList() {
    if (currentList.length > 0) {
      if (listType === 'ordered') {
        elements.push(
          <ol key={elements.length} className="space-y-2 my-3">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className={`font-bold ${color.number} flex-shrink-0`}>{idx + 1}.</span>
                <span className="text-gray-200" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={elements.length} className="space-y-2 my-3">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className={`${color.bullet} flex-shrink-0`}>•</span>
                <span className="text-gray-200" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  }

  function formatInlineMarkdown(text: string): string {
    // Bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, `<strong class="${color.bold} font-semibold">$1</strong>`);
    // Italic *text*
    text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    // Inline code `text`
    text = text.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono">$1</code>');
    // PHP currency
    text = text.replace(/₱([\d,]+(?:\.\d{2})?)/g, `<span class="${color.bold} font-semibold">₱$1</span>`);
    return text;
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      flushList();
      return;
    }

    // Headings (## or ###)
    if (trimmed.match(/^#{1,3}\s+/)) {
      flushList();
      const text = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
      elements.push(
        <h3 key={elements.length} className={`text-lg font-bold ${color.heading} mt-4 mb-2`}>
          {text}
        </h3>
      );
      return;
    }

    // Ordered list (1. 2. 3.)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      if (listType !== 'ordered') {
        flushList();
        listType = 'ordered';
      }
      currentList.push(orderedMatch[2]);
      return;
    }

    // Unordered list (- or *)
    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (unorderedMatch) {
      if (listType !== 'unordered') {
        flushList();
        listType = 'unordered';
      }
      currentList.push(unorderedMatch[1]);
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p
        key={elements.length}
        className="text-gray-200 leading-relaxed my-2"
        dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
      />
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}




