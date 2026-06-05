const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

async function parseResumeWithClaude(resumeText) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `Extract data from this resume. Return ONLY valid JSON, no explanation.\nFormat:\n{\n  "name": "",\n  "title": "",\n  "location": "",\n  "years_experience": 0,\n  "skills": [],\n  "job_titles": [],\n  "certifications": [],\n  "summary": ""\n}\nResume:\n${resumeText}` }]
    },
    { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } }
  );
  const raw = response.data.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

async function searchJobs(profile) {
  const queries = [
    `${profile.title} jobs in ${profile.location || 'India'}`,
    `${(profile.skills||[]).slice(0,3).join(' ')} engineer jobs ${profile.location || 'Pune'}`,
  ];
  let allJobs = [];
  for (const query of queries) {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: { engine: 'google_jobs', q: query, location: profile.location || 'Pune, Maharashtra, India', api_key: process.env.SERP_API_KEY, hl: 'en' }
      });
      allJobs = allJobs.concat(response.data.jobs_results || []);
    } catch (err) { console.error('SerpAPI error:', err.message); }
  }
  const seen = new Set();
  return allJobs.filter(job => { const key = `${job.title}-${job.company_name}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

async function scoreJob(profile, job) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: `Score this resume vs job. Return ONLY valid JSON.\nFormat:\n{\n  "score": 0-100,\n  "matching_skills": [],\n  "missing_skills": [],\n  "reason": "one sentence"\n}\nResume: ${JSON.stringify(profile)}\nJob title: ${job.title}\nJob description: ${(job.description||'').substring(0,600)}` }]
    },
    { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } }
  );
  const raw = response.data.content[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch[0]);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const pdfData = await pdfParse(req.file.buffer);
    const profile = await parseResumeWithClaude(pdfData.text);
    res.json({ success: true, profile });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post('/api/search-jobs', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'No profile' });
    const jobs = await searchJobs(profile);
    const top = jobs.slice(0, 10);
    const scored = await Promise.all(top.map(async job => {
      const match = await scoreJob(profile, job);
      return {
        title: job.title, company: job.company_name, location: job.location,
        via: job.via, description: (job.description||'').substring(0,300),
        apply_link: job.related_links?.[0]?.link || '#',
        posted: job.detected_extensions?.posted_at || 'Recently',
        score: match.score, matching_skills: match.matching_skills,
        missing_skills: match.missing_skills, reason: match.reason
      };
    }));
    scored.sort((a, b) => b.score - a.score);
    res.json({ success: true, jobs: scored });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));