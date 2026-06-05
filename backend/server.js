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

async function callGroq(prompt) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    console.log('Processing resume...');
    const text = await extractTextFromPDF(req.file.buffer);
    console.log('PDF extracted, length:', text.length);

    const prompt = `You are a resume expert and job matcher. Analyze this resume carefully and return ONLY valid JSON. No markdown, no backticks, no explanation, just raw JSON.

Return exactly this format:
{
  "profile": {
    "name": "",
    "title": "",
    "location": "",
    "years_experience": 0,
    "skills": [],
    "job_titles": [],
    "certifications": [],
    "summary": ""
  },
  "analysis": {
    "overall_score": 0,
    "ats_score": 0,
    "scores": {
      "formatting": 0,
      "keywords": 0,
      "experience": 0,
      "skills": 0,
      "education": 0
    },
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "suggestions": [
      { "priority": "high", "title": "suggestion title", "detail": "one sentence explanation" },
      { "priority": "high", "title": "suggestion title", "detail": "one sentence explanation" },
      { "priority": "medium", "title": "suggestion title", "detail": "one sentence explanation" },
      { "priority": "low", "title": "suggestion title", "detail": "one sentence explanation" }
    ],
    "keywords_found": ["kw1", "kw2", "kw3", "kw4", "kw5"],
    "keywords_missing": ["kw1", "kw2", "kw3", "kw4", "kw5"],
    "experience_summary": "2 sentence summary of work experience",
    "education_summary": "1 sentence summary of education",
    "ats_issues": ["issue1", "issue2"]
  },
  "jobs": [
    {
      "title": "job title",
      "company": "company name",
      "location": "city, India",
      "via": "LinkedIn",
      "score": 85,
      "matching_skills": ["skill1", "skill2"],
      "missing_skills": ["skill1"],
      "reason": "one sentence why this is a good match",
      "posted": "2 days ago",
      "apply_link": "https://www.linkedin.com/jobs/search/?keywords=security+engineer&location=India"
    }
  ]
}

Rules for jobs array:
- Generate exactly 10 jobs
- Use real Indian companies: TCS, Infosys, Wipro, HCL, Microsoft India, Google India, Amazon India, Flipkart, Paytm, HDFC Bank, Barclays, IBM, Capgemini, Accenture, Cognizant, Zomato, Swiggy, Razorpay, PhonePe, Freshworks
- Score jobs between 60 and 98 based on actual skill match
- Vary platforms: LinkedIn, Naukri, Glassdoor, Indeed, Foundit
- posted can be: "Today", "1 day ago", "2 days ago", "3 days ago", "1 week ago"

Resume to analyze:
${text}`;

    console.log('Calling Groq (single call)...');
    const raw = await callGroq(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const result = JSON.parse(jsonMatch[0]);
    result.jobs = (result.jobs || []).sort((a, b) => b.score - a.score);
    console.log('Done! Score:', result.analysis.overall_score, '| Jobs:', result.jobs.length);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));