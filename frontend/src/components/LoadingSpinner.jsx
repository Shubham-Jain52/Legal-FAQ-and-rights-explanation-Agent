import React from 'react';

/**
 * Animated loading spinner with status text.
 * Shown while the backend is processing the analysis.
 */
export default function LoadingSpinner({ message }) {
    return (
        <div className="loading-overlay">
            <div className="loading-card">
                <div className="spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <span className="spinner-icon">⚖️</span>
                </div>
                <h3>Analyzing Case Documents</h3>
                <p className="loading-message">{message || 'Retrieving precedents and generating analysis...'}</p>
                <div className="loading-steps">
                    <div className="loading-step active">
                        <span className="step-dot"></span>
                        Extracting text from PDFs
                    </div>
                    <div className="loading-step">
                        <span className="step-dot"></span>
                        Searching precedent database
                    </div>
                    <div className="loading-step">
                        <span className="step-dot"></span>
                        Generating Judicial Brief
                    </div>
                </div>
                <p className="loading-note">This may take 15–30 seconds.</p>
            </div>
        </div>
    );
}
