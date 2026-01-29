"""
Chunking Service - Part 2
Extract and chunk text from documents for embedding
"""

import re
import ast
from typing import List, Optional, Tuple
from dataclasses import dataclass
from PyPDF2 import PdfReader
import io


@dataclass
class Chunk:
    """Represents a text chunk"""
    text: str
    chunk_type: str  # 'text', 'code', 'heading', 'list'
    start_position: int
    end_position: int
    metadata: dict = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class CodeChunk(Chunk):
    """Represents a code chunk with additional metadata"""
    language: str = "python"
    function_name: Optional[str] = None
    class_name: Optional[str] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None


class ChunkingService:
    """
    Service for extracting and chunking text from various document types.

    Supports:
    - PDF documents
    - Plain text / Markdown
    - Source code (with syntax awareness)
    """

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        min_chunk_size: int = 100
    ):
        self.chunk_size = chunk_size  # Target characters per chunk
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    # ==================== TEXT EXTRACTION ====================

    def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """
        Extract text from PDF content.

        Args:
            pdf_content: PDF file bytes

        Returns:
            Extracted text
        """
        try:
            reader = PdfReader(io.BytesIO(pdf_content))
            text_parts = []

            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"[Page {page_num + 1}]\n{page_text}")

            return "\n\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Failed to extract PDF text: {str(e)}")

    def extract_text_from_code(self, code: str, language: str = "python") -> str:
        """
        Extract meaningful text from code (docstrings, comments, function names).

        Args:
            code: Source code
            language: Programming language

        Returns:
            Extracted text representation
        """
        text_parts = []

        if language == "python":
            # Extract docstrings and comments
            docstring_pattern = r'"""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\''
            docstrings = re.findall(docstring_pattern, code)
            text_parts.extend([d.strip('"\' ') for d in docstrings])

            # Extract comments
            comment_pattern = r'#\s*(.+)$'
            comments = re.findall(comment_pattern, code, re.MULTILINE)
            text_parts.extend(comments)

            # Extract function and class names
            func_pattern = r'def\s+(\w+)\s*\('
            class_pattern = r'class\s+(\w+)\s*[:\(]'
            functions = re.findall(func_pattern, code)
            classes = re.findall(class_pattern, code)
            text_parts.extend([f"function: {f}" for f in functions])
            text_parts.extend([f"class: {c}" for c in classes])

        elif language in ["javascript", "typescript"]:
            # Extract JSDoc comments
            jsdoc_pattern = r'/\*\*[\s\S]*?\*/'
            jsdocs = re.findall(jsdoc_pattern, code)
            text_parts.extend([j.strip('/* ') for j in jsdocs])

            # Extract single-line comments
            comment_pattern = r'//\s*(.+)$'
            comments = re.findall(comment_pattern, code, re.MULTILINE)
            text_parts.extend(comments)

            # Extract function names
            func_pattern = r'(?:function|const|let|var)\s+(\w+)\s*[=\(]'
            functions = re.findall(func_pattern, code)
            text_parts.extend([f"function: {f}" for f in functions])

        # Include the code itself for semantic understanding
        text_parts.append(code)

        return "\n".join(text_parts)

    # ==================== CHUNKING ====================

    def chunk_text(
        self,
        text: str,
        chunk_type: str = "text"
    ) -> List[Chunk]:
        """
        Split text into overlapping chunks.

        Uses a sliding window approach with overlap for context continuity.

        Args:
            text: Text to chunk
            chunk_type: Type of content

        Returns:
            List of Chunk objects
        """
        if not text or len(text.strip()) < self.min_chunk_size:
            if text and text.strip():
                return [Chunk(
                    text=text.strip(),
                    chunk_type=chunk_type,
                    start_position=0,
                    end_position=len(text)
                )]
            return []

        chunks = []
        text = text.strip()

        # Try to split on paragraph boundaries first
        paragraphs = re.split(r'\n\s*\n', text)

        current_chunk = ""
        current_start = 0
        position = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # If adding this paragraph exceeds chunk size
            if len(current_chunk) + len(para) > self.chunk_size and current_chunk:
                # Save current chunk
                chunks.append(Chunk(
                    text=current_chunk.strip(),
                    chunk_type=chunk_type,
                    start_position=current_start,
                    end_position=position
                ))

                # Start new chunk with overlap
                overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else ""
                current_chunk = overlap_text + " " + para
                current_start = position - len(overlap_text)
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
                    current_start = position

            position += len(para) + 2  # Account for paragraph separator

        # Add remaining chunk
        if current_chunk.strip():
            chunks.append(Chunk(
                text=current_chunk.strip(),
                chunk_type=chunk_type,
                start_position=current_start,
                end_position=position
            ))

        return chunks

    def chunk_markdown(self, markdown: str) -> List[Chunk]:
        """
        Chunk markdown content by sections.

        Splits on headers while maintaining section context.

        Args:
            markdown: Markdown text

        Returns:
            List of chunks
        """
        chunks = []

        # Split by headers
        header_pattern = r'^(#{1,6})\s+(.+)$'
        sections = re.split(r'(?=^#{1,6}\s)', markdown, flags=re.MULTILINE)

        position = 0
        for section in sections:
            section = section.strip()
            if not section:
                continue

            # Check if section starts with a header
            header_match = re.match(header_pattern, section, re.MULTILINE)
            chunk_type = "heading" if header_match else "text"

            # If section is too long, sub-chunk it
            if len(section) > self.chunk_size:
                sub_chunks = self.chunk_text(section, chunk_type)
                for sc in sub_chunks:
                    sc.start_position += position
                    sc.end_position += position
                chunks.extend(sub_chunks)
            else:
                chunks.append(Chunk(
                    text=section,
                    chunk_type=chunk_type,
                    start_position=position,
                    end_position=position + len(section)
                ))

            position += len(section) + 1

        return chunks

    def chunk_code(
        self,
        code: str,
        language: str = "python"
    ) -> List[CodeChunk]:
        """
        Chunk code with syntax awareness.

        For Python, uses AST to identify functions and classes.
        Falls back to pattern-based chunking for other languages.

        Args:
            code: Source code
            language: Programming language

        Returns:
            List of CodeChunk objects
        """
        chunks = []

        if language == "python":
            chunks = self._chunk_python_code(code)
        elif language in ["javascript", "typescript"]:
            chunks = self._chunk_js_code(code, language)
        else:
            # Generic chunking for other languages
            chunks = self._chunk_generic_code(code, language)

        return chunks

    def _chunk_python_code(self, code: str) -> List[CodeChunk]:
        """Chunk Python code using AST parsing"""
        chunks = []
        lines = code.split('\n')

        try:
            tree = ast.parse(code)

            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    start_line = node.lineno - 1
                    end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line + 10

                    func_code = '\n'.join(lines[start_line:end_line])
                    chunks.append(CodeChunk(
                        text=func_code,
                        chunk_type="code",
                        start_position=start_line,
                        end_position=end_line,
                        language="python",
                        function_name=node.name,
                        line_start=start_line + 1,
                        line_end=end_line
                    ))

                elif isinstance(node, ast.ClassDef):
                    start_line = node.lineno - 1
                    end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line + 20

                    class_code = '\n'.join(lines[start_line:end_line])
                    chunks.append(CodeChunk(
                        text=class_code,
                        chunk_type="code",
                        start_position=start_line,
                        end_position=end_line,
                        language="python",
                        class_name=node.name,
                        line_start=start_line + 1,
                        line_end=end_line
                    ))

        except SyntaxError:
            # Fall back to generic chunking if AST parsing fails
            return self._chunk_generic_code(code, "python")

        # If no chunks found (no functions/classes), chunk the whole file
        if not chunks and code.strip():
            chunks.append(CodeChunk(
                text=code,
                chunk_type="code",
                start_position=0,
                end_position=len(lines),
                language="python",
                line_start=1,
                line_end=len(lines)
            ))

        return chunks

    def _chunk_js_code(self, code: str, language: str) -> List[CodeChunk]:
        """Chunk JavaScript/TypeScript code using regex patterns"""
        chunks = []
        lines = code.split('\n')

        # Pattern for function definitions
        func_patterns = [
            r'(?:export\s+)?(?:async\s+)?function\s+(\w+)',
            r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(',
            r'(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\w+\s*=>'
        ]

        # Find all function starts
        func_starts = []
        for i, line in enumerate(lines):
            for pattern in func_patterns:
                match = re.search(pattern, line)
                if match:
                    func_starts.append((i, match.group(1)))
                    break

        # Create chunks for each function
        for idx, (start_line, func_name) in enumerate(func_starts):
            # Find end of function (next function start or end of file)
            if idx + 1 < len(func_starts):
                end_line = func_starts[idx + 1][0]
            else:
                end_line = len(lines)

            func_code = '\n'.join(lines[start_line:end_line])
            chunks.append(CodeChunk(
                text=func_code,
                chunk_type="code",
                start_position=start_line,
                end_position=end_line,
                language=language,
                function_name=func_name,
                line_start=start_line + 1,
                line_end=end_line
            ))

        # If no functions found, chunk the whole file
        if not chunks and code.strip():
            chunks.append(CodeChunk(
                text=code,
                chunk_type="code",
                start_position=0,
                end_position=len(lines),
                language=language,
                line_start=1,
                line_end=len(lines)
            ))

        return chunks

    def _chunk_generic_code(self, code: str, language: str) -> List[CodeChunk]:
        """Generic code chunking by line count"""
        chunks = []
        lines = code.split('\n')
        chunk_lines = 50  # Lines per chunk for code

        for i in range(0, len(lines), chunk_lines - 10):  # 10 line overlap
            end = min(i + chunk_lines, len(lines))
            chunk_code = '\n'.join(lines[i:end])

            if chunk_code.strip():
                chunks.append(CodeChunk(
                    text=chunk_code,
                    chunk_type="code",
                    start_position=i,
                    end_position=end,
                    language=language,
                    line_start=i + 1,
                    line_end=end
                ))

        return chunks

    # ==================== FULL DOCUMENT PROCESSING ====================

    def process_document(
        self,
        content: bytes,
        file_name: str,
        mime_type: str
    ) -> Tuple[str, List[Chunk]]:
        """
        Process a document and return extracted text and chunks.

        Args:
            content: File content bytes
            file_name: Original filename
            mime_type: MIME type

        Returns:
            Tuple of (full_text, chunks)
        """
        # Determine file type
        ext = file_name.lower().split('.')[-1] if '.' in file_name else ''

        if mime_type == 'application/pdf' or ext == 'pdf':
            full_text = self.extract_text_from_pdf(content)
            chunks = self.chunk_text(full_text, "text")

        elif ext in ['py', 'js', 'ts', 'java', 'cpp', 'c', 'go', 'rs']:
            # Code file
            language_map = {
                'py': 'python', 'js': 'javascript', 'ts': 'typescript',
                'java': 'java', 'cpp': 'cpp', 'c': 'c', 'go': 'go', 'rs': 'rust'
            }
            language = language_map.get(ext, 'text')
            full_text = content.decode('utf-8', errors='ignore')
            chunks = self.chunk_code(full_text, language)

        elif ext in ['md', 'markdown']:
            full_text = content.decode('utf-8', errors='ignore')
            chunks = self.chunk_markdown(full_text)

        else:
            # Plain text
            full_text = content.decode('utf-8', errors='ignore')
            chunks = self.chunk_text(full_text, "text")

        return full_text, chunks


# Singleton instance
_chunking_service: Optional[ChunkingService] = None


def get_chunking_service() -> ChunkingService:
    """Get or create chunking service instance"""
    global _chunking_service
    if _chunking_service is None:
        _chunking_service = ChunkingService()
    return _chunking_service
