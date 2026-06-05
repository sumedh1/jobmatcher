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

async function searchJobs(profile) {
  const queries = [
    `${profile.title} in ${profile.location || 'India'}`,
    `${(profile.skills || []).slice(0, 2).join(' ')} engineer ${profile.location || 'Pune'}`
  ];
  let allJobs = [];
  for (const query of queries) {
    try {
      const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: {
          query: query,
          page: '1',
          num_pages: '1',
          country: 'in'
        },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      });
      const jobs = response.data.data || [];
      allJobs = allJobs.concat(jobs.map(job => ({
        title: job.job_title,
        company_name: job.employer_name,
        location: `${job.job_city || ''} ${job.job_country || ''}`.trim(),
        via: job.job_publisher,
        description: job.job_description,
        related_links: [{ link: job.job_apply_link }],
        detected_extensions: {
          posted_at: job.job_posted_at_datetime_utc
            ? job.job_posted_at_datetime_utc.substring(0, 10)
            : 'Recently'
        }
      })));
    } catch (err) {
      console.error('JSearch error:', err.message);
    }
  }
  const seen = new Set();
  return allJobs.filter(job => {
    const key = `${job.title}-${job.company_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function scoreJob(profile, job) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Score this resume vs job. Return ONLY valid JSON.
Format:
{
  "score": 0-100,
  "matching_skills": [],
  "missing_skills": [],
  "reason": "one sentence"
}
Resume: ${JSON.stringify(profile)}
Job title: ${job.title}
Job description: ${(job.description || '').substring(0, 600)}`
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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    console.log('Parsing resume...');
    const pdfData = await pdfParse(req.file.buffer);
    const profile = await parseResumeWithClaude(pdfData.text);
    console.log('Resume parsed:', profile.name, profile.title);
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
    console.log('Searching jobs for:', profile.title);
    const jobs = await searchJobs(profile);
    console.log('Found jobs:', jobs.length);
    const top = jobs.slice(0, 10);
    const scored = await Promise.all(top.map(async job => {
      const match = await scoreJob(profile, job);
      return {
        title: job.title,
        company: job.company_name,
        location: job.location,
        via: job.via,
        description: (job.description || '').substring(0, 300),
        apply_link: job.related_links?.[0]?.link || '#',
        posted: job.detected_extensions?.posted_at || 'Recently',
        score: match.score,
        matching_skills: match.matching_skills,
        missing_skills: match.missing_skills,
        reason: match.reason
      };
    }));
    scored.sort((a, b) => b.score - a.score);
    res.json({ success: true, jobs: scored });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
