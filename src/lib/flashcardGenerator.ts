export interface GeneratedCard {
  question: string;
  answer: string;
}

/**
 * Parses free-form study notes into Q&A flashcard pairs.
 * Handles many common note formats:
 *  - "Q: ... A: ..." or "Question: ... Answer: ..."
 *  - "Term: Definition"
 *  - "- key point: explanation"
 *  - "Term = Definition"
 *  - "Term - Definition" (with dash separator)
 *  - Bullet points (creates "What is <line>?" style questions)
 *  - Heading lines (ending with colon, next line is content)
 *  - Numbered lists "1. Term: Definition"
 *  - Plain statement lines (fill-in-the-blank style)
 */
export function generateFlashcards(notes: string): GeneratedCard[] {
  if (!notes || !notes.trim()) return [];

  const cards: GeneratedCard[] = [];
  const rawLines = notes.split('\n');
  const lines: string[] = [];
  for (const l of rawLines) {
    const trimmed = l.trim();
    if (trimmed.length > 0) lines.push(trimmed);
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Pattern 1: Explicit Q: and A: pairs (same line or next line)
    const qaMatch = line.match(/^(?:Q|Question)\s*[:.\-]\s*(.+)/i);
    if (qaMatch) {
      const inlineAnswer = line.match(/(?:A|Answer)\s*[:.\-]\s*(.+)$/i);
      if (inlineAnswer) {
        cards.push({ question: qaMatch[1].trim(), answer: inlineAnswer[1].trim() });
        i++;
        continue;
      }
      if (i + 1 < lines.length) {
        const nextAnswer = lines[i + 1].match(/^(?:A|Answer)\s*[:.\-]\s*(.+)/i);
        if (nextAnswer) {
          cards.push({ question: qaMatch[1].trim(), answer: nextAnswer[1].trim() });
          i += 2;
          continue;
        }
      }
      i++;
      continue;
    }

    // Pattern 1b: "A: ..." without preceding Q — skip
    if (line.match(/^(?:A|Answer)\s*[:.\-]\s*(.+)/i)) {
      i++;
      continue;
    }

    // Pattern 2: Numbered list "1. Term: Definition" or "1) Term: Definition"
    const numberedColon = line.match(/^\d+[.)]\s+([^:]{2,100}):\s+(.{3,})$/);
    if (numberedColon) {
      cards.push({
        question: `What is ${numberedColon[1].trim()}?`,
        answer: numberedColon[2].trim(),
      });
      i++;
      continue;
    }

    // Pattern 3: "Term = Definition"
    const eqMatch = line.match(/^([^=]{2,100})\s*=\s*(.{3,})$/);
    if (eqMatch && !line.match(/^\d/)) {
      const term = eqMatch[1].trim().replace(/^[-•*]\s+/, '');
      const definition = eqMatch[2].trim();
      if (term.length >= 2 && definition.length >= 3) {
        cards.push({ question: `What is ${term}?`, answer: definition });
        i++;
        continue;
      }
    }

    // Pattern 4: "Term - Definition" (dash separator, but not bullet)
    const dashMatch = line.match(/^([^-\d]{2,80})\s+[-–—]\s+(.{5,})$/);
    if (dashMatch && !line.match(/^\s*[-•*]/)) {
      const term = dashMatch[1].trim();
      const definition = dashMatch[2].trim();
      if (term.length >= 2 && definition.length >= 5) {
        cards.push({ question: `What is ${term}?`, answer: definition });
        i++;
        continue;
      }
    }

    // Pattern 5: Bullet point with colon "- term: explanation"
    const bulletColon = line.match(/^[-•*]\s+([^:]{2,80}):\s+(.{3,})$/);
    if (bulletColon) {
      cards.push({
        question: `What is ${bulletColon[1].trim()}?`,
        answer: bulletColon[2].trim(),
      });
      i++;
      continue;
    }

    // Pattern 6: "Term: Definition" (single line, colon separated)
    // Must NOT start with Q/A, must NOT be a bullet, term must be short
    const colonMatch = line.match(/^([^:]{2,80}):\s+(.{3,})$/);
    if (colonMatch && !line.match(/^Q\s*[:.]/i) && !line.match(/^A\s*[:.]/i) && !line.match(/^[-•*]/)) {
      const term = colonMatch[1].trim();
      const definition = colonMatch[2].trim();
      if (term.split(' ').length <= 5 && definition.length > 3) {
        cards.push({
          question: `What is ${term}?`,
          answer: definition,
        });
        i++;
        continue;
      }
    }

    // Pattern 7: Heading line (ends with colon, next line is the content)
    if (line.endsWith(':') && !line.startsWith('-') && i + 1 < lines.length) {
      const heading = line.slice(0, -1).trim();
      const next = lines[i + 1];
      if (!next.endsWith(':') && !next.match(/^Q\s*[:.]/i) && !next.match(/^A\s*[:.]/i) && next.length > 3) {
        cards.push({
          question: `Explain: ${heading}`,
          answer: next,
        });
        i += 2;
        continue;
      }
    }

    // Pattern 8: Plain bullet point "- some text"
    const plainBullet = line.match(/^[-•*]\s+(.+)/);
    if (plainBullet) {
      const content = plainBullet[1].trim();
      if (content.length > 3) {
        // Check if content has a colon (already handled above), so this is plain text
        cards.push({
          question: `What is ${content}?`,
          answer: content,
        });
      }
      i++;
      continue;
    }

    // Pattern 9: Numbered list "1. Some text" or "1) Some text"
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    if (numbered) {
      const content = numbered[1].trim();
      if (content.length > 5) {
        // Check for colon within
        const innerColon = content.match(/^([^:]{2,80}):\s+(.{3,})$/);
        if (innerColon) {
          cards.push({
            question: `What is ${innerColon[1].trim()}?`,
            answer: innerColon[2].trim(),
          });
        } else {
          cards.push({
            question: `What is ${content}?`,
            answer: content,
          });
        }
      }
      i++;
      continue;
    }

    // Pattern 10: Plain statement line (no special markers, > 10 chars)
    if (line.length > 10 && !line.match(/^Q\s*[:.]/i) && !line.match(/^A\s*[:.]/i)) {
      const words = line.split(/\s+/);
      if (words.length >= 4) {
        // Try fill-in-the-blank with first significant word
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'this', 'that', 'these', 'those', 'which', 'what', 'when', 'where', 'who', 'why', 'how', 'will', 'can', 'could', 'should', 'would', 'has', 'have', 'had', 'been', 'being', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as', 'into', 'about', 'than', 'then', 'also', 'but', 'not', 'and', 'or']);
        const keyWordIndex = words.findIndex((w) => w.length > 4 && !stopWords.has(w.toLowerCase()));
        if (keyWordIndex >= 0) {
          const keyWord = words[keyWordIndex].replace(/[^a-zA-Z]/g, '');
          if (keyWord.length > 3) {
            const blanked = [...words];
            blanked[keyWordIndex] = '_____';
            cards.push({
              question: `Fill in the blank: ${blanked.join(' ')}`,
              answer: keyWord,
            });
          } else {
            cards.push({
              question: `Explain: ${line}`,
              answer: line,
            });
          }
        } else {
          cards.push({
            question: `Explain: ${line}`,
            answer: line,
          });
        }
      } else if (line.length > 5) {
        // Short line — just ask about it
        cards.push({
          question: `What does this mean: "${line}"?`,
          answer: line,
        });
      }
      i++;
      continue;
    }

    i++;
  }

  // Deduplicate by question (case-insensitive)
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = c.question.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
