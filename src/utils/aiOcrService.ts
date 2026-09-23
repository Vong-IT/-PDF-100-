import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEY_STORAGE = 'gemini_api_key';

/**
 * Get stored Gemini API Key from localStorage or environment
 */
export function getStoredGeminiApiKey(): string {
  try {
    const key = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (key && key.trim()) return key.trim();
  } catch (_e) {}

  // Fallback to Vite env var if provided during build
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return String(import.meta.env.VITE_GEMINI_API_KEY).trim();
  }

  return '';
}

/**
 * Save user Gemini API key to localStorage
 */
export function setStoredGeminiApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    }
  } catch (_e) {}
}

/**
 * Detect if application is running in a static environment without backend (e.g. GitHub Pages)
 */
export function isStaticHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.endsWith('github.io') || host.endsWith('surge.sh') || host.endsWith('vercel.app');
}

export interface OcrResult {
  text: string;
  modelUsed?: string;
  source: 'backend' | 'client-gemini';
}

const KHMER_OCR_SYSTEM_PROMPT = `You are a world-class document transcription and OCR specialist with native mastery of the Khmer language (ភាសាខ្មែរ), complex Khmer typography, subscript consonants (ជើងអក្សរ - cheung), independent vowels, bantoc, reahmuk, kakabat, and Khmer punctuation (។ , ៕).

CRITICAL ACCURACY, FONT STYLE & WORD LAYOUT INSTRUCTIONS:
1. KHMER TYPOGRAPHY FIDELITY: Preserve every Khmer word with 100% spelling and subscript accuracy. Ensure subscripts (ជើង) are never separated, broken, or dropped ("អក្សរមិនខុសដៃជើង").
2. FONT STYLES PRESERVATION (រក្សាម៉ូដអក្សរ):
   - អក្សរមូល (Khmer OS Muol / Muol Light): If royal mottos ("ព្រះរាជាណាចក្រកម្ពុជា", "ជាតិ  សាសនា  ព្រះមហាក្សត្រ"), ministry headers, or proclamation/certificate titles (e.g. "ប្រកាស", "សេចក្តីសម្រេច", "លិខិតបញ្ជាក់", "វិញ្ញាបនបត្រ") are written in decorative/calligraphic Khmer script (អក្សរមូល), wrap them with [muol]...[/muol].
   - Bold text: Wrap bold terms, article headers ("ប្រការ ១", "មាត្រា"), subject lines ("កម្មវត្ថុ៖", "យោង៖") in **bold**.
   - Italic/Oblique text: Wrap in *italic*.
   - Colored text: If text is colored (e.g. red seal, green status), wrap with [color:COLOR_OR_HEX]...[/color].
3. ADMINISTRATIVE DOCUMENT LAYOUT PRESERVATION (ទម្រង់ Layout):
   - Two-Column Header (ក្រសួងនៅឆ្វេង និង ព្រះរាជាណាចក្រកម្ពុជានៅស្តាំ ឬ កាលបរិច្ឆេទនៅស្តាំ):
     Wrap with:
     :::header-layout
     [left]
     ក្រសួង...
     អគ្គនាយកដ្ឋាន...
     លេខ៖ ...
     [/left]
     [right]
     [muol]ព្រះរាជាណាចក្រកម្ពុជា[/muol]
     [muol]ជាតិ  សាសនា  ព្រះមហាក្សត្រ[/muol]
     [flourish]
     រាជធានីភ្នំពេញ, ថ្ងៃទី...
     [/right]
     :::
   - Centered Lines: Wrap centered titles or slogans with [center]...[/center].
   - Date & Signature Block (ហត្ថលេខា និងត្រានៅស្តាំក្រោម):
     Wrap with:
     :::signature-layout
     [date]ធ្វើនៅ..., ថ្ងៃទី... ខែ... ឆ្នាំ...[/date]
     [role]ប្រធាននាយកដ្ឋាន...[/role]
     [seal]ត្រាផ្លូវការ[/seal]
     [name]ឈ្មោះហត្ថលេខី[/name]
     :::
     or mark right-aligned dates/signatures with [right]...[/right].
4. TABLES FIDELITY, EMPTY ROWS & ROW PRESERVATION (រក្សាជួរតារាង និងក្រឡាតារាងទាំងអស់នៅដដែល ១០០% ទោះបីជួរនោះគ្មានទិន្នន័យក៏ដោយ):
   - ABSOLUTE ROW POSITION & INTEGRITY (រក្សាជួរដេក និងជួរឈរឱ្យនៅទីតាំងដើមដដែល):
     * NEVER omit, skip, delete, or merge empty rows! If a row in the original document has no data, you MUST transcribe it as an empty Markdown row with all column pipes intact (e.g., '| | | |').
     * NEVER shift or slide cells to the left when a cell is blank! If a cell has no data, output empty space between pipes '| |'.
     * Rows and cells with data MUST remain in their exact, original row index and column index without any shifting!
     * TABLE CONTINUATION ACROSS ALL PAGES (រក្សាតារាងគ្រប់ទំព័រ): If a table spans multiple pages, or continues onto page 2, page 3, etc., ALWAYS transcribe it as a complete, valid Markdown table with headers and columns intact on EVERY page! NEVER collapse, flatten, or convert tables into plain text on any page!
   - BULLET POINTS INSIDE TABLE CELLS: If table cells contain bullet points, lists, or multiple lines (e.g. •..., ➢..., -..., 1....), transcribe them cleanly within the cell using '<br>' to separate lines.
   - SHAPES & BOXES INSIDE TABLE CELLS: If cells contain callout boxes, status badges, or colored highlights, preserve them inside the cell using inline syntax (e.g. [box]...[/box], [badge]...[/badge], or [bg:#HEX]...[/bg]).
   - IMAGES & DIAGRAMS INSIDE TABLE CELLS: If cells contain embedded images, illustrations, or diagrams, preserve them inside the cell (e.g. ![រូបភាព](...) or [រូបភាព: ...]).
   - Preserve all rows, columns, alignments, and cell contents faithfully across every page without losing data.
5. SHAPES, METADATA BOXES & EMBEDDED GRAPHICS (រក្សាទុករូបរាង Shape, ប្រអប់ព័ត៌មានក្បាលទំព័រ/កិច្ចតែងការបង្រៀន, ត្រា Seal):
   - If the page contains a decorative Seal box, Badge, Ribbon, Banner, or Announcement/Metadata Box (e.g. Lesson Plan Header / កិច្ចតែងការបង្រៀន, Course Info, Syllabus Box):
     Wrap with:
     :::shape type="seal-box" borderColor="1D4ED8" bg="EFF6FF" textColor="1E3A8A" border="double" align="left"
     ខ្លឹមសារនៅក្នុង Shape...
     :::
     Available types: seal-box, badge, ribbon, rounded-box, banner, callout, stamp-circle, header-accent, divider-shape.
   - If there is a standalone graphic seal or circular stamp with text, transcribe with :::shape type="stamp-circle" borderColor="DC2626" textColor="B91C1C" title="ត្រា / Official Seal" ... :::
6. BULLET POINTS & LISTS FIDELITY (រក្សាទម្រង់ Bullet ដូចច្បាប់ដើម ១០០%):
   - Preserve the EXACT bullet marker style from the original document:
     - Standard disc bullet: • ...
     - Arrow bullet: ➢ ...
     - Square bullet: ▪ ...
     - Diamond bullet: ◆ ...
     - Hyphen/dash bullet: - ...
     - Numbered lists: 1. ... or ០១. ...
     - Khmer alphabet lists: ក. ... or (ក) ...
     - Checklists: - [ ] ... or - [x] ... or ☑ ...
   - Bullets and list items must always remain LEFT-ALIGNED with proper hierarchy and indentation.
7. NO ARTIFICIAL HEADERS: Output strictly from top to bottom without duplicating or adding unprompted title headers.
8. HEADINGS: Mark top-level document titles actually present in the text with '# ', major sections with '## ', subsections with '### '.
9. CLEAN OUTPUT: Output ONLY the clean transcribed document content without conversational preface.`;

