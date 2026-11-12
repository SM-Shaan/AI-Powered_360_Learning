"""
Content Processing Service
Extracts text, chunks content, and generates embeddings for search
"""

import re
import io
from typing import List, Dict, Any, Optional
from PyPDF2 import PdfReader
from app.core.supabase import get_supabase_admin
from app.services.embedding_service import get_embedding_service


class ContentProcessingService:
    """Service for processing uploaded content for search indexing"""

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.chunk_size = 1000  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks

    def _is_garbage_text(self, text: str) -> bool:
        """
        Check if extracted text is actually PDF binary/stream garbage.
        """
        if not text or len(text) < 50:
            return False

        garbage_indicators = [
            'endstream', 'endobj', '/Font', '/XObject', '/Pattern',
            '/Paint', '/Image', '/ExtGState', '/ColorSpace', '/Encoding',
            'BT\n', '\nET', '/F1 ', '/F2 ', '0 R >>', 'obj <<',
            '/Type /Page', '/MediaBox', '/Resources', '/ProcSet'
        ]

        garbage_count = sum(1 for indicator in garbage_indicators if indicator in text)
        printable_ratio = sum(1 for c in text if c.isprintable() or c in '\n\t ') / len(text)

        if garbage_count >= 3 or printable_ratio < 0.7:
            return True

        special_pattern = r'[§¶µ¤©®™°±²³´¸¹º»¼½¾¿×÷ØÙÚÛÜÝÞßøùúûüýþÿ]{3,}'
        if len(re.findall(special_pattern, text)) > 5:
            return True

        return False

    def _clean_pdf_text(self, text: str) -> str:
        """Clean extracted PDF text by removing artifacts and null bytes."""
        if not text:
            return ""

        # CRITICAL: Remove null bytes first - PostgreSQL cannot store these
        cleaned = text.replace('\x00', '').replace('\u0000', '')

        # Remove other control characters
        cleaned = ''.join(char for char in cleaned if ord(char) >= 32 or char in '\n\t\r')

        # Remove PDF artifacts
        artifacts = [
            r'(?:endstream|endobj|obj\s*<<|>>\s*stream)',
            r'/[A-Z][a-z]*\d*\s+\d+\s+\d+\s+R',
            r'<<[^>]*>>',
        ]

        for pattern in artifacts:
            cleaned = re.sub(pattern, ' ', cleaned, flags=re.IGNORECASE)

        # Normalize whitespace
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        cleaned = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned)

        return cleaned.strip()

    def _sanitize_for_db(self, text: str) -> str:
        """
        Sanitize text for PostgreSQL storage.
        Removes null bytes and other characters that cause database errors.
        """
        if not text:
            return ""
        # Remove null bytes which PostgreSQL cannot store
        sanitized = text.replace('\x00', '').replace('\u0000', '')
        # Remove any other problematic control characters
        sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\t\r')
        return sanitized

    def _extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """
        Extract text from PDF content with validation.

        Args:
            pdf_content: PDF file bytes

        Returns:
            Extracted text

        Raises:
            ValueError: If PDF cannot be properly extracted
        """
        try:
            reader = PdfReader(io.BytesIO(pdf_content))
            text_parts = []
            garbage_pages = 0

            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()

                    if page_text:
                        if self._is_garbage_text(page_text):
                            garbage_pages += 1
                            print(f"Warning: Page {page_num + 1} extracted as garbage, skipping")
                            continue

                        cleaned_text = self._clean_pdf_text(page_text)

                        if cleaned_text and len(cleaned_text) > 20:
                            text_parts.append(f"[Page {page_num + 1}]\n{cleaned_text}")

                except Exception as page_error:
                    print(f"Warning: Failed to extract page {page_num + 1}: {page_error}")
                    continue

            full_text = "\n\n".join(text_parts)

            total_pages = len(reader.pages)
            if garbage_pages > total_pages * 0.5:
                raise ValueError(
                    f"PDF extraction failed: {garbage_pages}/{total_pages} pages contained "
                    "unreadable data. This PDF may be image-based or have encoding issues."
                )

            if not full_text.strip():
                raise ValueError(
                    "No readable text could be extracted from this PDF. "
                    "It may be image-based. Try using the OCR upload feature instead."
                )

            return full_text

        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Failed to extract PDF text: {str(e)}")

    def _extract_text_from_code(self, content: str, extension: str) -> str:
        """Extract meaningful text from code files"""
        # For code, keep the content as-is but add comments about structure
        return content

    def _detect_code_elements(self, code: str, extension: str) -> List[Dict]:
        """Detect functions, classes, and other code elements"""
        elements = []

        # Detect functions based on language
        if extension in ['.py']:
            # Python functions and classes
            func_pattern = r'def\s+(\w+)\s*\([^)]*\):'
            class_pattern = r'class\s+(\w+)\s*[:\(]'
            for match in re.finditer(func_pattern, code):
                elements.append({'type': 'function', 'name': match.group(1), 'start': match.start()})
            for match in re.finditer(class_pattern, code):
                elements.append({'type': 'class', 'name': match.group(1), 'start': match.start()})

        elif extension in ['.cpp', '.c', '.h', '.hpp']:
            # C/C++ functions
            # Match function definitions like: type name(params) {
            func_pattern = r'(?:[\w:*&]+\s+)+(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{'
            class_pattern = r'class\s+(\w+)\s*[{:]'
            for match in re.finditer(func_pattern, code):
                elements.append({'type': 'function', 'name': match.group(1), 'start': match.start()})
            for match in re.finditer(class_pattern, code):
                elements.append({'type': 'class', 'name': match.group(1), 'start': match.start()})

        elif extension in ['.java']:
            # Java methods and classes
            func_pattern = r'(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{'
            class_pattern = r'class\s+(\w+)'
            for match in re.finditer(func_pattern, code):
                elements.append({'type': 'function', 'name': match.group(1), 'start': match.start()})
            for match in re.finditer(class_pattern, code):
                elements.append({'type': 'class', 'name': match.group(1), 'start': match.start()})

        elif extension in ['.js', '.ts']:
            # JavaScript/TypeScript
            func_pattern = r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>)'
            class_pattern = r'class\s+(\w+)'
            for match in re.finditer(func_pattern, code):
                name = match.group(1) or match.group(2) or match.group(3)
                if name:
                    elements.append({'type': 'function', 'name': name, 'start': match.start()})
            for match in re.finditer(class_pattern, code):
                elements.append({'type': 'class', 'name': match.group(1), 'start': match.start()})

        return elements

    def _chunk_text(self, text: str, chunk_type: str = 'text') -> List[Dict]:
        """Split text into overlapping chunks"""
        chunks = []

        if len(text) <= self.chunk_size:
            chunks.append({
                'text': text,
                'type': chunk_type,
                'start': 0,
                'end': len(text)
            })
            return chunks

        start = 0
        chunk_index = 0

        while start < len(text):
            end = start + self.chunk_size

            # Try to break at paragraph or sentence boundary
            if end < len(text):
                # Look for paragraph break
                para_break = text.rfind('\n\n', start, end)
                if para_break > start + self.chunk_size // 2:
                    end = para_break + 2
                else:
                    # Look for sentence break
                    sentence_break = text.rfind('. ', start, end)
                    if sentence_break > start + self.chunk_size // 2:
                        end = sentence_break + 2

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    'text': chunk_text,
                    'type': chunk_type,
                    'start': start,
                    'end': end,
                    'index': chunk_index
                })
                chunk_index += 1

            # Move start with overlap
            start = end - self.chunk_overlap
            if start >= len(text):
                break

        return chunks

    def _chunk_code(self, code: str, extension: str) -> List[Dict]:
        """Chunk code intelligently by functions/classes"""
        chunks = []
        elements = self._detect_code_elements(code, extension)

        if not elements:
            # No structure detected, use regular chunking
            return self._chunk_text(code, chunk_type='code')

        # Sort elements by position
        elements.sort(key=lambda x: x['start'])

        lines = code.split('\n')
        current_line = 0

        # Create chunks around each element
        for i, element in enumerate(elements):
            # Find the line number for this element
            char_count = 0
            element_line = 0
            for line_num, line in enumerate(lines):
                char_count += len(line) + 1  # +1 for newline
                if char_count >= element['start']:
                    element_line = line_num
                    break

            # Find the end of this element (next element start or end of code)
            if i + 1 < len(elements):
                next_start = elements[i + 1]['start']
                # Find line number for next element
                char_count = 0
                end_line = len(lines)
                for line_num, line in enumerate(lines):
                    char_count += len(line) + 1
                    if char_count >= next_start:
                        end_line = line_num
                        break
            else:
                end_line = len(lines)

            # Extract code for this element
            start_line = max(0, element_line - 2)  # Include some context
            element_code = '\n'.join(lines[start_line:end_line])

            if element_code.strip():
                chunks.append({
                    'text': element_code,
                    'type': 'code',
                    'element_type': element['type'],
                    'element_name': element['name'],
                    'start_line': start_line,
                    'end_line': end_line,
                    'index': len(chunks)
                })

        # If we have chunks, also add the full file as context
        if chunks and len(code) <= 5000:
            chunks.insert(0, {
                'text': code,
                'type': 'code_full',
                'element_type': 'file',
                'element_name': 'full_content',
                'start_line': 0,
                'end_line': len(lines),
                'index': 0
            })
            # Update indices
            for i, c in enumerate(chunks):
                c['index'] = i

        return chunks if chunks else self._chunk_text(code, chunk_type='code')

    async def process_content(
        self,
        content_id: str,
        file_content: bytes,
        file_name: str,
        mime_type: str
    ) -> Dict[str, Any]:
        """
        Process uploaded content: extract text, chunk, and generate embeddings.

        Args:
            content_id: ID of the content record
            file_content: Raw file bytes
            file_name: Original filename
            mime_type: MIME type

        Returns:
            Processing result with chunk count and status
        """
        supabase = get_supabase_admin()

        # Get file extension
        extension = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ''

        # Handle PDFs separately
        if extension == '.pdf' or mime_type == 'application/pdf':
            try:
                text = self._extract_text_from_pdf(file_content)
                print(f"Extracted {len(text)} characters from PDF")
            except ValueError as e:
                return {"success": False, "error": str(e)}
            except Exception as e:
                return {"success": False, "error": f"PDF extraction failed: {str(e)}"}
        else:
            # Decode file content to text for non-PDF files
            try:
                text = file_content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text = file_content.decode('latin-1')
                except:
                    return {"success": False, "error": "Could not decode file content"}

        # Determine if this is code
        code_extensions = ['.py', '.js', '.ts', '.java', '.c', '.cpp', '.h', '.hpp',
                          '.cs', '.go', '.rs', '.rb', '.php', '.sql', '.sh']
        is_code = extension in code_extensions

        # Create chunks
        if is_code:
            chunks = self._chunk_code(text, extension)
        else:
            chunks = self._chunk_text(text)

        # Store chunks and generate embeddings
        stored_chunks = []
        embedded_count = 0
        embedding_errors = []
        used_hash_fallback = False
        for chunk in chunks:
            # Sanitize chunk text for database storage (removes null bytes)
            chunk_text = self._sanitize_for_db(chunk['text'])

            if not chunk_text.strip():
                continue  # Skip empty chunks

            # Generate embedding. A failure here is not fatal - the chunk is
            # still stored and findable by keyword - but it does mean the chunk
            # is invisible to semantic search, so the count is reported back to
            # the caller rather than silently swallowed.
            try:
                embedding = await self.embedding_service.embed_document(chunk_text)
                if embedding:
                    embedded_count += 1
                else:
                    embedding_errors.append("embedding service returned no vector")
            except Exception as e:
                print(f"Embedding error for chunk: {e}")
                embedding_errors.append(str(e))
                embedding = None

            # A hash-fallback embedding counts as "stored" but is not semantic,
            # so treat it as a failure for reporting purposes.
            if getattr(self.embedding_service, "used_fallback_embedding", False):
                used_hash_fallback = True

            # Build metadata
            metadata = {
                'start': chunk.get('start', 0),
                'end': chunk.get('end', len(chunk_text)),
            }

            if chunk.get('element_type'):
                metadata['element_type'] = chunk['element_type']
            if chunk.get('element_name'):
                metadata['function_name' if chunk.get('element_type') == 'function' else 'class_name'] = chunk['element_name']
            if chunk.get('start_line') is not None:
                metadata['line_start'] = chunk['start_line']
            if chunk.get('end_line') is not None:
                metadata['line_end'] = chunk['end_line']
            if is_code:
                # Detect language
                lang_map = {
                    '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
                    '.java': 'java', '.c': 'c', '.cpp': 'cpp', '.h': 'c',
                    '.hpp': 'cpp', '.cs': 'csharp', '.go': 'go', '.rs': 'rust',
                    '.rb': 'ruby', '.php': 'php', '.sql': 'sql', '.sh': 'bash'
                }
                metadata['language'] = lang_map.get(extension, 'unknown')

            # Insert chunk
            chunk_data = {
                'content_id': content_id,
                'chunk_text': chunk_text,
                'chunk_type': chunk.get('type', 'text'),
                'chunk_index': chunk.get('index', len(stored_chunks)),
                'metadata': metadata
            }

            if embedding:
                chunk_data['embedding'] = embedding

            try:
                result = supabase.table('content_chunks').insert(chunk_data).execute()
                if result.data:
                    stored_chunks.append(result.data[0])
            except Exception as e:
                print(f"Error storing chunk: {e}")

        # Also generate embedding for the full content record
        try:
            # Create a summary for the content embedding
            summary = text[:2000] if len(text) > 2000 else text
            content_embedding = await self.embedding_service.embed_document(summary)

            # Update content record with embedding
            supabase.table('content').update({
                'embedding': content_embedding
            }).eq('id', content_id).execute()
        except Exception as e:
            print(f"Error updating content embedding: {e}")

        result = {
            "success": True,
            "chunks_created": len(stored_chunks),
            "chunks_embedded": embedded_count,
            "is_code": is_code,
            "file_extension": extension
        }

        # Two distinct degraded outcomes, both reported rather than swallowed:
        # missing embeddings (chunk is keyword-only) and hash-fallback
        # embeddings (chunk is stored but semantically meaningless).
        if embedded_count < len(stored_chunks):
            result["semantic_search_degraded"] = True
            result["embedding_error"] = (
                embedding_errors[0] if embedding_errors else "unknown embedding failure"
            )
            print(
                f"WARNING: content {content_id} indexed with "
                f"{embedded_count}/{len(stored_chunks)} chunks embedded. "
                f"Semantic search will be incomplete. "
                f"First error: {result['embedding_error']}"
            )

        if used_hash_fallback:
            result["semantic_search_degraded"] = True
            result["used_hash_fallback"] = True
            result.setdefault(
                "embedding_error",
                "HUGGINGFACE_TOKEN not set - stored hash embeddings, which are "
                "not semantic. Semantic search results will be meaningless."
            )
            print(
                f"WARNING: content {content_id} was embedded with the hash "
                f"fallback, not a real embedding model. Semantic search over "
                f"this content will return arbitrary results. "
                f"Set HUGGINGFACE_TOKEN in .env and re-index."
            )

        return result

    async def process_handwritten_content(
        self,
        content_id: str,
        extracted_text: str,
        original_filename: str
    ) -> Dict[str, Any]:
        """
        Process OCR-extracted text from handwritten notes.

        Args:
            content_id: ID of the content record
            extracted_text: Text extracted via OCR
            original_filename: Original image filename

        Returns:
            Processing result with chunk count and status
        """
        supabase = get_supabase_admin()

        if not extracted_text or not extracted_text.strip():
            return {"success": False, "error": "No text extracted from image"}

        # Clean up OCR text (fix common OCR errors)
        cleaned_text = self._clean_ocr_text(extracted_text)

        # Create chunks from the extracted text
        chunks = self._chunk_text(cleaned_text, chunk_type='handwritten')

        # Store chunks and generate embeddings
        stored_chunks = []
        for chunk in chunks:
            # Sanitize chunk text for database storage (removes null bytes)
            chunk_text = self._sanitize_for_db(chunk['text'])

            if not chunk_text.strip():
                continue  # Skip empty chunks

            # Generate embedding
            try:
                embedding = await self.embedding_service.embed_document(chunk_text)
            except Exception as e:
                print(f"Embedding error for chunk: {e}")
                embedding = None

            # Build metadata
            metadata = {
                'start': chunk.get('start', 0),
                'end': chunk.get('end', len(chunk_text)),
                'source': 'handwritten_ocr',
                'original_file': original_filename
            }

            # Insert chunk
            chunk_data = {
                'content_id': content_id,
                'chunk_text': chunk_text,
                'chunk_type': 'handwritten',
                'chunk_index': chunk.get('index', len(stored_chunks)),
                'metadata': metadata
            }

            if embedding:
                chunk_data['embedding'] = embedding

            try:
                result = supabase.table('content_chunks').insert(chunk_data).execute()
                if result.data:
                    stored_chunks.append(result.data[0])
            except Exception as e:
                print(f"Error storing chunk: {e}")

        # Generate embedding for the full content record
        try:
            summary = cleaned_text[:2000] if len(cleaned_text) > 2000 else cleaned_text
            content_embedding = await self.embedding_service.embed_document(summary)

            supabase.table('content').update({
                'embedding': content_embedding
            }).eq('id', content_id).execute()
        except Exception as e:
            print(f"Error updating content embedding: {e}")

        return {
            "success": True,
            "chunks_created": len(stored_chunks),
            "is_handwritten": True,
            "text_length": len(cleaned_text)
        }

    def _clean_ocr_text(self, text: str) -> str:
        """
        Clean OCR-extracted text to fix common errors.

        Args:
            text: Raw OCR text

        Returns:
            Cleaned text
        """
        import re

        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Fix common OCR substitutions
        replacements = {
            '|': 'I',  # Pipe to I
            '0': 'O',  # Zero to O (context-dependent, be careful)
            '1': 'l',  # One to l (context-dependent)
        }
        # Note: Only apply these replacements in specific contexts
        # For now, just clean up whitespace

        # Remove non-printable characters
        text = ''.join(char for char in text if char.isprintable() or char in '\n\t')

        # Normalize line breaks
        text = re.sub(r'\n{3,}', '\n\n', text)

        return text.strip()


# Singleton instance
_processing_service: Optional[ContentProcessingService] = None


def get_content_processing_service() -> ContentProcessingService:
    """Get or create content processing service instance"""
    global _processing_service
    if _processing_service is None:
        _processing_service = ContentProcessingService()
    return _processing_service
