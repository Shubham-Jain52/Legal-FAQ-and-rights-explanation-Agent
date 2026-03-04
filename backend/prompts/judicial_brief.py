"""
Prompt templates for the Judicial Brief generation.

The system prompt instructs the LLM to act as a neutral judicial analyst.
The user prompt provides the two documents and retrieved precedents.
"""

SYSTEM_PROMPT = """You are a neutral judicial analyst for Indian law. Analyze two opposing legal documents and output a JSON Judicial Brief.

Rules: Stay neutral. No legal advice. Ground analysis in precedents. Output ONLY valid JSON.

JSON schema:
{"case_overview":{"doc_a_title":"...","doc_b_title":"...","date_analyzed":"ISO8601"},"party_a_summary":{"key_claims":["..."],"cited_statutes":["..."],"core_argument":"..."},"party_b_summary":{"key_claims":["..."],"cited_statutes":["..."],"core_argument":"..."},"comparative_analysis":{"points_of_agreement":["..."],"points_of_contention":[{"issue":"...","party_a_position":"...","party_b_position":"..."}]},"relevant_precedents":[{"case_name":"...","source_filename":"...","year":"...","relevance_summary":"...","excerpt":"..."}],"analytical_observations":["..."]}

Output ONLY the JSON. No markdown, no explanation."""


def build_user_prompt(
    text_a: str,
    text_b: str,
    precedents_text: str,
) -> str:
    """Build the user message with both documents and retrieved precedents."""
    # Aggressive truncation for Groq free-tier TPM limit (6000 tokens)
    # Budget: ~400 system + ~600 per doc + ~400 precedents + ~100 boilerplate
    # Leaves ~3500 tokens for LLM output
    max_doc_chars = 1500  # ~375 tokens per doc
    max_precedent_chars = 1500  # ~375 tokens for precedents

    if len(text_a) > max_doc_chars:
        text_a = text_a[:max_doc_chars] + "\n[...truncated...]"
    if len(text_b) > max_doc_chars:
        text_b = text_b[:max_doc_chars] + "\n[...truncated...]"
    if len(precedents_text) > max_precedent_chars:
        precedents_text = precedents_text[:max_precedent_chars] + "\n[...truncated...]"

    return f"""Analyze these documents and produce the Judicial Brief JSON.

DOC A (Prosecution/Petitioner):
{text_a}

DOC B (Defense/Respondent):
{text_b}

PRECEDENTS:
{precedents_text}

Produce the JSON now."""