/**
 * Perform client-side Gemini AI OCR in browser
 */
async function performClientGeminiOcr(
  apiKey: string,
  cleanBase64: string,
  mimeType: string,
  pageNumber = 1
): Promise<{ text: string; modelUsed: string }> {
  const ai = new GoogleGenAI({ apiKey });

  const promptText = `Transcribe the text, font styles ([muol], **bold**, *italic*), document layout (header-layout, signature-layout, tables), and any shapes/seals (:::shape) from this page (Page ${pageNumber}) with strict Khmer typography fidelity ('អក្សរមិនខុសដៃជើង') and visual shape style/color preservation for lossless Microsoft Word conversion.
CRITICAL TABLE FIDELITY: Keep all table rows and columns strictly in their exact positions. Even if a row has no data (empty/blank row), preserve that empty row in Markdown (e.g. '| | | |'). Rows with data must remain in their exact original row and column index without shifting or collapsing.`;

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/png',
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction: KHMER_OCR_SYSTEM_PROMPT,
            temperature: 0.1,
          },
        });

        return {
          text: response.text || '',
          modelUsed: model,
        };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`[Client Gemini] Model ${model} attempt ${attempt + 1} error:`, msg);

        // If invalid key or quota, don't keep retrying same model
        if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
          throw new Error('API Key មិនត្រឹមត្រូវទេ។ សូមពិនិត្យមើល Gemini API Key របស់អ្នកម្តងទៀត។');
        }
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          break; // Try next model
        }
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('មិនអាចដំណើរការ AI OCR បានទេ។ សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត ឬ API Key របស់អ្នក។');
}

