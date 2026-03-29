"""
Analyzer service — Orchestrates the comparison and LLM generation.

Takes extracted text from both documents and retrieved precedents,
builds the structured prompt, calls Groq, and parses the result
into a JudicialBrief.
"""

import json
import re
from datetime import datetime

from llama_index.llms.groq import Groq
from llama_index.core.llms import ChatMessage, MessageRole

from config import GROQ_API_KEY, LLM_MODEL, LLM_TEMPERATURE
from models import (
    JudicialBrief,
    CaseOverview,
    PartySummary,
    ComparativeAnalysis,
    ContentionPoint,
    Precedent,
)
from prompts.judicial_brief import SYSTEM_PROMPT, build_user_prompt


def _format_precedents_for_prompt(precedents: list) -> str:
    """Format retrieved precedent chunks into a readable text block for the LLM."""
    if not precedents:
        return "No relevant precedents were found in the database."

    parts = []
    for i, p in enumerate(precedents, 1):
        parts.append(
            f"--- Precedent {i} ---\n"
            f"Case: {p.get('case_type', 'Unknown')} {p.get('case_number', '')} "
            f"({p.get('year', 'Unknown')})\n"
            f"Source: {p.get('source_filename', 'Unknown')}\n"
            f"Relevance Score: {p.get('score', 'N/A')}\n"
            f"Excerpt:\n{p.get('text', '')[:2000]}\n"
        )
    return "\n".join(parts)


def _extract_json_from_response(text: str) -> dict:
    """
    Extract JSON from LLM response, handling common issues like
    markdown fencing or extra text.
    """
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    cleaned = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    cleaned = re.sub(r'```\s*$', '', cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in the text
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from LLM response:\n{text[:500]}")


def _build_fallback_brief(text_a: str, text_b: str) -> JudicialBrief:
    """Build a minimal brief if LLM fails, so we still return something useful."""
    return JudicialBrief(
        case_overview=CaseOverview(
            doc_a_title="Document A",
            doc_b_title="Document B",
            date_analyzed=datetime.now().isoformat(),
        ),
        party_a_summary=PartySummary(
            key_claims=["Document text was provided but LLM analysis failed."],
            core_argument=text_a[:500] if text_a else "No text extracted.",
        ),
        party_b_summary=PartySummary(
            key_claims=["Document text was provided but LLM analysis failed."],
            core_argument=text_b[:500] if text_b else "No text extracted.",
        ),
        comparative_analysis=ComparativeAnalysis(),
        relevant_precedents=[],
        analytical_observations=[
            "⚠ The AI analysis could not be completed. "
            "The document texts above are raw extracts."
        ],
    )


def generate_judicial_brief(
    text_a: str,
    text_b: str,
    precedents: list,
) -> JudicialBrief:
    """
    Main entry point: build prompt, call Groq, parse into JudicialBrief.

    Args:
        text_a: Extracted text from Document A (Party A / Prosecution)
        text_b: Extracted text from Document B (Party B / Defense)
        precedents: List of retrieved precedent dicts from the retriever

    Returns:
        JudicialBrief pydantic model
    """
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY not set. Add it to your .env file."
        )

    # Format precedents
    precedents_text = _format_precedents_for_prompt(precedents)

    # Build prompt
    user_prompt = build_user_prompt(text_a, text_b, precedents_text)

    # Call Groq
    llm = Groq(
        model=LLM_MODEL,
        api_key=GROQ_API_KEY,
        temperature=LLM_TEMPERATURE,
    )

    messages = [
        ChatMessage(role=MessageRole.SYSTEM, content=SYSTEM_PROMPT),
        ChatMessage(role=MessageRole.USER, content=user_prompt),
    ]

    print("[Analyzer] Calling Groq API...")
    try:
        response = llm.chat(messages)
        raw_text = response.message.content
        print(f"[Analyzer] Received {len(raw_text)} chars from Groq.")
    except Exception as e:
        print(f"[Analyzer] Groq API error: {e}")
        return _build_fallback_brief(text_a, text_b)

    # Parse response
    try:
        data = _extract_json_from_response(raw_text)
        brief = JudicialBrief(**data)
        print("[Analyzer] Successfully parsed Judicial Brief.")
        return brief
    except Exception as e:
        print(f"[Analyzer] JSON parsing failed: {e}")
        print(f"[Analyzer] Raw response:\n{raw_text[:500]}")
        return _build_fallback_brief(text_a, text_b)
