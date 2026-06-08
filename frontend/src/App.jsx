import { useState } from 'react'

const API = 'http://localhost:5000/api'

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #050810; color: #e8eaf0; min-height: 100vh; }
  .app { min-height: 100vh; background: #050810; position: relative; overflow-x: hidden; }
  .bg-grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; z-index: 0; }
  .bg-glow { position: fixed; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%); top: -200px; left: -100px; pointer-events: none; z-index: 0; }
  .bg-glow2 { position: fixed; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%); bottom: -100px; right: -100px; pointer-events: none; z-index: 0; }
  .wrap { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; padding: 0 24px; }
  nav { padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #2563EB, #7C3AED); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .logo-text { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #fff; }
  .logo-text span { color: #60A5FA; }
  .nav-badge { font-size: 12px; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(37,99,235,0.4); color: #60A5FA; background: rgba(37,99,235,0.08); }
  .hero { text-align: center; padding: 80px 0 60px; }
  .hero-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(37,99,235,0.3); background: rgba(37,99,235,0.08); font-size: 13px; color: #93C5FD; margin-bottom: 28px; }
  .hero-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  @keyframes spin { to { transform: rotate(360deg); } }
  .hero h1 { font-family: 'Syne', sans-serif; font-size: clamp(36px, 6vw, 64px); font-weight: 800; line-height: 1.1; color: #fff; margin-bottom: 20px; }
  .hero h1 .grad { background: linear-gradient(135deg, #60A5FA, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero p { font-size: 18px; color: #94A3B8; max-width: 520px; margin: 0 auto 48px; line-height: 1.7; }
  .platform-pills { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 52px; }
  .pp { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid rgba(255,255,255,0.1); color: #94A3B8; background: rgba(255,255,255,0.03); }
  .upload-zone { border: 2px dashed rgba(37,99,235,0.35); border-radius: 20px; padding: 56px 32px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(37,99,235,0.03); }
  .upload-zone:hover, .upload-zone.drag { border-color: #2563EB; background: rgba(37,99,235,0.07); transform: translateY(-2px); }
  .upload-icon { width: 72px; height: 72px; border-radius: 18px; background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
  .upload-zone h3 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 600; color: #fff; margin-bottom: 8px; }
  .upload-zone p { font-size: 14px; color: #64748B; margin-bottom: 24px; }
  .upload-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #2563EB, #7C3AED); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .upload-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .error-msg { margin-top: 16px; padding: 10px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #FCA5A5; font-size: 13px; }
  .loading-card { border-radius: 20px; padding: 56px 32px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); margin-top: 60px; }
  .loading-ring { width: 64px; height: 64px; border-radius: 50%; border: 3px solid rgba(37,99,235,0.2); border-top-color: #2563EB; margin: 0 auto 24px; animation: spin 1s linear infinite; }
  .loading-card h3 { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 600; color: #fff; margin-bottom: 8px; }
  .loading-card p { font-size: 14px; color: #64748B; }
  .loading-steps { display: flex; justify-content: center; gap: 24px; margin-top: 28px; flex-wrap: wrap; }
  .loading-step { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; }
  .loading-step.active { color: #60A5FA; }
  .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #1E3A5F; }
  .step-dot.active { background: #2563EB; animation: pulse 1s infinite; }
  .results-wrap { padding-top: 40px; padding-bottom: 60px; }
  .profile-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
  .profile-info { display: flex; gap: 16px; align-items: center; flex: 1; }
  .profile-avatar { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #2563EB, #7C3AED); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .profile-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 3px; }
  .profile-meta { font-size: 13px; color: #64748B; margin-bottom: 8px; }
  .profile-skills { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2); color: #93C5FD; }
  .new-search-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94A3B8; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .new-search-btn:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 16px; }

  /* ANALYSIS */
  .analysis-wrap { margin-bottom: 40px; }
  .score-hero { display: grid; grid-template-columns: auto 1fr; gap: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; margin-bottom: 16px; align-items: center; }
  .big-score { text-align: center; }
  .big-score-ring { width: 110px; height: 110px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; border: 4px solid; margin: 0 auto 8px; }
  .big-score-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; }
  .big-score-label { font-size: 11px; color: #64748B; }
  .score-label { font-size: 13px; color: #94A3B8; text-align: center; }
  .score-bars { display: flex; flex-direction: column; gap: 12px; }
  .score-bar-row { display: flex; align-items: center; gap: 12px; }
  .score-bar-label { font-size: 13px; color: #94A3B8; min-width: 100px; }
  .score-bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
  .score-bar-val { font-size: 13px; font-weight: 500; min-width: 36px; text-align: right; }
  .analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .analysis-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
  .analysis-card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .analysis-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .analysis-list li { font-size: 13px; color: #94A3B8; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
  .li-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  .suggestions-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin-bottom: 16px; }
  .suggestion-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .suggestion-item:last-child { border-bottom: none; padding-bottom: 0; }
  .priority-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; letter-spacing: 0.5px; }
  .pri-high { background: rgba(239,68,68,0.12); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.2); }
  .pri-medium { background: rgba(245,158,11,0.1); color: #FCD34D; border: 1px solid rgba(245,158,11,0.2); }
  .pri-low { background: rgba(34,197,94,0.08); color: #86EFAC; border: 1px solid rgba(34,197,94,0.15); }
  .suggestion-text { flex: 1; }
  .suggestion-title { font-size: 14px; font-weight: 500; color: #fff; margin-bottom: 3px; }
  .suggestion-detail { font-size: 12px; color: #64748B; line-height: 1.5; }
  .keywords-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .kw-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; }
  .kw-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 12px; }
  .kw-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .kw-found { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15); color: #86EFAC; }
  .kw-miss { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: #FCA5A5; }
  .exp-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin-bottom: 16px; }
  .exp-text { font-size: 14px; color: #94A3B8; line-height: 1.7; }

  /* JOBS */
  .jobs-section { margin-top: 40px; }
  .jobs-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 20px; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 2px; }
  .stat-label { font-size: 12px; color: #475569; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .section-count { font-size: 12px; color: #475569; background: rgba(255,255,255,0.04); padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06); }
  .jobs-list { display: flex; flex-direction: column; gap: 12px; }
  .job-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px 24px; transition: all 0.2s; position: relative; overflow: hidden; }
  .job-card:hover { border-color: rgba(37,99,235,0.3); background: rgba(37,99,235,0.04); transform: translateY(-1px); }
  .job-card.top-match { border-color: rgba(37,99,235,0.35); background: rgba(37,99,235,0.05); }
  .top-badge { position: absolute; top: 0; right: 0; background: linear-gradient(135deg, #2563EB, #7C3AED); color: #fff; font-size: 10px; font-weight: 600; padding: 4px 12px; border-radius: 0 16px 0 8px; letter-spacing: 0.5px; }
  .job-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
  .job-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 3px; }
  .job-company { font-size: 13px; color: #64748B; }
  .score-badge { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; padding: 6px 14px; border-radius: 10px; flex-shrink: 0; }
  .score-hi { background: rgba(34,197,94,0.12); color: #4ADE80; border: 1px solid rgba(34,197,94,0.2); }
  .score-md { background: rgba(37,99,235,0.12); color: #60A5FA; border: 1px solid rgba(37,99,235,0.2); }
  .score-lo { background: rgba(245,158,11,0.1); color: #FCD34D; border: 1px solid rgba(245,158,11,0.2); }
  .job-reason { font-size: 13px; color: #64748B; line-height: 1.6; margin-bottom: 12px; }
  .job-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .match-skill { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15); color: #86EFAC; }
  .miss-skill { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); color: #FCD34D; }
  .job-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }
  .job-meta { display: flex; gap: 16px; align-items: center; }
  .via-badge { font-size: 11px; padding: 3px 10px; border-radius: 6px; background: rgba(255,255,255,0.04); color: #64748B; border: 1px solid rgba(255,255,255,0.06); }
  .job-date { font-size: 12px; color: #334155; }
  .apply-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; background: linear-gradient(135deg, #2563EB, #7C3AED); color: #fff; border-radius: 8px; font-size: 13px; font-weight: 500; text-decoration: none; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .apply-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  footer { text-align: center; padding: 32px 0; border-top: 1px solid rgba(255,255,255,0.04); color: #1E293B; font-size: 12px; position: relative; z-index: 1; margin-top: 40px; }
`

function ScoreRing({ score, label, size = 110 }) {
  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#60A5FA' : '#FCD34D'
  const border = score >= 80 ? 'rgba(34,197,94,0.4)' : score >= 60 ? 'rgba(37,99,235,0.4)' : 'rgba(245,158,11,0.4)'
  return (
    <div className="big-score">
      <div className="big-score-ring" style={{ borderColor: border, background: score >= 80 ? 'rgba(34,197,94,0.06)' : score >= 60 ? 'rgba(37,99,235,0.06)' : 'rgba(245,158,11,0.06)' }}>
        <div className="big-score-num" style={{ color }}>{score}</div>
        <div className="big-score-label">/100</div>
      </div>
      <div className="score-label">{label}</div>
    </div>
  )
}

function ScoreBar({ label, value }) {
  const color = value >= 80 ? '#4ADE80' : value >= 60 ? '#60A5FA' : '#FCD34D'
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">{label}</div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <div className="score-bar-val" style={{ color }}>{value}</div>
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState('upload')
  const [profile, setProfile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') { setError('Please upload a PDF file'); return }
    setError(''); setStep('loading')
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const res = await fetch(`${API}/parse-resume`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setProfile(data.profile)
      setAnalysis(data.analysis)
      setJobs(data.jobs)
      setStep('results')
    } catch (e) { setError(e.message); setStep('upload') }
  }

  const scoreBadge = (s) => s >= 85 ? 'score-badge score-hi' : s >= 70 ? 'score-badge score-md' : 'score-badge score-lo'
  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JM'

  return (
    <>
      <style>{style}</style>
      <div className="app">
        <div className="bg-grid" />
        <div className="bg-glow" />
        <div className="bg-glow2" />

        <nav>
          <div className="wrap nav-inner">
            <div className="logo">
              <div className="logo-icon">💼</div>
              <div className="logo-text">JobMatch<span> AI</span></div>
            </div>
            <div className="nav-badge">Powered by Groq AI</div>
          </div>
        </nav>

        <div className="wrap">
          {step === 'upload' && (
            <>
              <div className="hero">
                <div className="hero-pill"><div className="hero-pill-dot" />AI-powered resume matching</div>
                <h1>Analyze your resume &<br /><span className="grad">find perfect job matches</span></h1>
                <p>Upload your resume — get your resume score, ATS analysis, improvement tips, and matched jobs from 7 platforms instantly.</p>
                <div className="platform-pills">
                  {['LinkedIn', 'Naukri', 'Glassdoor', 'Indeed', 'Foundit', 'Wellfound', 'BuiltIn'].map(p => (
                    <div key={p} className="pp">{p}</div>
                  ))}
                </div>
              </div>
              <div
                className={`upload-zone ${dragOver ? 'drag' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => document.getElementById('fi').click()}
              >
                <div className="upload-icon">📄</div>
                <h3>Drop your resume here</h3>
                <p>PDF format · AI will analyze and find matching jobs</p>
                <input id="fi" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                <button className="upload-btn">📂 Choose PDF file</button>
                {error && <div className="error-msg">⚠️ {error}</div>}
              </div>
            </>
          )}

          {step === 'loading' && (
            <div className="loading-card">
              <div className="loading-ring" />
              <h3>Analyzing your resume...</h3>
              <p>Scoring, finding gaps, and matching jobs — takes about 30 seconds</p>
              <div className="loading-steps">
                {['Extract text', 'Parse profile', 'Analyze resume', 'Match jobs'].map((s, i) => (
                  <div key={i} className="loading-step active">
                    <div className="step-dot active" />{s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'results' && profile && analysis && (
            <div className="results-wrap">
              <div className="profile-card">
                <div className="profile-info">
                  <div className="profile-avatar">{initials(profile.name)}</div>
                  <div>
                    <div className="profile-name">{profile.name}</div>
                    <div className="profile-meta">{profile.title} · {profile.location} · {profile.years_experience} yrs exp</div>
                    <div className="profile-skills">
                      {(profile.skills || []).slice(0, 6).map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  </div>
                </div>
                <button className="new-search-btn" onClick={() => { setStep('upload'); setProfile(null); setAnalysis(null); setJobs([]); }}>↑ New search</button>
              </div>

              {/* RESUME ANALYSIS */}
              <div className="analysis-wrap">
                <div className="section-title">📊 Resume Analysis</div>

                <div className="score-hero">
                  <div style={{ display: 'flex', gap: 24 }}>
                    <ScoreRing score={analysis.overall_score} label="Overall Score" />
                    <ScoreRing score={analysis.ats_score} label="ATS Score" />
                  </div>
                  <div className="score-bars">
                    {Object.entries(analysis.scores || {}).map(([k, v]) => (
                      <ScoreBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
                    ))}
                  </div>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-card">
                    <div className="analysis-card-title">✅ Strengths</div>
                    <ul className="analysis-list">
                      {(analysis.strengths || []).map((s, i) => (
                        <li key={i}><div className="li-dot" style={{ background: '#4ADE80' }} />{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="analysis-card">
                    <div className="analysis-card-title">⚠️ Weaknesses</div>
                    <ul className="analysis-list">
                      {(analysis.weaknesses || []).map((w, i) => (
                        <li key={i}><div className="li-dot" style={{ background: '#FCA5A5' }} />{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="suggestions-card">
                  <div className="analysis-card-title">💡 Suggestions to improve</div>
                  {(analysis.suggestions || []).map((s, i) => (
                    <div key={i} className="suggestion-item">
                      <div className={`priority-badge pri-${s.priority}`}>{s.priority.toUpperCase()}</div>
                      <div className="suggestion-text">
                        <div className="suggestion-title">{s.title}</div>
                        <div className="suggestion-detail">{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="keywords-row">
                  <div className="kw-card">
                    <div className="kw-title">✅ Keywords found</div>
                    <div className="kw-pills">
                      {(analysis.keywords_found || []).map(k => <span key={k} className="kw-found">{k}</span>)}
                    </div>
                  </div>
                  <div className="kw-card">
                    <div className="kw-title">❌ Keywords missing</div>
                    <div className="kw-pills">
                      {(analysis.keywords_missing || []).map(k => <span key={k} className="kw-miss">{k}</span>)}
                    </div>
                  </div>
                </div>

                <div className="exp-card">
                  <div className="analysis-card-title">🎓 Experience & Education</div>
                  <div className="exp-text">{analysis.experience_summary}</div>
                  <div className="exp-text" style={{ marginTop: 10 }}>{analysis.education_summary}</div>
                </div>
              </div>

              {/* JOBS */}
              <div className="jobs-section">
                <div className="section-title">💼 Matched Jobs</div>
                <div className="jobs-stats">
                  {[['Total matches', jobs.length], ['Strong 85%+', jobs.filter(j => j.score >= 85).length], ['Good 70%+', jobs.filter(j => j.score >= 70).length]].map(([l, v]) => (
                    <div key={l} className="stat-card">
                      <div className="stat-num">{v}</div>
                      <div className="stat-label">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="section-header">
                  <div style={{ fontSize: 14, color: '#64748B' }}>Sorted by match score</div>
                  <div className="section-count">{jobs.length} jobs</div>
                </div>
                <div className="jobs-list">
                  {jobs.map((job, i) => (
                    <div key={i} className={`job-card ${job.score >= 85 ? 'top-match' : ''}`}>
                      {job.score >= 90 && <div className="top-badge">TOP MATCH</div>}
                      <div className="job-top">
                        <div>
                          <div className="job-title">{job.title}</div>
                          <div className="job-company">{job.company} · {job.location}</div>
                        </div>
                        <div className={scoreBadge(job.score)}>{job.score}%</div>
                      </div>
                      <div className="job-reason">{job.reason}</div>
                      <div className="job-skills">
                        {(job.matching_skills || []).slice(0, 4).map(s => <span key={s} className="match-skill">✓ {s}</span>)}
                        {(job.missing_skills || []).slice(0, 2).map(s => <span key={s} className="miss-skill">+ {s}</span>)}
                      </div>
                      <div className="job-footer">
                        <div className="job-meta">
                          <div className="via-badge">{job.via}</div>
                          <div className="job-date">{job.posted}</div>
                        </div>
                        <a href={job.apply_link} target="_blank" rel="noreferrer" className="apply-btn">Apply now →</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <footer><div className="wrap">JobMatch AI · Built with Groq AI · © 2026</div></footer>
      </div>
    </>
  )
}