/**
 * Universal OCR function:
 * 1. Checks if backend is available and working.
 * 2. If backend fails or not present (GitHub Pages), runs directly in client using user's Gemini key.
 * 3. If no key, throws 'NO_GEMINI_API_KEY' with helpful details.
 */
export async function extractKhmerOcr(params: {
  imageBase64: string;
  mimeType?: string;
  pageNumber?: number;
  preserveLayout?: boolean;
}): Promise<OcrResult> {
  const { imageBase64, mimeType = 'image/png', pageNumber = 1, preserveLayout = true } = params;
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').trim();
  const sanitizedMime = mimeType.startsWith('image/') ? mimeType : 'image/png';

  // If not explicitly on a static host, try backend first
  if (!isStaticHost()) {
    try {
      const response = await fetch('/api/pdf/ocr-khmer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType: sanitizedMime,
          pageNumber,
          preserveLayout,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.text) {
          return {
            text: data.text,
            modelUsed: data.modelUsed,
            source: 'backend',
          };
        }
      } else {
        const errPayload = await response.json().catch(() => null);
        if (response.status === 429 || errPayload?.isRateLimit) {
          // If user configured a personal API key, seamlessly switch to their key!
          const userApiKey = getStoredGeminiApiKey();
          if (userApiKey) {
            console.log('[OCR Service] Backend hit rate limit, seamlessly trying with personal Gemini API Key...');
            const result = await performClientGeminiOcr(userApiKey, cleanBase64, sanitizedMime, pageNumber);
            return {
              text: result.text,
              modelUsed: result.modelUsed,
              source: 'client-gemini',
            };
          }

          const rateErr: any = new Error(
            errPayload?.error ||
              'កម្រិតស្នើសុំ AI ឥតគិតថ្លៃបានដល់កម្រិតកំណត់ (429 Rate Limit)។ សូមរង់ចាំបន្តិច ឬបញ្ចូល Gemini API Key ផ្ទាល់ខ្លួនរបស់អ្នក។'
          );
          rateErr.code = 'RATE_LIMIT';
          rateErr.retrySeconds = errPayload?.retrySeconds || 25;
          throw rateErr;
        }

        if (response.status === 503 || errPayload?.isHighDemand) {
          const demandErr: any = new Error(
            errPayload?.error || 'ម៉ូដែល AI កំពុងមានអ្នកប្រើប្រាស់ច្រើន (503 High Demand)។ សូមព្យាយាមម្តងទៀត។'
          );
          demandErr.code = 'HIGH_DEMAND';
          throw demandErr;
        }

        if (errPayload?.error) {
          throw new Error(errPayload.error);
        }
      }
    } catch (backendErr: any) {
      if (backendErr?.code === 'RATE_LIMIT' || backendErr?.code === 'HIGH_DEMAND') {
        throw backendErr;
      }
      console.warn('[OCR Service] Backend API error, checking client-side Gemini key fallback...', backendErr);
    }
  }

  // Fallback or Direct Client Mode: Check for Gemini API Key
  const userApiKey = getStoredGeminiApiKey();
  if (userApiKey) {
    const result = await performClientGeminiOcr(userApiKey, cleanBase64, sanitizedMime, pageNumber);
    return {
      text: result.text,
      modelUsed: result.modelUsed,
      source: 'client-gemini',
    };
  }

  // No API key and backend unavailable
  const error: any = new Error('NO_GEMINI_API_KEY');
  error.code = 'NO_GEMINI_API_KEY';
  throw error;
}
