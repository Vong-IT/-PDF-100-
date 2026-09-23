import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import muhammara from "muhammara";
import dotenv from "dotenv";

dotenv.config();

// Global error handlers to prevent unexpected process crashes in production
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body limits for handling PDF files & high-res canvas exports
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Encrypt PDF with password (user password / owner password)
app.post("/api/pdf/encrypt", async (req, res) => {
  try {
    const { pdfBase64, userPassword, ownerPassword, permissions } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF data provided" });
    }
    if (!userPassword && !ownerPassword) {
      return res.status(400).json({ error: "Password is required to encrypt" });
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const inBuffer = Buffer.from(cleanBase64, "base64");

    const inStream = new (muhammara as any).PDFRStreamForBuffer(inBuffer);
    const outStream = new (muhammara as any).PDFWStreamForBuffer();

    const encryptOptions: any = {};
    if (userPassword) encryptOptions.userPassword = userPassword;
    if (ownerPassword) encryptOptions.ownerPassword = ownerPassword;
    if (!encryptOptions.ownerPassword && userPassword) {
      encryptOptions.ownerPassword = userPassword + "_owner";
    }

    // Protection flags: 4 = print, 8 = modify, 16 = copy, 32 = annot-forms
    let flag = 0;
    if (permissions?.canPrint) flag |= 4;
    if (permissions?.canModify) flag |= 8;
    if (permissions?.canCopy) flag |= 16;
    if (permissions?.canAnnotate) flag |= 32;
    if (flag > 0) {
      encryptOptions.userProtectionFlag = flag;
    }

    (muhammara as any).recrypt(inStream, outStream, encryptOptions);

    const encryptedBuffer: Buffer = outStream.buffer;
    const resultBase64 = encryptedBuffer.toString("base64");

    res.json({
      success: true,
      encryptedPdfBase64: `data:application/pdf;base64,${resultBase64}`,
      size: encryptedBuffer.length,
    });
  } catch (error: any) {
    console.error("Encryption error:", error);
    res.status(500).json({
      error: error.message || "Failed to encrypt PDF with password",
    });
  }
});

// 2. Decrypt PDF with existing password
app.post("/api/pdf/decrypt", async (req, res) => {
  try {
    const { pdfBase64, password } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF data provided" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required to decrypt" });
    }

    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const inBuffer = Buffer.from(cleanBase64, "base64");

    const inStream = new (muhammara as any).PDFRStreamForBuffer(inBuffer);
    const outStream = new (muhammara as any).PDFWStreamForBuffer();

    (muhammara as any).recrypt(inStream, outStream, {
      password: password,
    });

    const decryptedBuffer: Buffer = outStream.buffer;
    const resultBase64 = decryptedBuffer.toString("base64");

    res.json({
      success: true,
      decryptedPdfBase64: `data:application/pdf;base64,${resultBase64}`,
      size: decryptedBuffer.length,
    });
  } catch (error: any) {
    console.error("Decryption error:", error);
    res.status(400).json({
      error: "Incorrect password or unable to decrypt this document.",
    });
  }
});

// Helper function to call Gemini with exponential backoff and fallback models
async function generateOCRWithRetry(
  ai: GoogleGenAI,
  cleanBase64: string,
  mimeType: string,
  promptText: string,
  systemPrompt: string
): Promise<{ text: string; modelUsed: string }> {
  // Candidate models: start with gemini-3.1-flash-lite (fastest, high quota availability), fall back to gemini-3.8-flash & gemini-flash-latest
  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
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
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
          },
        });

        return {
          text: response.text || "",
          modelUsed: model,
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
        const isQuotaOrRateLimit =
          err?.status === 429 ||
          err?.code === 429 ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Quota exceeded") ||
          errMsg.includes("rate-limit") ||
          errMsg.includes("billing details");

        const is503Unavailable =
          err?.status === 503 ||
          err?.code === 503 ||
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand");

        if (isQuotaOrRateLimit) {
          console.warn(`[OCR Model Skip] Model ${model} hit quota/rate limit. Advancing immediately to next candidate model...`);
          // Immediately break to next candidate model without waiting
          break;
        }

        if (is503Unavailable) {
          console.warn(`[OCR Retry] Model ${model} attempt ${attempt + 1} hit 503/high-demand. Retrying...`);
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
          break;
        }

        console.error(`[OCR Error] Non-retriable error with model ${model}:`, err);
        // Try next candidate model before giving up
        break;
      }
    }
  }

  throw lastError || new Error("AI OCR service is currently experiencing high demand. Please try again or switch to 'Embed Original Images' mode.");
}

