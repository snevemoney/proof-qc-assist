import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseRequest {
  fileName: string;
  fileContent: string; // base64 encoded
  mimeType: string;
}

interface ParsedSource {
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
  content: string;
  studyType?: string;
}

// Simple PDF text extraction using regex patterns for common structures
function extractTextFromPDF(bytes: Uint8Array): string {
  const text = new TextDecoder('latin1').decode(bytes);
  const textContent: string[] = [];
  
  // Extract text between stream and endstream markers
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  
  while ((match = streamRegex.exec(text)) !== null) {
    const streamContent = match[1];
    // Look for text operators: Tj, TJ, ', "
    const textMatches = streamContent.match(/\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g);
    if (textMatches) {
      for (const tm of textMatches) {
        // Extract content within parentheses
        const extracted = tm.match(/\(([^)]*)\)/g);
        if (extracted) {
          textContent.push(...extracted.map(e => e.slice(1, -1)));
        }
      }
    }
  }
  
  // Also try to extract readable ASCII text directly
  const readableText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const combined = textContent.join(' ').trim();
  
  // Return whichever has more readable content
  return combined.length > 100 ? combined : readableText.substring(0, 50000);
}

// Extract text from plain text or markdown files
function extractTextFromTxt(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}

// Basic DOCX extraction (simplified - extracts text from XML)
function extractTextFromDocx(bytes: Uint8Array): string {
  const text = new TextDecoder('latin1').decode(bytes);
  
  // DOCX is a ZIP file, look for XML content
  const xmlContent: string[] = [];
  
  // Find <w:t> tags which contain text in Word documents
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  
  while ((match = textRegex.exec(text)) !== null) {
    if (match[1]) {
      xmlContent.push(match[1]);
    }
  }
  
  if (xmlContent.length > 0) {
    return xmlContent.join(' ').trim();
  }
  
  // Fallback: extract any readable text
  return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50000);
}

// Use AI to extract structured metadata from document content
async function extractMetadataWithAI(
  content: string, 
  fileName: string,
  apiKey: string
): Promise<ParsedSource> {
  const truncatedContent = content.substring(0, 8000); // Limit for token efficiency
  
  const prompt = `Analyze this academic document and extract structured metadata.

Document filename: ${fileName}
Document content (first part):
---
${truncatedContent}
---

Extract and return a JSON object with these fields:
- title: The paper/article title (required)
- authors: Author names as a single string, e.g., "Smith, J., Jones, M." (required)
- year: Publication year as string, e.g., "2023" (required, use current year if unknown)
- journal: Journal or publication name if found (optional)
- abstract: The abstract if present, or a brief summary of the document (optional)
- studyType: Type of study - one of: "Systematic Review", "Meta-Analysis", "RCT", "Cohort Study", "Case-Control", "Cross-Sectional", "Case Report", "Expert Opinion", "Qualitative Study", "Mixed Methods" (optional, only if clearly identifiable)

Return ONLY valid JSON, no markdown or explanation.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a metadata extraction assistant for academic documents. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error('AI metadata extraction failed:', response.status);
      throw new Error('AI extraction failed');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    // Clean up response - remove markdown code blocks if present
    const cleanJson = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const metadata = JSON.parse(cleanJson);
    
    return {
      title: metadata.title || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      authors: metadata.authors || 'Unknown Authors',
      year: metadata.year || new Date().getFullYear().toString(),
      journal: metadata.journal,
      abstract: metadata.abstract,
      content: content,
      studyType: metadata.studyType,
    };
  } catch (error) {
    console.error('Error extracting metadata with AI:', error);
    
    // Fallback to basic extraction
    return {
      title: fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      authors: 'Unknown Authors',
      year: new Date().getFullYear().toString(),
      content: content,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { fileName, fileContent, mimeType }: ParseRequest = await req.json();

    if (!fileName || !fileContent) {
      return new Response(
        JSON.stringify({ error: 'fileName and fileContent are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing document: ${fileName}, mimeType: ${mimeType}`);

    // Decode base64 content
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract text based on file type
    let extractedText = '';
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.endsWith('.pdf') || mimeType === 'application/pdf') {
      extractedText = extractTextFromPDF(bytes);
    } else if (lowerFileName.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedText = extractTextFromDocx(bytes);
    } else if (lowerFileName.endsWith('.doc') || mimeType === 'application/msword') {
      // Basic DOC handling (limited support)
      extractedText = extractTextFromDocx(bytes);
    } else if (lowerFileName.endsWith('.txt') || mimeType === 'text/plain') {
      extractedText = extractTextFromTxt(bytes);
    } else {
      // Try to extract as text
      extractedText = extractTextFromTxt(bytes);
    }

    if (!extractedText || extractedText.length < 50) {
      console.warn('Minimal text extracted, using filename as fallback');
      extractedText = `Document: ${fileName}`;
    }

    console.log(`Extracted ${extractedText.length} characters from ${fileName}`);

    // Extract metadata using AI
    const parsedSource = await extractMetadataWithAI(extractedText, fileName, apiKey);

    return new Response(
      JSON.stringify(parsedSource),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error parsing document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse document';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});