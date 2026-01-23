import type { Source } from './verification';

export type CitationFormat = 'apa7' | 'mla9' | 'chicago17' | 'vancouver';

export interface CitationOptions {
  format: CitationFormat;
  sources: Source[];
}

// Helper to format author names
function formatAuthorsAPA(authors: string): string {
  // If already formatted or unknown
  if (!authors || authors === 'Unknown' || authors === 'Source web') {
    return authors;
  }
  
  // Split by common separators
  const authorList = authors.split(/,\s*(?:and|et|&)\s*|,\s*|\s+(?:and|et|&)\s+/i);
  
  if (authorList.length === 1) {
    return authorList[0].trim();
  }
  
  if (authorList.length === 2) {
    return `${authorList[0].trim()} & ${authorList[1].trim()}`;
  }
  
  // 3+ authors
  return `${authorList[0].trim()} et al.`;
}

function formatAuthorsMLA(authors: string): string {
  if (!authors || authors === 'Unknown') return authors;
  
  const authorList = authors.split(/,\s*(?:and|et|&)\s*|,\s*|\s+(?:and|et|&)\s+/i);
  
  if (authorList.length === 1) {
    return authorList[0].trim();
  }
  
  if (authorList.length === 2) {
    return `${authorList[0].trim()}, and ${authorList[1].trim()}`;
  }
  
  return `${authorList[0].trim()}, et al.`;
}

function formatAuthorsVancouver(authors: string): string {
  if (!authors || authors === 'Unknown') return authors;
  
  const authorList = authors.split(/,\s*(?:and|et|&)\s*|,\s*|\s+(?:and|et|&)\s+/i);
  
  if (authorList.length <= 6) {
    return authorList.map(a => a.trim()).join(', ');
  }
  
  return `${authorList.slice(0, 6).map(a => a.trim()).join(', ')}, et al.`;
}

export function generateAPA7(source: Source): string {
  const authors = formatAuthorsAPA(source.authors);
  const year = source.year || 'n.d.';
  const title = source.title;
  const journal = source.journal || '';
  const doi = source.verificationLinks?.doi;
  
  let citation = `${authors} (${year}). ${title}.`;
  
  if (journal) {
    citation += ` *${journal}*.`;
  }
  
  if (doi) {
    const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
    citation += ` ${doiUrl}`;
  }
  
  return citation;
}

export function generateMLA9(source: Source): string {
  const authors = formatAuthorsMLA(source.authors);
  const title = source.title;
  const journal = source.journal || '';
  const year = source.year || 'n.d.';
  const doi = source.verificationLinks?.doi;
  
  let citation = `${authors}. "${title}."`;
  
  if (journal) {
    citation += ` *${journal}*,`;
  }
  
  citation += ` ${year}.`;
  
  if (doi) {
    const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
    citation += ` ${doiUrl}.`;
  }
  
  return citation;
}

export function generateChicago17(source: Source): string {
  const authors = formatAuthorsAPA(source.authors); // Chicago author-date uses similar format
  const year = source.year || 'n.d.';
  const title = source.title;
  const journal = source.journal || '';
  const doi = source.verificationLinks?.doi;
  
  let citation = `${authors}. ${year}. "${title}."`;
  
  if (journal) {
    citation += ` *${journal}*.`;
  }
  
  if (doi) {
    const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
    citation += ` ${doiUrl}.`;
  }
  
  return citation;
}

export function generateVancouver(source: Source, index?: number): string {
  const authors = formatAuthorsVancouver(source.authors);
  const title = source.title;
  const journal = source.journal || '';
  const year = source.year || '';
  const doi = source.verificationLinks?.doi;
  
  let citation = '';
  
  if (index !== undefined) {
    citation += `${index + 1}. `;
  }
  
  citation += `${authors}. ${title}.`;
  
  if (journal) {
    citation += ` ${journal}.`;
  }
  
  if (year) {
    citation += ` ${year}.`;
  }
  
  if (doi) {
    const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
    citation += ` Available from: ${doiUrl}`;
  }
  
  return citation;
}

export function generateCitation(source: Source, format: CitationFormat, index?: number): string {
  switch (format) {
    case 'apa7':
      return generateAPA7(source);
    case 'mla9':
      return generateMLA9(source);
    case 'chicago17':
      return generateChicago17(source);
    case 'vancouver':
      return generateVancouver(source, index);
    default:
      return generateAPA7(source);
  }
}

export function generateAllCitations(sources: Source[], format: CitationFormat): string {
  return sources
    .map((source, index) => generateCitation(source, format, format === 'vancouver' ? index : undefined))
    .join('\n\n');
}

export function downloadAsRTF(content: string, filename: string): void {
  // Simple RTF wrapper
  const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\f0\\fs24
${content.replace(/\n/g, '\\par\n').replace(/\*/g, '')}
}`;
  
  const blob = new Blob([rtfContent], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
