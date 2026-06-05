const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

async function extractTextFromPDF(buffer) {
  const pdfParse = require('pdf-parse');
  const fn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
  const data = await fn(buffer);
  return data.text;
}

async function parseResumeWithClaude(resumeText) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract data from this resume. Return ONLY valid JSON, no explanation.
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
${resumeText}`
      }]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );
  const raw = response.data.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

async function generateJobMatches(profile) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a job matching expert. Based on this resume profile, generate 10 realistic job matches that would exist on LinkedIn, Naukri, and Glassdoor in India right now.

Resume Profile:
${JSON.stringify(profile, null, 2)}

Return ONLY a valid JSON array of 10 jobs. No explanation. Format:
[
  {
    "title": "job title",
    "company": "real company name hiring for this role in India",
    "location": "city, India",
    "via": "LinkedIn / Naukri / Glassdoor / Indeed",
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
Vary the platforms between LinkedIn, Naukri, Glassdoor, Indeed, Foundit.`
      }]
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    }
  );
  const raw = response.data.content[0].text;
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch[0]);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    console.log('Parsing resume...');
    const text = await extractTextFromPDF(req.file.buffer);
    const profile = await parseResumeWithClaude(text);
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
