import React from 'react';

/**
 * Error banner displayed when an API call fails.
 */
export default function ErrorBanner({ error, onDismiss }) {
    if (!error) return null;

    return (
        <div id="error-banner" className="error-banner">
            <div className="error-content">
                <span className="error-icon">⚠️</span>
                <div className="error-text">
                    <strong>Analysis Failed</strong>
                    <p>{error}</p>
                </div>
                <button className="error-dismiss" onClick={onDismiss} aria-label="Dismiss error">
                    ✕
                </button>
            </div>
        </div>
    );
}