// 3. Gemini AI Khmer OCR & Layout Preservation
app.post("/api/pdf/ocr-khmer", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", pageNumber, preserveLayout = true } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided for OCR" });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "").trim();
    const sanitizedMime = mimeType && mimeType.startsWith("image/") ? mimeType : "image/jpeg";
    const ai = getGeminiClient();

    const systemPrompt = `You are a world-class document transcription and OCR specialist with native mastery of the Khmer language (ភាសាខ្មែរ), complex Khmer typography, subscript consonants (ជើងអក្សរ - cheung), independent vowels, bantoc, reahmuk, kakabat, and Khmer punctuation (។ , ៕).

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
4. TABLES PRESERVATION & MULTI-PAGE CONTINUATION (សូមរក្សាតារាងអោយមានគ្រប់ទំព័រទោះបីក្នុងតារាងមានរូបភាព Shape ឬ Bullet ក៏ដោយ):
   - TABLE CONTINUATION ACROSS ALL PAGES (រក្សាតារាងគ្រប់ទំព័រ): If a table spans multiple pages, or continues onto page 2, page 3, etc., ALWAYS transcribe it as a complete, valid Markdown table with headers and columns intact on EVERY page! NEVER collapse, flatten, or convert tables into plain text on any page!
   - BULLET POINTS INSIDE TABLE CELLS: If table cells contain bullet points, lists, or multiple lines (e.g. •..., ➢..., -..., 1....), transcribe them cleanly within the cell using '<br>' to separate lines (e.g. • ចំណុចទី១<br>• ចំណុចទី២<br>• ចំណុចទី៣).
   - SHAPES & BOXES INSIDE TABLE CELLS: If cells contain callout boxes, status badges, or colored highlights, preserve them inside the cell using inline syntax (e.g. [box]...[/box], [badge]...[/badge], or [bg:#HEX]...[/bg]).
   - IMAGES & DIAGRAMS INSIDE TABLE CELLS: If cells contain embedded images, illustrations, or diagrams, preserve them inside the cell (e.g. ![រូបភាព](...) or [រូបភាព: ...]).
   - EXAMPLE:
     | ល.រ | កម្មវិធី និងសកម្មភាព | ខ្លឹមសារលម្អិត | ស្ថានភាព |
     | :---: | :--- | :--- | :---: |
     | ០១ | • បង្ហាញរូបភាព និងពន្យល់<br>• ពិភាក្សាជាក្រុម | [box]ខ្លឹមសារសំខាន់[/box]<br>• ធាតុទី១<br>• ធាតុទី២ | [bg:#ECFDF5]រួចរាល់[/bg] |
   - Preserve all rows, columns, alignments, and cell contents faithfully across every page without losing data.
5. SHAPES, METADATA BOXES & EMBEDDED GRAPHICS (រក្សាទុករូបរាង Shape, ប្រអប់ព័ត៌មានក្បាលទំព័រ/កិច្ចតែងការបង្រៀន, ត្រា Seal):
   - If the page contains a decorative Seal box, Badge, Ribbon, Banner, or Announcement/Metadata Box (e.g. Lesson Plan Header / កិច្ចតែងការបង្រៀន, Course Info, Syllabus Box):
     Wrap with:
     :::shape type="seal-box" borderColor="1D4ED8" bg="EFF6FF" textColor="1E3A8A" border="double" align="left"
     ខ្លឹមសារនៅក្នុង Shape...
     :::
     CRITICAL ALIGNMENT RULE: If the text inside the box is left-aligned in the original document (e.g. key-values like "**កាលបរិច្ឆេទ** : ...", "**ថ្នាក់ទី** : ...", bullet points), ALWAYS keep it LEFT-ALIGNED (align="left"). NEVER center text that was left-aligned in the original document!
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
   - Bullets and list items must always remain LEFT-ALIGNED with proper hierarchy and indentation as in the original document.
7. NO ARTIFICIAL HEADERS (កុំយកបន្ថែមចំណងជើងធ្វើជា Header ព្រោះ Header មានស្រាប់រួចហើយនៅក្នុងច្បាប់ដើម):
   - The document already has its authentic header/layout in the original content (such as ministry or institution name, royal motto, or lesson plan box).
   - NEVER invent, prepend, or duplicate an artificial title as a Header at the top (e.g. do NOT add an unprompted '# File Name' or extra header at the top).
   - Transcribe strictly from top to bottom exactly as formatted in the original document.
8. HEADINGS: Mark top-level document titles actually present in the text with '# ', major sections with '## ', subsections with '### '.
9. CLEAN OUTPUT: Output ONLY the clean transcribed document content without any preface like "Here is the transcription:".`;

    const promptText = `Transcribe the text, font styles ([muol], **bold**, *italic*), document layout (header-layout, signature-layout, tables), and any shapes/seals (:::shape) from this page (Page ${pageNumber || 1}) with strict Khmer typography fidelity ('អក្សរមិនខុសដៃជើង') and visual shape style/color preservation for lossless Microsoft Word conversion.`;

    const result = await generateOCRWithRetry(ai, cleanBase64, sanitizedMime, promptText, systemPrompt);

    res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
      pageNumber: pageNumber || 1,
    });
  } catch (error: any) {
    console.error("OCR error:", error);
    const errMsg = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    const isHighDemand =
      error?.status === 503 ||
      error?.code === 503 ||
      errMsg.includes("503") ||
      errMsg.includes("high demand") ||
      errMsg.includes("UNAVAILABLE");

    res.status(isHighDemand ? 503 : 500).json({
      success: false,
      error: isHighDemand
        ? "ម៉ូដែល AI កំពុងមានអ្នកប្រើប្រាស់ច្រើនក្នុងពេលដំណាលគ្នា (503 High Demand)។ សូមចុច 'ព្យាយាមម្តងទៀត' ឬប្រើប្រាស់ទាញយកអត្ថបទដើមក្នុងឯកសារ (Native Text)។"
        : (error.message || "Failed to process OCR transcription"),
      isHighDemand: !!isHighDemand,
    });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const distIndexExists = fs.existsSync(path.join(distPath, "index.html"));

  // Check whether we should run in production mode:
  // 1. NODE_ENV === 'production'
  // 2. Running in Google Cloud Run (K_SERVICE or K_REVISION environment variables set)
  // 3. Built dist exists AND we are not explicitly running npm run dev
  const isExplicitDev = process.env.NODE_ENV === "development" || process.env.npm_lifecycle_event === "dev";
  const isProduction =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.K_REVISION) ||
    (distIndexExists && !isExplicitDev);

  if (isProduction && distIndexExists) {
    console.log(`[Production] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[Development] Initializing Vite middleware mode");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`PDF Studio Server running on http://0.0.0.0:${PORT} (mode: ${isProduction && distIndexExists ? "production" : "development"})`);
  });

  // Handle graceful termination signals from Cloud Run container manager
  const shutdown = (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
    // Force close if it takes too long
    setTimeout(() => {
      console.error("Forcing shutdown after timeout");
      process.exit(1);
    }, 5000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
