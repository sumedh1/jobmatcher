import { useState } from 'react'

const API = 'https://jobmatcher-backend.onrender.com/api'

function App() {
  const [step, setStep] = useState('upload')
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    setError('')
    setLoading(true)
    setStep('parsing')
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const res = await fetch(`${API}/parse-resume`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setProfile(data.profile)
      setStep('searching')
      const res2 = await fetch(`${API}/search-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data.profile })
      })
      const data2 = await res2.json()
      if (!data2.success) throw new Error(data2.error)
      setJobs(data2.jobs)
      setStep('results')
    } catch (e) {
      setError(e.message)
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const scoreBg = (s) => s >= 85 ? '#EAF3DE' : s >= 70 ? '#E6F1FB' : '#FAEEDA'
  const scoreColor = (s) => s >= 85 ? '#27500A' : s >= 70 ? '#0C447C' : '#633806'

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' }}>
            JobMatch AI
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            Upload your resume and get matched jobs from LinkedIn, Naukri, Glassdoor and more
          </p>
        </div>

        {step === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            style={{
              border: `2px dashed ${dragOver ? '#378ADD' : '#ccc'}`,
              borderRadius: 16,
              padding: '3rem',
              textAlign: 'center',
              background: dragOver ? '#E6F1FB' : '#fff',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('fi').click()}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <p style={{ fontSize: 18, fontWeight: 500, margin: '0 0 8px', color: '#1a1a1a' }}>
              Drop your resume here
            </p>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
              or click to browse — PDF only
            </p>
            <input
              id="fi"
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <button style={{
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              cursor: 'pointer'
            }}>
              Choose PDF
            </button>
            {error && (
              <p style={{ color: '#E24B4A', fontSize: 13, marginTop: 12 }}>{error}</p>
            )}
          </div>
        )}

        {(step === 'parsing' || step === 'searching') && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '3rem',
            textAlign: 'center',
            border: '0.5px solid #e5e5e5'
          }}>
            <p style={{ fontSize: 18, fontWeight: 500, margin: '0 0 8px' }}>
              {step === 'parsing' ? 'Reading your resume with AI...' : 'Searching jobs across platforms...'}
            </p>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              {step === 'parsing'
                ? 'Extracting your skills and experience'
                : 'Scoring each job match — takes about 30 seconds'}
            </p>
          </div>
        )}

        {step === 'results' && profile && (
          <div>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              marginBottom: 16,
              border: '0.5px solid #e5e5e5'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 16 }}>{profile.name}</p>
                  <p style={{ margin: '0 0 8px', color: '#666', fontSize: 13 }}>
                    {profile.title} · {profile.location} · {profile.years_experience} yrs exp
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(profile.skills || []).slice(0, 8).map((s) => (
                      <span key={s} style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: '#f0f0ee',
                        color: '#555'
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  style={{
                    fontSize: 12,
                    color: '#666',
                    background: 'none',
                    border: '0.5px solid #ddd',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer'
                  }}
                >
                  Upload new resume
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                ['Total jobs', jobs.length],
                ['Strong match 85+', jobs.filter((j) => j.score >= 85).length],
                ['Good match 70+', jobs.filter((j) => j.score >= 70).length]
              ].map(([l, v]) => (
                <div key={l} style={{ background: '#f0f0ee', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map((job, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '1rem 1.25rem',
                  border: job.score >= 85 ? '2px solid #B5D4F4' : '0.5px solid #e5e5e5'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 500, fontSize: 15 }}>{job.title}</p>
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: '#666' }}>
                        {job.company} · {job.location}
                      </p>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                        {job.reason}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(job.matching_skills || []).slice(0, 5).map((s) => (
                          <span key={s} style={{
                            fontSize: 11, padding: '2px 7px', borderRadius: 20,
                            background: '#EAF3DE', color: '#27500A'
                          }}>{s}</span>
                        ))}
                        {(job.missing_skills || []).slice(0, 2).map((s) => (
                          <span key={s} style={{
                            fontSize: 11, padding: '2px 7px', borderRadius: 20,
                            background: '#FAEEDA', color: '#633806'
                          }}>missing: {s}</span>
                        ))}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#aaa' }}>
                        {job.via} · {job.posted}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: scoreBg(job.score),
                        color: scoreColor(job.score)
                      }}>
                        {job.score}% match
                      </span>
                      <a
                        href={job.apply_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: '#185FA5',
                          textDecoration: 'none',
                          border: '0.5px solid #B5D4F4',
                          borderRadius: 8,
                          padding: '5px 12px',
                          background: '#E6F1FB'
                        }}
                      >
                        Apply
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
