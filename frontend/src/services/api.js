import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Upload two PDF documents for comparative analysis.
 * Returns the Judicial Brief JSON.
 */
export const analyzeCase = async (docA, docB) => {
    const formData = new FormData();
    formData.append('doc_a', docA);
    formData.append('doc_b', docB);

    const response = await axios.post(
        `${API_BASE}/api/v1/analyze_case`,
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // 2 min timeout for LLM processing
        }
    );
    return response.data;
};

/**
 * Check backend health and vector store status.
 */
export const healthCheck = async () => {
    const response = await axios.get(`${API_BASE}/api/v1/health`);
    return response.data;
};
