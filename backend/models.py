"""
Pydantic models for API request/response schemas.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Response: Judicial Brief Structure
# ──────────────────────────────────────────────

class CaseOverview(BaseModel):
    doc_a_title: str = Field(description="Title/identifier for Document A")
    doc_b_title: str = Field(description="Title/identifier for Document B")
    date_analyzed: str = Field(default_factory=lambda: datetime.now().isoformat())


class PartySummary(BaseModel):
    key_claims: List[str] = Field(default_factory=list)
    cited_statutes: List[str] = Field(default_factory=list)
    core_argument: str = ""


class ContentionPoint(BaseModel):
    issue: str = ""
    party_a_position: str = ""
    party_b_position: str = ""


class ComparativeAnalysis(BaseModel):
    points_of_agreement: List[str] = Field(default_factory=list)
    points_of_contention: List[ContentionPoint] = Field(default_factory=list)


class Precedent(BaseModel):
    case_name: str = ""
    source_filename: str = ""
    year: str = ""
    relevance_summary: str = ""
    excerpt: str = ""


class JudicialBrief(BaseModel):
    case_overview: CaseOverview
    party_a_summary: PartySummary
    party_b_summary: PartySummary
    comparative_analysis: ComparativeAnalysis
    relevant_precedents: List[Precedent] = Field(default_factory=list)
    analytical_observations: List[str] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    status: str = "success"
    judicial_brief: Optional[JudicialBrief] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    vector_store_ready: bool = False
    documents_count: int = 0
