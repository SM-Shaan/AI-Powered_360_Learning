"""
Pydantic schemas for Content Validation (Part 4)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ValidationLevel(str, Enum):
    """Level of validation to perform"""
    syntax_only = "syntax_only"
    with_execution = "with_execution"
    full = "full"  # Includes AI evaluation


class ContentType(str, Enum):
    """Type of content being validated"""
    code = "code"
    theory = "theory"
    slides = "slides"
    quiz = "quiz"


# Request Schemas

class ValidateCodeRequest(BaseModel):
    """Request schema for code validation"""
    code: str = Field(..., min_length=1, description="Code to validate")
    language: str = Field(default="python", description="Programming language")
    test_code: Optional[str] = Field(default=None, description="Test code to run")
    validation_level: ValidationLevel = Field(default=ValidationLevel.with_execution)


class ValidateTheoryRequest(BaseModel):
    """Request schema for theory content validation"""
    content: str = Field(..., min_length=10, description="Theory content to validate")
    topic: str = Field(..., min_length=3, max_length=200, description="Topic of the content")
    content_ids: Optional[List[str]] = Field(default=None, description="IDs of course materials for grounding check")
    validation_level: ValidationLevel = Field(default=ValidationLevel.full)


class ValidateGeneratedRequest(BaseModel):
    """Request to validate any generated content"""
    content: str = Field(..., min_length=1, description="Generated content to validate")
    content_type: ContentType = Field(..., description="Type of content")
    topic: str = Field(..., min_length=3, max_length=200)
    language: Optional[str] = Field(default=None, description="Programming language (for code)")
    validation_level: ValidationLevel = Field(default=ValidationLevel.full)


# Response Schemas

class ValidationIssue(BaseModel):
    """Individual validation issue"""
    severity: str = Field(..., description="error, warning, or info")
    message: str = Field(..., description="Description of the issue")
    line: Optional[int] = Field(default=None, description="Line number if applicable")
    suggestion: Optional[str] = Field(default=None, description="How to fix the issue")


class SyntaxValidationResult(BaseModel):
    """Result of syntax validation"""
    is_valid: bool
    language: str
    issues: List[ValidationIssue] = []
    error_message: Optional[str] = None


class ExecutionResult(BaseModel):
    """Result of code execution"""
    executed: bool
    success: bool
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    return_code: Optional[int] = None
    timeout: bool = False
    error: Optional[str] = None


class StructureValidationResult(BaseModel):
    """Result of structure validation for theory content"""
    has_overview: bool = False
    has_key_concepts: bool = False
    has_examples: bool = False
    has_summary: bool = False
    section_count: int = 0
    word_count: int = 0
    issues: List[ValidationIssue] = []


class GroundingResult(BaseModel):
    """Result of reference grounding check"""
    is_grounded: bool
    matched_terms: List[str] = []
    unmatched_claims: List[str] = []
    confidence: float = Field(ge=0, le=1)
    sources_checked: int = 0


class AIEvaluationScore(BaseModel):
    """Score from AI evaluation"""
    accuracy: int = Field(ge=1, le=5, description="Factual correctness")
    relevance: int = Field(ge=1, le=5, description="Addresses the topic")
    coherence: int = Field(ge=1, le=5, description="Well-organized")
    completeness: int = Field(ge=1, le=5, description="Covers key concepts")
    overall: float = Field(ge=1, le=5, description="Average score")


class AIEvaluationResult(BaseModel):
    """Result of AI-assisted evaluation"""
    evaluated: bool
    scores: Optional[AIEvaluationScore] = None
    explanation: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []
    error: Optional[str] = None


class CodeValidationResponse(BaseModel):
    """Full response for code validation"""
    success: bool
    content_type: str = "code"
    syntax: SyntaxValidationResult
    execution: Optional[ExecutionResult] = None
    ai_evaluation: Optional[AIEvaluationResult] = None
    is_valid: bool
    overall_score: Optional[float] = None
    summary: str


class TheoryValidationResponse(BaseModel):
    """Full response for theory validation"""
    success: bool
    content_type: str = "theory"
    structure: StructureValidationResult
    grounding: Optional[GroundingResult] = None
    ai_evaluation: Optional[AIEvaluationResult] = None
    is_valid: bool
    overall_score: Optional[float] = None
    summary: str


class GeneralValidationResponse(BaseModel):
    """Generic validation response"""
    success: bool
    content_type: str
    is_valid: bool
    overall_score: Optional[float] = None
    issues: List[ValidationIssue] = []
    ai_evaluation: Optional[AIEvaluationResult] = None
    summary: str
