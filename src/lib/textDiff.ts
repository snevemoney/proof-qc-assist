export interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

export interface DiffResult {
  originalSegments: DiffSegment[];
  modifiedSegments: DiffSegment[];
  stats: {
    addedWords: number;
    removedWords: number;
    unchangedWords: number;
    changePercent: number;
  };
}

/**
 * Computes word-level diff between two texts
 * Returns segments for both original and modified text with change markers
 */
export function computeWordDiff(original: string, modified: string): DiffResult {
  const originalWords = tokenize(original);
  const modifiedWords = tokenize(modified);
  
  // Build LCS (Longest Common Subsequence) matrix
  const lcs = buildLCSMatrix(originalWords, modifiedWords);
  
  // Backtrack to find the diff
  const { originalSegments, modifiedSegments, stats } = backtrackDiff(
    originalWords,
    modifiedWords,
    lcs
  );
  
  return {
    originalSegments: mergeSegments(originalSegments),
    modifiedSegments: mergeSegments(modifiedSegments),
    stats,
  };
}

/**
 * Tokenize text into words while preserving whitespace
 */
function tokenize(text: string): string[] {
  // Split by word boundaries but keep whitespace attached
  return text.split(/(\s+)/).filter(token => token.length > 0);
}

/**
 * Build LCS matrix for dynamic programming approach
 */
function buildLCSMatrix(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const matrix: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }
  
  return matrix;
}

/**
 * Backtrack through LCS matrix to build diff segments
 */
function backtrackDiff(
  original: string[],
  modified: string[],
  lcs: number[][]
): {
  originalSegments: DiffSegment[];
  modifiedSegments: DiffSegment[];
  stats: DiffResult['stats'];
} {
  const originalSegments: DiffSegment[] = [];
  const modifiedSegments: DiffSegment[] = [];
  
  let i = original.length;
  let j = modified.length;
  
  let addedWords = 0;
  let removedWords = 0;
  let unchangedWords = 0;
  
  // Temporary arrays to build segments in reverse
  const origTemp: DiffSegment[] = [];
  const modTemp: DiffSegment[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === modified[j - 1]) {
      // Unchanged
      const text = original[i - 1];
      origTemp.unshift({ type: 'unchanged', text });
      modTemp.unshift({ type: 'unchanged', text });
      if (!isWhitespace(text)) unchangedWords++;
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Added in modified
      const text = modified[j - 1];
      modTemp.unshift({ type: 'added', text });
      if (!isWhitespace(text)) addedWords++;
      j--;
    } else if (i > 0) {
      // Removed from original
      const text = original[i - 1];
      origTemp.unshift({ type: 'removed', text });
      if (!isWhitespace(text)) removedWords++;
      i--;
    }
  }
  
  originalSegments.push(...origTemp);
  modifiedSegments.push(...modTemp);
  
  const totalWords = unchangedWords + removedWords + addedWords;
  const changePercent = totalWords > 0 
    ? Math.round(((addedWords + removedWords) / totalWords) * 100) 
    : 0;
  
  return {
    originalSegments,
    modifiedSegments,
    stats: {
      addedWords,
      removedWords,
      unchangedWords,
      changePercent,
    },
  };
}

/**
 * Check if token is whitespace
 */
function isWhitespace(text: string): boolean {
  return /^\s+$/.test(text);
}

/**
 * Merge consecutive segments of the same type for cleaner rendering
 */
function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return [];
  
  const merged: DiffSegment[] = [];
  let current = { ...segments[0] };
  
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].type === current.type) {
      current.text += segments[i].text;
    } else {
      merged.push(current);
      current = { ...segments[i] };
    }
  }
  merged.push(current);
  
  return merged;
}
