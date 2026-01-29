"""
Content Processing Service
Extracts text, chunks content, and generates embeddings for search
"""

import re
from typing import List, Dict, Any, Optional
from app.core.supabase import get_supabase_admin
from app.services.embedding_service import get_embedding_service


class ContentProcessingService:
    """Service for processing uploaded content for search indexing"""

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.chunk_size = 1000  # Characters per chunk
        self.chunk_overlap = 200  # Overlap between chunks

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

        # Decode file content to text
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
        for chunk in chunks:
            chunk_text = chunk['text']

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

        return {
            "success": True,
            "chunks_created": len(stored_chunks),
            "is_code": is_code,
            "file_extension": extension
        }

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
            chunk_text = chunk['text']

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
