import React, { useState } from 'react';

/**
 * Left panel — Two file upload inputs + submit button.
 */
export default function UploadPanel({ onAnalyze, isLoading }) {
    const [docA, setDocA] = useState(null);
    const [docB, setDocB] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (docA && docB) {
            onAnalyze(docA, docB);
        }
    };

    const isReady = docA && docB && !isLoading;

    return (
        <div className="upload-panel">
            <div className="panel-header">
                <span className="panel-icon">📄</span>
                <h2>Upload Documents</h2>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Document A */}
                <div className="upload-group">
                    <label className="upload-label">
                        <span className="label-badge badge-a">A</span>
                        Party A — Prosecution / Petitioner
                    </label>
                    <div className={`upload-dropzone ${docA ? 'has-file' : ''}`}>
                        <input
                            id="doc-a-input"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setDocA(e.target.files[0])}
                            disabled={isLoading}
                        />
                        {docA ? (
                            <div className="file-info">
                                <span className="file-icon">📎</span>
                                <span className="file-name">{docA.name}</span>
                                <span className="file-size">({(docA.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        ) : (
                            <div className="dropzone-hint">
                                <span className="hint-icon">⬆️</span>
                                <span>Choose a PDF file</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Document B */}
                <div className="upload-group">
                    <label className="upload-label">
                        <span className="label-badge badge-b">B</span>
                        Party B — Defense / Respondent
                    </label>
                    <div className={`upload-dropzone ${docB ? 'has-file' : ''}`}>
                        <input
                            id="doc-b-input"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setDocB(e.target.files[0])}
                            disabled={isLoading}
                        />
                        {docB ? (
                            <div className="file-info">
                                <span className="file-icon">📎</span>
                                <span className="file-name">{docB.name}</span>
                                <span className="file-size">({(docB.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        ) : (
                            <div className="dropzone-hint">
                                <span className="hint-icon">⬆️</span>
                                <span>Choose a PDF file</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <button
                    id="analyze-button"
                    type="submit"
                    className={`analyze-btn ${isReady ? 'ready' : ''}`}
                    disabled={!isReady}
                >
                    {isLoading ? (
                        <>
                            <span className="btn-spinner"></span>
                            Analyzing...
                        </>
                    ) : (
                        <>🔍 Analyze Case</>
                    )}
                </button>
            </form>

            <p className="panel-disclaimer">
                ⚠️ Documents are processed locally. No data is stored after analysis.
            </p>
        </div>
    );
}
