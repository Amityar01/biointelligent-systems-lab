'use client';

import { useState, useEffect } from 'react';

interface PendingPaper {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  titleJa?: string;
  authors: string[];
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  fetchedAt: string;
  status: string;
}

export default function PendingPapersPage() {
  const [papers, setPapers] = useState<PendingPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Manual DOI lookup
  const [doiInput, setDoiInput] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pending-papers');
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (error) {
      console.error('Failed to fetch pending papers:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const checkForNew = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res = await fetch('/api/check-new-papers');
      const data = await res.json();
      setMessage(`Found ${data.newPapers} new paper(s). Total pending: ${data.totalPending}`);
      fetchPending();
    } catch (error) {
      setMessage('Error checking for new papers');
    }
    setChecking(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      const res = await fetch('/api/approve-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`Paper ${action}d successfully${data.usedCrossRef ? ' (enriched with CrossRef data)' : ''}`);
        fetchPending();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error processing paper');
    }
    setProcessing(null);
  };

  const lookupDoi = async () => {
    if (!doiInput.trim()) return;

    setLookingUp(true);
    setLookupResult(null);

    try {
      const isArxiv = doiInput.includes('arxiv') || /^\d{4}\.\d{4,5}$/.test(doiInput.trim());
      const param = isArxiv ? `arxiv=${encodeURIComponent(doiInput)}` : `doi=${encodeURIComponent(doiInput)}`;

      const res = await fetch(`/api/lookup-doi?${param}`);
      const data = await res.json();

      if (data.error) {
        setMessage(`Lookup failed: ${data.error}`);
      } else {
        setLookupResult(data);
      }
    } catch (error) {
      setMessage('Lookup failed');
    }
    setLookingUp(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '10px' }}>Pending Publications</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Review and approve papers discovered from external sources.
      </p>

      {/* Actions bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={checkForNew}
          disabled={checking}
          style={{
            padding: '10px 20px',
            background: checking ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: checking ? 'not-allowed' : 'pointer',
          }}
        >
          {checking ? 'Checking...' : 'Check for New Papers'}
        </button>

        <a
          href="/admin"
          style={{
            padding: '10px 20px',
            background: '#666',
            color: 'white',
            borderRadius: '5px',
            textDecoration: 'none',
          }}
        >
          Back to CMS
        </a>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '10px 15px',
          background: message.includes('Error') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`,
          borderRadius: '5px',
          marginBottom: '20px',
        }}>
          {message}
        </div>
      )}

      {/* DOI Lookup Section */}
      <div style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
      }}>
        <h3 style={{ marginTop: 0 }}>Add Paper by DOI / arXiv</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={doiInput}
            onChange={(e) => setDoiInput(e.target.value)}
            placeholder="Enter DOI (10.1234/...) or arXiv ID (2401.12345)"
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
            }}
            onKeyDown={(e) => e.key === 'Enter' && lookupDoi()}
          />
          <button
            onClick={lookupDoi}
            disabled={lookingUp}
            style={{
              padding: '10px 20px',
              background: lookingUp ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: lookingUp ? 'not-allowed' : 'pointer',
            }}
          >
            {lookingUp ? 'Looking up...' : 'Lookup'}
          </button>
        </div>

        {/* Lookup Result */}
        {lookupResult && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: 'white',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>{lookupResult.title}</h4>
            <p style={{ margin: '5px 0', color: '#666' }}>
              {lookupResult.authors?.join(', ')}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              {lookupResult.journal} {lookupResult.year && `(${lookupResult.year})`}
            </p>
            {lookupResult.doi && (
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                DOI: {lookupResult.doi}
              </p>
            )}
            <div style={{ marginTop: '10px' }}>
              <button
                style={{
                  padding: '8px 16px',
                  background: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // TODO: Add to publications directly
                  alert('Direct add coming soon. For now, use Decap CMS to add manually with this data.');
                }}
              >
                Add to Publications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Papers List */}
      <h2>Pending Papers ({papers.length})</h2>

      {loading ? (
        <p>Loading...</p>
      ) : papers.length === 0 ? (
        <p style={{ color: '#666' }}>No pending papers. Click "Check for New Papers" to fetch from researchmap.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {papers.map((paper) => (
            <div
              key={paper.id}
              style={{
                padding: '20px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{paper.title}</h3>
                  {paper.titleJa && paper.titleJa !== paper.title && (
                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                      {paper.titleJa}
                    </p>
                  )}
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    {paper.authors?.join(', ') || 'Authors not available'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#888', fontSize: '14px' }}>
                    {paper.journal}
                    {paper.volume && ` ${paper.volume}`}
                    {paper.pages && `: ${paper.pages}`}
                    {paper.year && ` (${paper.year})`}
                  </p>
                  {paper.doi && (
                    <p style={{ margin: '5px 0', fontSize: '12px' }}>
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0070f3' }}
                      >
                        DOI: {paper.doi}
                      </a>
                    </p>
                  )}
                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#999' }}>
                    Source: {paper.source} | Fetched: {new Date(paper.fetchedAt).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                  <button
                    onClick={() => handleAction(paper.id, 'approve')}
                    disabled={processing === paper.id}
                    style={{
                      padding: '8px 16px',
                      background: processing === paper.id ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: processing === paper.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processing === paper.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(paper.id, 'reject')}
                    disabled={processing === paper.id}
                    style={{
                      padding: '8px 16px',
                      background: processing === paper.id ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: processing === paper.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
