# Secure PDF Manager & Khmer Converter (កម្មវិធីគ្រប់គ្រង PDF & បម្លែងឯកសារខ្មែរ)

កម្មវិធីគ្រប់គ្រងឯកសារ PDF បម្លែងរូបភាព ស្រង់អក្សរខ្មែរ (AI OCR) ទៅជា Word (.docx) និង Excel (.xlsx) រួមទាំងប្រព័ន្ធចាក់សោការពារឯកសារ។

---

## 🚀 របៀបដោះស្រាយបញ្ហា "GitHub Pages White Page" (Fix White Screen on GitHub Pages)

ប្រសិនបើលោកអ្នកជួបបញ្ហា **ទំព័រស (White / Blank Screen)** នៅពេលដាក់ដំណើរការលើ GitHub Pages សូមអនុវត្តតាមជំហានណាមួយខាងក្រោម៖

### វិធីសាស្ត្រទី ១ (ងាយស្រួលបំផុត - Recommended via GitHub Pages Settings):
1. ចូលទៅកាន់ **GitHub Repository** របស់អ្នក
2. ចុចលើ **Settings** (នៅផ្នែកខាងលើ)
3. នៅម៉ឺនុយខាងឆ្វេង ចុចលើ **Pages**
4. នៅត្រង់ **Build and deployment > Source**៖
   - ប្រសិនបើជ្រើសរើស **"Deploy from a branch"**៖
     - **Branch**: ជ្រើសរើស `main` ឬ `gh-pages`
     - **Folder**: ជ្រើសរើស `/docs` (ប្រសិនបើជ្រើសរើស `main`) ឬ `/(root)` (ប្រសិនបើជ្រើសរើស `gh-pages`)
     - ចុច **Save**
   - ឬប្រសិនបើជ្រើសរើស **"GitHub Actions"**៖
     - ប្រព័ន្ធនឹងដំណើរការ Workflow `.github/workflows/deploy.yml` ដោយស្វ័យប្រវត្តិនៅពេលលោកអ្នក Push កូដថ្មី។

---

## ⚡ ការប្រើប្រាស់មុខងារបម្លែងឯកសារលើ GitHub Pages (Using Conversion Features on GitHub Pages)

ដោយសារ GitHub Pages គឺជា Static Hosting (គ្មាន Node.js Server Backend) កម្មវិធីត្រូវបានកែលម្អយ៉ាងពិសេស៖

1. **ស្រង់អក្សរផ្ទាល់ពី PDF (Native PDF Extraction) - ១០០% ឥតគិតថ្លៃ និងដំណើរការលើ Browser ផ្ទាល់**៖
   - ដំណើរការភ្លាមៗដោយស្វ័យប្រវត្តិនៅលើ GitHub Pages ដោយមិនបាច់ត្រូវការ API Key ឬ Server ឡើយ។
   - អាចទាញយកជាឯកសារ Microsoft Word (.docx) និង Excel (.xlsx) ដោយរក្សាបានទ្រង់ទ្រាយ អក្សរខ្មែរ និងតារាងយ៉ាងពេញលេញ។

2. **ស្រង់អក្សររូបភាពតាម AI (Client-Side Gemini AI OCR) លើ Browser**៖
   - ប្រសិនបើចង់ស្រង់អក្សរខ្មែរពីរូបភាពស្កេន (Scanned Images/PDF) លោកអ្នកគ្រាន់តែចុចលើប៊ូតុង **«🔑 ភ្ជាប់ API Key»** នៅផ្នែកខាងលើ Header។
   - បញ្ចូល Gemini API Key ឥតគិតថ្លៃ (Free Key ពី [Google AI Studio](https://aistudio.google.com/app/apikey))។ Key ត្រូវបានរក្សាទុកតែនៅក្នុង Browser របស់អ្នកផ្ទាល់ប៉ុណ្ណោះ។

3. **បម្លែងរូបភាពទៅជា Word (Image to Word)**៖
   - របៀប «បង្កប់រូបភាពដើមក្នុង Word (Embed Original Images)» ដំណើរការ ១០០% លើ Browser ដោយគ្មានត្រូវការ Server ឬ Key។

4. **សុវត្ថិភាពឯកសារ (Security & Watermarking)**៖
   - មុខងារ «ត្រាទឹកសម្ងាត់ (Watermark)» ដំណើរការ ១០០% លើ Browser។

---

### English: How to Deploy to GitHub Pages (No White Screen)

If you see a blank white page on GitHub Pages, it is typically caused by:
1. **Missing trailing slash in URL**: The app now includes an auto-redirect from `https://username.github.io/repo` to `https://username.github.io/repo/` so relative assets load properly.
2. **Jekyll enabled**: A `.nojekyll` file has been placed in both `/public`, `/dist`, and `/docs` to disable Jekyll processing.
3. **Branch folder mismatch**:
   - In your GitHub repo, go to **Settings** > **Pages**.
   - Under **Build and deployment**:
     - **Option A (GitHub Actions)**: Choose `GitHub Actions` as the Source. Every push will automatically build and deploy the production bundle.
     - **Option B (Docs Folder)**: Choose `Deploy from a branch` -> Select `main` branch -> Select `/docs` folder -> Click **Save**.

---

## 🛠️ Local Development & Build

```bash
# ដំឡើង dependencies
npm install

# ដំណើរការ Development Server
npm run dev

# បង្កើត Production Build (dist & docs)
npm run build

# ដំណើរការ Production Server
npm start
```
