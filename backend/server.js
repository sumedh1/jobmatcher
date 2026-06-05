const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const PDFParser = require('pdf2json');
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataError', errData => reject(new Error(errData.parserError)));
      pdfParser.on('pdfParser_dataReady', () => {
        try {
          const text = pdfParser.getRawTextContent();
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
      pdfParser.parseBuffer(buffer);
    } catch (e) {
      reject(e);
    }
  });
}

async function parseResumeWithGemini(resumeText) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Extract data from this resume. Return ONLY valid JSON, no explanation, no markdown, no backticks.
Format:
{
  "name": "",
  "title": "",
  "location": "",
  "years_experience": 0,
  "skills": [],
  "job_titles": [],
  "certifications": [],
  "summary": ""
}
Resume:
${resumeText}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

async function generateJobMatches(profile) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a job matching expert. Based on this resume profile, generate 10 realistic job matches that would exist on LinkedIn, Naukri, and Glassdoor in India right now.

Resume Profile:
${JSON.stringify(profile, null, 2)}

Return ONLY a valid JSON array of 10 jobs. No explanation, no markdown, no backticks. Format:
[
  {
    "title": "job title",
    "company": "real company name hiring for this role in India",
    "location": "city, India",
    "via": "LinkedIn",
    "score": 85,
    "matching_skills": ["skill1", "skill2", "skill3"],
    "missing_skills": ["skill1"],
    "reason": "one sentence why this matches",
    "posted": "2 days ago",
    "apply_link": "https://www.linkedin.com/jobs/search/?keywords=security+engineer&location=India"
  }
]

Make companies realistic (Infosys, TCS, Wipro, Accenture, Microsoft, Google, Amazon, Flipkart, Zomato, Paytm, HDFC, Barclays, Citi, IBM, Capgemini, etc).
Score each job 60-98 based on how well the skills match.
Vary the platforms between LinkedIn, Naukri, Glassdoor, Indeed, Foundit.`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch[0]);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    console.log('Parsing resume...');
    const text = await extractTextFromPDF(req.file.buffer);
    console.log('PDF text extracted, length:', text.length);
    const profile = await parseResumeWithGemini(text);
    console.log('Resume parsed:', profile.name, '-', profile.title);
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Parse error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/search-jobs', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'No profile' });
    console.log('Generating job matches for:', profile.title);
    const jobs = await generateJobMatches(profile);
    console.log('Generated', jobs.length, 'job matches');
    jobs.sort((a, b) => b.score - a.score);
    res.json({ success: true, jobs });
  } catch (err) {
    console.error('Job generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
