const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
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
        try { resolve(pdfParser.getRawTextContent()); } catch (e) { reject(e); }
      });
      pdfParser.parseBuffer(buffer);
    } catch (e) { reject(e); }
  });
}

async function callGroq(prompt, maxTokens = 2048) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content;
}

async function parseResumeWithGroq(resumeText) {
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
  "education": [],
  "summary": ""
}
Resume:
${resumeText}`;
  const raw = await callGroq(prompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

async function analyzeResumeWithGroq(resumeText, profile) {
  const prompt = `You are an expert resume coach and ATS specialist. Analyze this resume thoroughly and return ONLY valid JSON, no explanation, no markdown, no backticks.

Resume:
${resumeText}

Return this exact format:
{
  "overall_score": 0-100,
  "ats_score": 0-100,
  "scores": {
    "formatting": 0-100,
    "keywords": 0-100,
    "experience": 0-100,
    "skills": 0-100,
    "education": 0-100
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": [
    { "priority": "high", "title": "suggestion title", "detail": "one sentence detail" },
    { "priority": "high", "title": "suggestion title", "detail": "one sentence detail" },
    { "priority": "medium", "title": "suggestion title", "detail": "one sentence detail" },
    { "priority": "medium", "title": "suggestion title", "detail": "one sentence detail" },
    { "priority": "low", "title": "suggestion title", "detail": "one sentence detail" }
  ],
  "skills_present": ["skill1", "skill2"],
  "skills_missing": ["skill1", "skill2", "skill3"],
  "experience_summary": "2-3 sentence summary of experience",
  "education_summary": "1-2 sentence summary of education",
  "ats_issues": ["issue1", "issue2"],
  "keywords_found": ["keyword1", "keyword2", "keyword3"],
  "keywords_missing": ["keyword1", "keyword2", "keyword3"]
}`;
  const raw = await callGroq(prompt, 3000);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

async function generateJobMatches(profile) {
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
  const raw = await callGroq(prompt);
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
    const profile = await parseResumeWithGroq(text);
    console.log('Resume parsed:', profile.name, '-', profile.title);

    console.log('Analyzing resume...');
    const analysis = await analyzeResumeWithGroq(text, profile);
    console.log('Analysis done. Overall score:', analysis.overall_score);

    console.log('Generating job matches...');
    const jobs = await generateJobMatches(profile);
    console.log('Generated', jobs.length, 'job matches');
    jobs.sort((a, b) => b.score - a.score);

    res.json({ success: true, profile, analysis, jobs });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
