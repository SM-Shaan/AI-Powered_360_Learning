"""
Pydantic schemas for AI Generation (Part 3)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from enum import Enum


class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class GenerationType(str, Enum):
    theory_notes = "theory_notes"
    slides = "slides"
    lab_code = "lab_code"
    quiz = "quiz"


class ProgrammingLanguage(str, Enum):
    python = "python"
    javascript = "javascript"
    typescript = "typescript"
    java = "java"
    cpp = "cpp"
    c = "c"
    csharp = "csharp"
    go = "go"
    rust = "rust"
    sql = "sql"


# Request Schemas

class GenerateNotesRequest(BaseModel):
    """Request schema for generating theory notes"""
    topic: str = Field(..., min_length=3, max_length=200, description="Topic to generate notes for")
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.intermediate)
    include_examples: bool = Field(default=True)
    additional_context: Optional[str] = Field(default=None, max_length=2000)


class GenerateSlidesRequest(BaseModel):
    """Request schema for generating slide outlines"""
    topic: str = Field(..., min_length=3, max_length=200)
    num_slides: int = Field(default=10, ge=5, le=30)
    additional_context: Optional[str] = Field(default=None, max_length=2000)


class GenerateCodeRequest(BaseModel):
    """Request schema for generating lab code"""
    topic: str = Field(..., min_length=3, max_length=200)
    language: ProgrammingLanguage = Field(default=ProgrammingLanguage.python)
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.intermediate)
    include_comments: bool = Field(default=True)
    include_tests: bool = Field(default=True)


class GenerateQuizRequest(BaseModel):
    """Request schema for generating quiz"""
    topic: str = Field(..., min_length=3, max_length=200)
    num_questions: int = Field(default=5, ge=3, le=20)
    question_types: Optional[List[Literal["mcq", "short_answer", "true_false"]]] = Field(
        default=["mcq", "short_answer", "true_false"]
    )
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.intermediate)


# Response Schemas

class WikipediaSource(BaseModel):
    """Wikipedia source reference"""
    type: str = "wikipedia"
    articles: List[str]


class GenerationMetadata(BaseModel):
    """Metadata about the generation"""
    model: str
    tokens_used: int
    language: Optional[str] = None


class GenerateNotesResponse(BaseModel):
    """Response schema for generated notes"""
    success: bool
    type: str
    topic: str
    difficulty: Optional[str] = None
    content: Optional[str] = None
    sources: Optional[List[WikipediaSource]] = None
    metadata: Optional[GenerationMetadata] = None
    error: Optional[str] = None


class SlideContent(BaseModel):
    """Individual slide content"""
    slide_number: int
    title: str
    bullets: List[str]
    speaker_notes: Optional[str] = None


class GenerateSlidesResponse(BaseModel):
    """Response schema for generated slides"""
    success: bool
    type: str
    topic: str
    num_slides: Optional[int] = None
    slides: Optional[List[SlideContent] | str] = None
    sources: Optional[List[WikipediaSource]] = None
    metadata: Optional[GenerationMetadata] = None
    error: Optional[str] = None


class GenerateCodeResponse(BaseModel):
    """Response schema for generated code"""
    success: bool
    type: str
    topic: str
    language: Optional[str] = None
    difficulty: Optional[str] = None
    content: Optional[str] = None
    sources: Optional[List[WikipediaSource]] = None
    metadata: Optional[GenerationMetadata] = None
    error: Optional[str] = None


class QuizQuestion(BaseModel):
    """Quiz question schema"""
    question_number: int
    type: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str | bool] = None
    explanation: Optional[str] = None
    sample_answer: Optional[str] = None
    key_points: Optional[List[str]] = None


class Quiz(BaseModel):
    """Full quiz schema"""
    quiz_title: str
    questions: List[QuizQuestion]


class GenerateQuizResponse(BaseModel):
    """Response schema for generated quiz"""
    success: bool
    type: str
    topic: str
    num_questions: Optional[int] = None
    difficulty: Optional[str] = None
    quiz: Optional[Quiz | str] = None
    sources: Optional[List[WikipediaSource]] = None
    metadata: Optional[GenerationMetadata] = None
    error: Optional[str] = None


# Wikipedia Search Response

class WikipediaArticle(BaseModel):
    """Wikipedia article summary"""
    title: str
    extract: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    thumbnail: Optional[str] = None


class WikipediaSearchResponse(BaseModel):
    """Response from Wikipedia search"""
    success: bool
    topic: str
    found: bool
    articles: List[WikipediaArticle]
    combined_context: Optional[str] = None
