import React, { useState } from 'react';

/**
 * Right panel — renders the JudicialBrief JSON into styled, expandable sections.
 */
export default function BriefDisplay({ brief }) {
    const [expandedSections, setExpandedSections] = useState({
        overview: true,
        partyA: true,
        partyB: true,
        comparison: true,
        precedents: true,
        observations: true,
    });

    if (!brief) {
        return (
            <div className="brief-display empty-state">
                <div className="empty-icon">⚖️</div>
                <h3>Judicial Brief</h3>
                <p>Upload two case documents and click <strong>Analyze Case</strong> to generate a comparative brief with precedent citations.</p>
            </div>
        );
    }

    const toggle = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const {
        case_overview,
        party_a_summary,
        party_b_summary,
        comparative_analysis,
        relevant_precedents,
        analytical_observations,
    } = brief;

    return (
        <div className="brief-display">
            <div className="panel-header">
                <span className="panel-icon">📋</span>
                <h2>Judicial Brief</h2>
            </div>

            {/* Case Overview */}
            <Section
                id="overview-section"
                title="Case Overview"
                icon="📋"
                expanded={expandedSections.overview}
                onToggle={() => toggle('overview')}
            >
                <div className="overview-grid">
                    <div className="overview-item">
                        <span className="overview-label">Document A:</span>
                        <span className="overview-value">{case_overview?.doc_a_title}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">Document B:</span>
                        <span className="overview-value">{case_overview?.doc_b_title}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">Analyzed:</span>
                        <span className="overview-value">
                            {case_overview?.date_analyzed
                                ? new Date(case_overview.date_analyzed).toLocaleString()
                                : 'N/A'}
                        </span>
                    </div>
                </div>
            </Section>

            {/* Party A Summary */}
            <Section
                id="party-a-section"
                title="Party A — Prosecution / Petitioner"
                icon="🔴"
                expanded={expandedSections.partyA}
                onToggle={() => toggle('partyA')}
            >
                <PartySummary summary={party_a_summary} />
            </Section>

            {/* Party B Summary */}
            <Section
                id="party-b-section"
                title="Party B — Defense / Respondent"
                icon="🔵"
                expanded={expandedSections.partyB}
                onToggle={() => toggle('partyB')}
            >
                <PartySummary summary={party_b_summary} />
            </Section>

            {/* Comparative Analysis */}
            <Section
                id="comparison-section"
                title="Comparative Analysis"
                icon="⚔️"
                expanded={expandedSections.comparison}
                onToggle={() => toggle('comparison')}
            >
                {comparative_analysis?.points_of_agreement?.length > 0 && (
                    <div className="analysis-subsection">
                        <h4>✅ Points of Agreement</h4>
                        <ul className="points-list agreement">
                            {comparative_analysis.points_of_agreement.map((p, i) => (
                                <li key={i}>{p}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {comparative_analysis?.points_of_contention?.length > 0 && (
                    <div className="analysis-subsection">
                        <h4>⚡ Points of Contention</h4>
                        {comparative_analysis.points_of_contention.map((c, i) => (
                            <div key={i} className="contention-card">
                                <div className="contention-issue">
                                    <strong>Issue:</strong> {c.issue}
                                </div>
                                <div className="contention-positions">
                                    <div className="position position-a">
                                        <span className="position-badge badge-a">A</span>
                                        <p>{c.party_a_position}</p>
                                    </div>
                                    <div className="position position-b">
                                        <span className="position-badge badge-b">B</span>
                                        <p>{c.party_b_position}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Precedents */}
            <Section
                id="precedents-section"
                title="Relevant Precedents"
                icon="📚"
                expanded={expandedSections.precedents}
                onToggle={() => toggle('precedents')}
            >
                {relevant_precedents?.length > 0 ? (
                    relevant_precedents.map((p, i) => (
                        <div key={i} className="precedent-card">
                            <div className="precedent-header">
                                <span className="precedent-number">#{i + 1}</span>
                                <span className="precedent-name">{p.case_name}</span>
                                {p.year && <span className="precedent-year">{p.year}</span>}
                            </div>
                            <p className="precedent-relevance">{p.relevance_summary}</p>
                            {p.excerpt && (
                                <blockquote className="precedent-excerpt">
                                    {p.excerpt}
                                </blockquote>
                            )}
                            <div className="precedent-source">
                                Source: <code>{p.source_filename}</code>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="empty-note">No relevant precedents found.</p>
                )}
            </Section>

            {/* Observations */}
            <Section
                id="observations-section"
                title="Analytical Observations"
                icon="💡"
                expanded={expandedSections.observations}
                onToggle={() => toggle('observations')}
            >
                {analytical_observations?.length > 0 ? (
                    <ul className="observations-list">
                        {analytical_observations.map((o, i) => (
                            <li key={i}>{o}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-note">No additional observations.</p>
                )}
            </Section>
        </div>
    );
}


/* ──── Sub-components ──── */

function Section({ id, title, icon, expanded, onToggle, children }) {
    return (
        <div id={id} className={`brief-section ${expanded ? 'expanded' : 'collapsed'}`}>
            <button className="section-header" onClick={onToggle}>
                <span className="section-icon">{icon}</span>
                <span className="section-title">{title}</span>
                <span className="section-chevron">{expanded ? '▼' : '▶'}</span>
            </button>
            {expanded && <div className="section-content">{children}</div>}
        </div>
    );
}

function PartySummary({ summary }) {
    if (!summary) return <p className="empty-note">No summary available.</p>;

    return (
        <div className="party-summary">
            {summary.core_argument && (
                <div className="core-argument">
                    <h4>Core Argument</h4>
                    <p>{summary.core_argument}</p>
                </div>
            )}
            {summary.key_claims?.length > 0 && (
                <div className="claims-section">
                    <h4>Key Claims</h4>
                    <ul className="claims-list">
                        {summary.key_claims.map((c, i) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </div>
            )}
            {summary.cited_statutes?.length > 0 && (
                <div className="statutes-section">
                    <h4>Cited Statutes</h4>
                    <div className="statute-tags">
                        {summary.cited_statutes.map((s, i) => (
                            <span key={i} className="statute-tag">{s}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
