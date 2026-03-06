import React, { useEffect, useState } from 'react';
import { X, Brain, Target, BookOpen, Key, Briefcase, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface MatchScoreModalProps {
    isOpen: boolean;
    score: number;
    applicantName: string;
    candidateId: string;
    jobId: string;
    onClose: () => void;
}

export default function MatchScoreModal({ isOpen, score, applicantName, candidateId, jobId, onClose }: MatchScoreModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        fetch(`/api/match-details/${candidateId}/${jobId}`)
            .then(res => res.json())
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [isOpen, candidateId, jobId]);

    if (!isOpen) return null;

    let skillMatch = Math.round(score * 0.511);
    let expMatch = Math.round(score * 0.284);
    let eduMatch = Math.round(score * 0.114);
    let kwMatch = score - skillMatch - expMatch - eduMatch;

    if (data && data.scoreBreakdown) {
        skillMatch = data.scoreBreakdown.skillMatch;
        expMatch = data.scoreBreakdown.expMatch;
        eduMatch = data.scoreBreakdown.eduMatch;
        kwMatch = data.scoreBreakdown.keywordMatch;
        score = data.scoreBreakdown.total;
    }

    const categories = [
        { label: 'Skill Match', max: 51, value: skillMatch, icon: <Target size={16} className="text-blue-400" />, color: 'bg-blue-500' },
        { label: 'Experience Match', max: 28, value: expMatch, icon: <Briefcase size={16} className="text-purple-400" />, color: 'bg-purple-500' },
        { label: 'Education Match', max: 11, value: eduMatch, icon: <BookOpen size={16} className="text-green-400" />, color: 'bg-green-500' },
        { label: 'Keyword Strength', max: 10, value: kwMatch, icon: <Key size={16} className="text-yellow-400" />, color: 'bg-yellow-500' },
    ];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', width: '100%', maxWidth: '28rem', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: 'rgba(99,102,241,0.2)', borderRadius: '0.5rem', color: '#818cf8', display: 'flex' }}>
                            <Brain size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold', color: 'white' }}>AI Match Analysis</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{applicantName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Analyzing candidate profile...</p>
                        </div>
                    ) : data ? (() => {
                        let dynamicStatus = 'Poor Match';
                        if (data.status === 'Conflict') {
                            dynamicStatus = 'Conflict';
                        } else if (score >= 80) {
                            dynamicStatus = 'Verified';
                        } else if (score >= 50) {
                            dynamicStatus = 'Review Needed';
                        }

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* Validation Status */}
                                <div style={{
                                    padding: '1rem', borderRadius: '0.75rem', border: '1px solid', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    backgroundColor: dynamicStatus === 'Verified' ? 'rgba(16,185,129,0.1)' : dynamicStatus === 'Conflict' || dynamicStatus === 'Poor Match' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                                    borderColor: dynamicStatus === 'Verified' ? 'rgba(16,185,129,0.2)' : dynamicStatus === 'Conflict' || dynamicStatus === 'Poor Match' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
                                    color: dynamicStatus === 'Verified' ? '#34d399' : dynamicStatus === 'Conflict' || dynamicStatus === 'Poor Match' ? '#f87171' : '#fbbf24'
                                }}>
                                    <div style={{ marginTop: '0.125rem', display: 'flex' }}>
                                        {dynamicStatus === 'Verified' ? <CheckCircle size={18} /> :
                                            dynamicStatus === 'Conflict' || dynamicStatus === 'Poor Match' ? <AlertTriangle size={18} /> :
                                                <Info size={18} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Status: {dynamicStatus}</span>
                                        {data.identityConflictReason && (
                                            <span style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#f87171', fontWeight: '500' }}>Reason: {data.identityConflictReason}</span>
                                        )}
                                    </div>
                                </div>

                                {dynamicStatus !== 'Conflict' && (
                                    <>
                                        {/* Gap Analysis */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: 0 }}>Gap Analysis</h4>

                                            <div>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Missing Critical Skills</span>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {data.missingSkills.map((skill: string, i: number) => (
                                                        <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#1e293b', color: '#cbd5e1', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Experience Gap</span>
                                                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', backgroundColor: 'rgba(30,41,59,0.5)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', margin: 0 }}>
                                                    {data.experienceGap}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Breakdown */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: 0 }}>Score Breakdown</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {categories.map((cat, idx) => (
                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                        <div
                                                            style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', cursor: 'pointer' }}
                                                            onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                                                                {cat.icon} {cat.label}
                                                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '400', marginLeft: '0.25rem' }}>(max {cat.max}%)</span>
                                                                {expandedCategory === cat.label ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                                            </span>
                                                            <span style={{ color: 'white', fontWeight: 'bold' }}>{cat.value}%</span>
                                                        </div>
                                                        <div style={{ height: '0.5rem', width: '100%', backgroundColor: '#0f172a', borderRadius: '9999px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', backgroundColor: cat.color.includes('blue') ? '#3b82f6' : cat.color.includes('purple') ? '#a855f7' : cat.color.includes('green') ? '#22c55e' : '#eab308', borderRadius: '9999px', width: `${Math.min(Math.round((cat.value / cat.max) * 100), 100)}%`, transition: 'width 1s ease-out' }} />
                                                        </div>
                                                        {expandedCategory === cat.label && (
                                                            <div style={{ padding: '0.75rem', marginTop: '0.25rem', backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                {cat.label === 'Skill Match' && data.matchedSkills && (
                                                                    <>
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Successfully Verified Skills ({cat.value} out of {cat.max} points):</span>
                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                                                            {data.matchedSkills.map((skill: string, i: number) => (
                                                                                <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '0.25rem', border: '1px solid rgba(34,197,94,0.2)' }}>
                                                                                    ✓ {skill}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {cat.label === 'Experience Match' && (
                                                                    <>
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Experience Assessment ({cat.value} out of {cat.max} points):</span>
                                                                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{data.experienceGap || 'Base trajectory matched via timeline parsing.'}</span>
                                                                    </>
                                                                )}
                                                                {cat.label === 'Education Match' && (
                                                                    <>
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Education Assessment ({cat.value} out of {cat.max} points):</span>
                                                                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Baseline academic credentials mapped to job requirements. Calculated proportionally to total ATS match ratio.</span>
                                                                    </>
                                                                )}
                                                                {cat.label === 'Keyword Strength' && (
                                                                    <>
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>Keyword Density ({cat.value} out of {cat.max} points):</span>
                                                                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Semantic frequency measurement indexing domain-specific vocabulary presence across the resume text body.</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })() : (
                        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#94a3b8' }}>
                            Failed to load match details.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>Total Match Score</span>
                    <div style={{ fontSize: '1.875rem', fontWeight: '900', color: '#34d399', lineHeight: 1 }}>
                        {loading ? '--' : score}%
                    </div>
                </div>
            </div >

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div >
    );
}
