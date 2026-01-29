"""
Chat Service - Part 5: Conversational Chat Interface

Provides a unified chat interface that integrates:
- Part 2: Semantic search and RAG for course materials
- Part 3: AI content generation
- Conversation context management
"""

import httpx
import json
import uuid
from typing import Optional, Dict, List, Tuple
from datetime import datetime
from app.core.config import settings
from app.services.wikipedia_service import get_wikipedia_service
from app.core.supabase import get_supabase

# Try to import retrieval service (Part 2)
try:
    from app.services.retrieval_service import get_retrieval_service
    HAS_RETRIEVAL = True
except ImportError:
    HAS_RETRIEVAL = False
    print("Warning: Retrieval service not available. Chat will use Wikipedia only.")


class ChatService:
    """Service for conversational AI chat with course context"""

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.model = "anthropic/claude-sonnet-4"
        # Use database for persistent storage
        self._use_db = True

    def _ensure_api_key(self):
        """Ensure OpenRouter API key is available"""
        if not self.api_key or self.api_key == "your-openrouter-api-key":
            raise ValueError("OpenRouter API key not configured")

    async def _call_openrouter(
        self,
        messages: List[Dict],
        system_prompt: str,
        max_tokens: int = 2048
    ) -> Dict:
        """Make a request to OpenRouter API with conversation history"""
        self._ensure_api_key()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "AI Learning Platform Chat"
        }

        # Build messages array with system prompt
        api_messages = [{"role": "system", "content": system_prompt}]
        api_messages.extend(messages)

        payload = {
            "model": self.model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", self.model)
            }

    def _is_file_request(self, query: str) -> Tuple[bool, Optional[str]]:
        """Detect if user is asking for a specific file and extract filename."""
        import re
        query_lower = query.lower()

        # Patterns that indicate file request
        file_request_patterns = [
            r'(?:show|give|display|provide|get|fetch|retrieve|open|view|see|read)\s+(?:me\s+)?(?:the\s+)?(?:file|source|code|content)?\s*[:\-]?\s*["\']?([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)["\']?',
            r'(?:file|source\s*(?:code)?|content\s*of)\s*[:\-]?\s*["\']?([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)["\']?',
            r'["\']([a-zA-Z0-9_\-\.]+\.(?:cpp|c|h|hpp|py|java|js|ts|txt|md))["\']',
            r'(?:what\'?s?\s+(?:in|inside)|contents?\s+of)\s+["\']?([a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)["\']?',
        ]

        for pattern in file_request_patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return True, match.group(1)

        # Check for general file request keywords
        file_keywords = ['show file', 'give file', 'source file', 'source code of', 'full file',
                        'entire file', 'complete file', 'whole file', 'file content']
        is_file_request = any(kw in query_lower for kw in file_keywords)

        return is_file_request, None

    def _get_language_from_filename(self, filename: str) -> str:
        """Get programming language from file extension."""
        ext_map = {
            '.py': 'python', '.cpp': 'cpp', '.c': 'c', '.h': 'c', '.hpp': 'cpp',
            '.java': 'java', '.js': 'javascript', '.ts': 'typescript',
            '.html': 'html', '.css': 'css', '.json': 'json', '.xml': 'xml',
            '.md': 'markdown', '.txt': 'text', '.sql': 'sql', '.sh': 'bash',
            '.yml': 'yaml', '.yaml': 'yaml', '.rs': 'rust', '.go': 'go',
            '.rb': 'ruby', '.php': 'php', '.cs': 'csharp', '.swift': 'swift',
            '.kt': 'kotlin', '.scala': 'scala', '.r': 'r', '.m': 'matlab'
        }
        import os
        ext = os.path.splitext(filename)[1].lower()
        return ext_map.get(ext, 'text')

    async def _get_full_file_content(self, filename: Optional[str] = None, query: str = "") -> Optional[Dict]:
        """Retrieve full file content from storage."""
        print(f"[FILE SEARCH] Looking for file. Filename hint: {filename}, Query: {query[:100]}")

        try:
            from app.core.supabase import get_supabase_admin
            supabase = get_supabase_admin()

            # Get all content files
            content_result = supabase.table('content').select(
                'id, title, file_path, file_name, category, content_type'
            ).execute()

            if not content_result.data:
                print("[FILE SEARCH] No content files found in database")
                return None

            print(f"[FILE SEARCH] Found {len(content_result.data)} files in database")

            # Find matching file
            target_file = None
            query_lower = query.lower()

            # First pass: exact filename match
            if filename:
                for content in content_result.data:
                    file_name = content.get('file_name', '') or ''
                    title = content.get('title', '') or ''
                    print(f"[FILE SEARCH] Checking: {file_name} / {title}")
                    if filename.lower() in file_name.lower() or filename.lower() in title.lower():
                        target_file = content
                        print(f"[FILE SEARCH] Matched by filename hint: {file_name}")
                        break

            # Second pass: check if file name/title is mentioned in query
            if not target_file:
                for content in content_result.data:
                    file_name = content.get('file_name', '') or ''
                    title = content.get('title', '') or ''
                    # Check if file name or title appears in query
                    file_name_no_ext = file_name.rsplit('.', 1)[0].lower() if '.' in file_name else file_name.lower()
                    if file_name.lower() in query_lower or file_name_no_ext in query_lower or title.lower() in query_lower:
                        target_file = content
                        print(f"[FILE SEARCH] Matched by query content: {file_name}")
                        break

            # Third pass: fuzzy matching with query words
            if not target_file:
                query_words = [w.lower() for w in query_lower.split() if len(w) > 3]
                print(f"[FILE SEARCH] Fuzzy search with words: {query_words}")
                for content in content_result.data:
                    file_name = (content.get('file_name', '') or '').lower()
                    title = (content.get('title', '') or '').lower()
                    # Check if any significant word from query matches
                    for word in query_words:
                        if word in file_name or word in title:
                            target_file = content
                            print(f"[FILE SEARCH] Fuzzy matched: {file_name} with word '{word}'")
                            break
                    if target_file:
                        break

            if not target_file:
                print("[FILE SEARCH] No matching file found")
                # List available files for debugging
                print("[FILE SEARCH] Available files:")
                for c in content_result.data[:10]:
                    print(f"  - {c.get('file_name')} ({c.get('title')})")
                return None

            print(f"[FILE SEARCH] Target file found: {target_file.get('file_name')}")

            # Download full file
            file_path = target_file.get("file_path")
            print(f"[FILE SEARCH] Downloading from path: {file_path}")

            file_data = supabase.storage.from_("materials").download(file_path)

            # Decode file
            try:
                text = file_data.decode('utf-8')
            except:
                text = file_data.decode('latin-1', errors='ignore')

            print(f"[FILE SEARCH] File content length: {len(text)} characters")

            # Get language for syntax highlighting
            language = self._get_language_from_filename(target_file.get('file_name', ''))

            return {
                'found': True,
                'file_name': target_file.get('file_name', 'unknown'),
                'title': target_file.get('title', target_file.get('file_name', 'Unknown')),
                'content': text,
                'language': language,
                'category': target_file.get('category', ''),
                'content_id': target_file.get('id')
            }

        except Exception as e:
            print(f"[FILE SEARCH] Error getting full file: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _is_code_query(self, query: str) -> bool:
        """Detect if query is asking about code/functions"""
        query_lower = query.lower()
        import re

        # Check for function patterns: func_name(), FuncName, func_name, snake_case
        patterns = [
            r'\w+\s*\(\s*\)',        # function()
            r'\w+_\w+',              # snake_case
            r'[A-Z][a-z]+[A-Z]\w*',  # CamelCase
            r'#include',             # C/C++ includes
            r'import\s+\w+',         # Python/Java imports
            r'def\s+\w+',            # Python functions
            r'class\s+\w+',          # Classes
            r'void\s+\w+',           # C/C++/Java
            r'int\s+\w+',            # C/C++/Java
            r'bool\s+\w+',           # C/C++
            r'return\s+',            # Return statements
        ]
        has_function_pattern = any(re.search(p, query) for p in patterns)

        code_keywords = [
            'code', 'function', 'method', 'class', 'implement', 'program',
            'algorithm', 'syntax', 'variable', 'loop', 'array', 'pointer',
            'struct', 'enum', 'template', 'vector', 'string', 'main(',
            '.cpp', '.py', '.java', '.js', '.c', '.h', '.hpp',
            'def ', 'void ', 'int ', 'bool ', 'char ', 'float ', 'double ',
            'public', 'private', 'static', 'const', 'return', 'printf', 'cout',
            'scanf', 'cin', 'malloc', 'free', 'new ', 'delete'
        ]
        has_code_keyword = any(kw in query_lower for kw in code_keywords)
        return has_function_pattern or has_code_keyword

    def _extract_search_terms(self, query: str) -> List[str]:
        """Extract key search terms from query, especially function/variable names"""
        import re
        terms = []

        # Extract function names with parentheses: func_name()
        func_matches = re.findall(r'(\w+)\s*\(\s*\)', query)
        terms.extend(func_matches)

        # Extract snake_case identifiers (likely function/variable names)
        snake_case = re.findall(r'\b([a-z]+_[a-z_]+)\b', query.lower())
        terms.extend(snake_case)

        # Extract CamelCase identifiers
        camel_case = re.findall(r'\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b', query)
        terms.extend(camel_case)

        # Extract quoted terms
        quoted = re.findall(r'["\']([^"\']+)["\']', query)
        terms.extend(quoted)

        # Remove duplicates while preserving order
        seen = set()
        unique_terms = []
        for t in terms:
            if t.lower() not in seen:
                seen.add(t.lower())
                unique_terms.append(t)

        return unique_terms

    def _format_context_response(self, chunks: List[Dict]) -> Dict:
        """Format chunks into context response"""
        context_parts = []
        sources = []

        for chunk in chunks:
            source_title = chunk.get('content_title', 'Course Material')
            chunk_text = chunk.get('chunk_text', '')
            similarity = chunk.get('similarity', 0.5)

            if chunk_text:
                context_parts.append(f"[{source_title}]: {chunk_text}")
                sources.append({
                    "title": source_title,
                    "content_id": chunk.get('content_id'),
                    "category": chunk.get('content_category'),
                    "relevance": round(similarity, 3) if similarity else 0.5
                })

        return {
            "found": len(context_parts) > 0,
            "context": "\n\n".join(context_parts),
            "sources": sources
        }

    async def _get_course_context(
        self,
        query: str,
        category: Optional[str] = None,
        max_chunks: int = 8
    ) -> Dict:
        """Fetch relevant context from course materials using multiple search strategies"""
        print(f"[RETRIEVAL] Starting context search for: {query[:100]}")

        chunks = []
        search_terms = self._extract_search_terms(query)
        is_code = self._is_code_query(query)

        print(f"[RETRIEVAL] Is code query: {is_code}, Search terms: {search_terms}")

        # Strategy 1: Always try direct text search first (most reliable)
        print("[RETRIEVAL] Strategy 1: Direct text search...")
        direct_chunks = await self._direct_text_search(query, max_chunks)
        if direct_chunks:
            print(f"[RETRIEVAL] Direct search found {len(direct_chunks)} chunks")
            chunks.extend(direct_chunks)

        # Strategy 2: Search for extracted terms individually
        if search_terms:
            print(f"[RETRIEVAL] Strategy 2: Searching for terms: {search_terms[:5]}")
            for term in search_terms[:5]:
                if len(term) >= 3:
                    term_chunks = await self._direct_text_search(term, 3)
                    if term_chunks:
                        print(f"[RETRIEVAL] Term '{term}' found {len(term_chunks)} chunks")
                        chunks.extend(term_chunks)

        # Strategy 3: Try hybrid search if retrieval service is available
        if HAS_RETRIEVAL and len(chunks) < max_chunks:
            try:
                print("[RETRIEVAL] Strategy 3: Hybrid search...")
                retrieval_service = get_retrieval_service()
                hybrid_chunks = await retrieval_service.hybrid_search(
                    query=query,
                    top_k=max_chunks,
                    keyword_weight=0.6,
                    semantic_weight=0.4,
                    category=category
                )
                if hybrid_chunks:
                    print(f"[RETRIEVAL] Hybrid search found {len(hybrid_chunks)} chunks")
                    chunks.extend(hybrid_chunks)
            except Exception as e:
                print(f"[RETRIEVAL] Hybrid search error: {e}")

        # Strategy 4: Raw file search as fallback
        if len(chunks) < 3:
            print("[RETRIEVAL] Strategy 4: Raw file search...")
            raw_chunks = await self._search_raw_files(query, max_chunks)
            if raw_chunks:
                print(f"[RETRIEVAL] Raw file search found {len(raw_chunks)} chunks")
                chunks.extend(raw_chunks)

        # Deduplicate by chunk_id or content hash
        seen = set()
        unique_chunks = []
        for c in chunks:
            # Create a unique key based on content
            key = c.get('chunk_id') or hash(c.get('chunk_text', '')[:200])
            if key not in seen:
                seen.add(key)
                unique_chunks.append(c)

        chunks = unique_chunks[:max_chunks]
        print(f"[RETRIEVAL] Final: {len(chunks)} unique chunks")

        if not chunks:
            print("[RETRIEVAL] No chunks found!")
            return {"found": False, "context": "", "sources": []}

        # Format context with clear structure
        context_parts = []
        sources = []

        for i, chunk in enumerate(chunks):
            source_title = chunk.get('content_title', 'Course Material')
            chunk_text = chunk.get('chunk_text', '')
            similarity = chunk.get('similarity', 0.5)
            file_name = chunk.get('file_name', '')

            if chunk_text:
                # Format with clear source attribution
                if is_code or self._looks_like_code(chunk_text):
                    # Detect language from file extension or content
                    lang = self._detect_code_language(chunk_text, file_name)
                    formatted = f"### Source: {source_title}\n```{lang}\n{chunk_text}\n```"
                else:
                    formatted = f"### Source: {source_title}\n{chunk_text}"

                context_parts.append(formatted)
                sources.append({
                    "title": source_title,
                    "content_id": chunk.get('content_id'),
                    "category": chunk.get('content_category'),
                    "relevance": round(similarity, 3) if similarity else 0.5
                })

        return {
            "found": len(context_parts) > 0,
            "context": "\n\n---\n\n".join(context_parts),
            "sources": sources
        }

    def _looks_like_code(self, text: str) -> bool:
        """Detect if text looks like code"""
        code_indicators = [
            'def ', 'class ', 'import ', 'from ',  # Python
            'void ', 'int ', 'return ', '#include', 'using namespace',  # C/C++
            'function ', 'const ', 'let ', 'var ',  # JavaScript
            'public ', 'private ', 'static ',  # Java/C#
            '{', '}', '();', '[];', '->'
        ]
        return any(indicator in text for indicator in code_indicators)

    def _detect_code_language(self, text: str, filename: str = "") -> str:
        """Detect programming language from content or filename"""
        if filename:
            ext_map = {
                '.py': 'python', '.cpp': 'cpp', '.c': 'c', '.h': 'c',
                '.java': 'java', '.js': 'javascript', '.ts': 'typescript',
                '.html': 'html', '.css': 'css', '.sql': 'sql'
            }
            import os
            ext = os.path.splitext(filename)[1].lower()
            if ext in ext_map:
                return ext_map[ext]

        # Detect from content
        if 'def ' in text or 'import ' in text or 'print(' in text:
            return 'python'
        if '#include' in text or 'void ' in text or 'int main' in text:
            return 'cpp'
        if 'function ' in text or 'const ' in text or '=>' in text:
            return 'javascript'
        if 'public class' in text or 'public static void' in text:
            return 'java'

        return 'text'

    async def _direct_text_search(self, query: str, limit: int = 6) -> List[Dict]:
        """Direct text search in content_chunks table"""
        try:
            from app.core.supabase import get_supabase_admin
            supabase = get_supabase_admin()

            import re
            # Extract meaningful terms (3+ chars, not common words)
            stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'what', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'show', 'give', 'file', 'code', 'source'}
            all_terms = re.findall(r'\w+', query.lower())
            terms = [t for t in all_terms if len(t) >= 3 and t not in stop_words]

            # Also add the full query for phrase matching
            search_queries = terms[:5]  # Top 5 terms
            if len(query) > 5:
                search_queries.insert(0, query)  # Full query first

            print(f"[DIRECT SEARCH] Searching for terms: {search_queries}")

            results = []
            content_cache = {}  # Cache content metadata

            for search_term in search_queries:
                if len(results) >= limit * 2:
                    break

                try:
                    # Use ilike for case-insensitive search
                    response = supabase.table('content_chunks').select(
                        'id, content_id, chunk_text, chunk_type'
                    ).ilike('chunk_text', f'%{search_term}%').limit(limit).execute()

                    if response.data:
                        print(f"[DIRECT SEARCH] Term '{search_term}' found {len(response.data)} results")
                        for chunk in response.data:
                            content_id = chunk['content_id']

                            # Get content metadata (cached)
                            if content_id not in content_cache:
                                content_resp = supabase.table('content').select(
                                    'title, category, file_name'
                                ).eq('id', content_id).execute()
                                content_cache[content_id] = content_resp.data[0] if content_resp.data else {}

                            content_meta = content_cache[content_id]

                            results.append({
                                'chunk_id': chunk['id'],
                                'content_id': content_id,
                                'chunk_text': chunk['chunk_text'],
                                'chunk_type': chunk.get('chunk_type', 'text'),
                                'content_title': content_meta.get('title', 'Course Material'),
                                'content_category': content_meta.get('category', ''),
                                'file_name': content_meta.get('file_name', ''),
                                'similarity': 0.8,  # Direct text match
                                'matched_term': search_term
                            })
                except Exception as term_error:
                    print(f"[DIRECT SEARCH] Error searching term '{search_term}': {term_error}")
                    continue

            # Remove duplicates, prioritize longer matches
            seen = set()
            unique = []
            for r in results:
                if r['chunk_id'] not in seen:
                    seen.add(r['chunk_id'])
                    unique.append(r)

            print(f"[DIRECT SEARCH] Returning {len(unique[:limit])} unique results")
            return unique[:limit]

        except Exception as e:
            print(f"[DIRECT SEARCH] Error: {e}")
            import traceback
            traceback.print_exc()
            return []

    async def _search_raw_files(self, query: str, limit: int = 3) -> List[Dict]:
        """Search raw content files from storage as final fallback"""
        try:
            from app.core.supabase import get_supabase_admin
            supabase = get_supabase_admin()

            # Get all content files
            content_result = supabase.table('content').select(
                'id, title, file_path, file_name, category'
            ).execute()

            if not content_result.data:
                return []

            results = []

            # Build search terms: full query + extracted terms
            search_terms = [query.lower()]
            extracted = self._extract_search_terms(query)
            search_terms.extend([t.lower() for t in extracted])
            # Remove duplicates
            search_terms = list(dict.fromkeys(search_terms))

            for content in content_result.data:
                try:
                    # Download and search file content
                    file_data = supabase.storage.from_("materials").download(content["file_path"])

                    # Decode file
                    try:
                        text = file_data.decode('utf-8')
                    except:
                        text = file_data.decode('latin-1', errors='ignore')

                    lower_text = text.lower()

                    # Check each search term
                    for search_term in search_terms:
                        if search_term in lower_text:
                            idx = lower_text.find(search_term)

                            # Extract context around the match
                            start = max(0, idx - 200)
                            end = min(len(text), idx + len(search_term) + 800)

                            # Try to expand to function boundaries for code
                            is_code_file = content.get('file_name', '').endswith(
                                ('.cpp', '.c', '.py', '.java', '.js', '.h', '.hpp', '.ts')
                            )
                            if is_code_file:
                                # Find function/block start (look for opening brace or def/void/int)
                                block_start = max(
                                    text.rfind('\n\n', 0, idx),
                                    text.rfind('\nvoid ', 0, idx),
                                    text.rfind('\nint ', 0, idx),
                                    text.rfind('\nbool ', 0, idx),
                                    text.rfind('\ndef ', 0, idx),
                                    text.rfind('\nclass ', 0, idx),
                                )
                                if block_start > start - 500 and block_start != -1:
                                    start = block_start + 1

                                # Find function end (closing brace followed by newline)
                                block_end = text.find('\n}\n', idx)
                                if block_end == -1:
                                    block_end = text.find('\n\n', idx)
                                if block_end != -1 and block_end < end + 500:
                                    end = block_end + 2

                            context = text[start:end].strip()

                            # Avoid duplicate results for same file
                            already_found = any(
                                r['content_id'] == content['id'] for r in results
                            )
                            if not already_found:
                                results.append({
                                    'chunk_id': f"raw_{content['id']}_{search_term[:20]}",
                                    'content_id': content['id'],
                                    'chunk_text': context,
                                    'content_title': content.get('title', content.get('file_name', 'Unknown')),
                                    'content_category': content.get('category', ''),
                                    'similarity': 0.95,  # Direct match in raw file
                                    'matched_term': search_term
                                })

                            if len(results) >= limit:
                                break

                    if len(results) >= limit:
                        break

                except Exception as e:
                    print(f"Error searching file {content.get('file_name')}: {e}")
                    continue

            return results

        except Exception as e:
            print(f"Raw file search error: {e}")
            return []

    async def _get_wikipedia_context(self, query: str, max_articles: int = 2) -> Dict:
        """Fetch context from Wikipedia"""
        try:
            wiki_service = get_wikipedia_service()
            context = await wiki_service.get_context_for_topic(query, max_articles=max_articles)
            return context
        except Exception as e:
            print(f"Wikipedia error: {e}")
            return {"found": False, "articles": [], "combined_context": ""}

    def _verify_grounding(self, response: str, sources: List[Dict]) -> Dict:
        """
        Verify which sources were actually used in the response.
        Returns filtered sources and grounding score.
        """
        import re

        response_lower = response.lower()
        used_sources = []
        unused_sources = []

        for source in sources:
            title = source.get('title', '')
            title_lower = title.lower()

            # Check if source was cited inline [Source: ...]
            cited_pattern = f"\\[source:?\\s*{re.escape(title_lower)}\\]"
            is_cited = bool(re.search(cited_pattern, response_lower, re.IGNORECASE))

            # Check if title is mentioned in response
            is_mentioned = title_lower in response_lower

            # Check if key terms from title appear in response
            title_words = [w for w in title_lower.split() if len(w) > 3]
            terms_found = sum(1 for w in title_words if w in response_lower)
            term_overlap = terms_found / len(title_words) if title_words else 0

            if is_cited or is_mentioned or term_overlap > 0.5:
                source['actually_used'] = True
                source['citation_found'] = is_cited
                used_sources.append(source)
            else:
                source['actually_used'] = False
                unused_sources.append(source)

        # Calculate grounding score
        total_sources = len(sources)
        used_count = len(used_sources)
        grounding_score = used_count / total_sources if total_sources > 0 else 0

        # Check for potential hallucination indicators
        hallucination_phrases = [
            "i think", "i believe", "probably", "might be",
            "generally speaking", "in my opinion", "typically"
        ]
        hallucination_risk = sum(1 for phrase in hallucination_phrases if phrase in response_lower)

        return {
            'used_sources': used_sources,
            'unused_sources': unused_sources,
            'grounding_score': round(grounding_score, 2),
            'hallucination_risk': 'low' if hallucination_risk < 2 else 'medium' if hallucination_risk < 4 else 'high',
            'is_grounded': grounding_score > 0.3 or "don't have information" in response_lower
        }

    def _detect_intent(self, message: str) -> Dict:
        """Detect user intent from message"""
        message_lower = message.lower()

        # Search intent
        if any(word in message_lower for word in ['search', 'find', 'look for', 'where is', 'show me']):
            return {"type": "search", "confidence": 0.8}

        # Generation intent
        if any(word in message_lower for word in ['generate', 'create', 'make', 'write']):
            if any(word in message_lower for word in ['quiz', 'question', 'test']):
                return {"type": "generate_quiz", "confidence": 0.9}
            if any(word in message_lower for word in ['code', 'program', 'function']):
                return {"type": "generate_code", "confidence": 0.9}
            if any(word in message_lower for word in ['slide', 'presentation']):
                return {"type": "generate_slides", "confidence": 0.9}
            if any(word in message_lower for word in ['note', 'summary', 'explain']):
                return {"type": "generate_notes", "confidence": 0.9}
            return {"type": "generate", "confidence": 0.7}

        # Explanation intent
        if any(word in message_lower for word in ['explain', 'what is', 'how does', 'why', 'describe', 'tell me about']):
            return {"type": "explain", "confidence": 0.8}

        # Summary intent
        if any(word in message_lower for word in ['summarize', 'summary', 'overview', 'brief']):
            return {"type": "summarize", "confidence": 0.8}

        # Default: conversational question
        return {"type": "question", "confidence": 0.5}

    def create_conversation(self, user_id: str) -> str:
        """Create a new conversation and return its ID"""
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()

        conv_id = str(uuid.uuid4())
        try:
            supabase.table('conversations').insert({
                'id': conv_id,
                'user_id': user_id,
                'title': 'New Conversation'
            }).execute()
            return conv_id
        except Exception as e:
            print(f"Error creating conversation: {e}")
            return conv_id  # Return ID anyway, will work with fallback

    def get_conversation(self, conv_id: str) -> Optional[Dict]:
        """Get conversation by ID with messages"""
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()

        try:
            # Get conversation
            conv_result = supabase.table('conversations').select('*').eq('id', conv_id).execute()
            if not conv_result.data:
                return None

            conv = conv_result.data[0]

            # Get messages
            msg_result = supabase.table('messages').select('*').eq(
                'conversation_id', conv_id
            ).order('created_at').execute()

            messages = []
            for msg in (msg_result.data or []):
                messages.append({
                    'role': msg['role'],
                    'content': msg['content'],
                    'timestamp': msg['created_at'],
                    'sources': msg.get('sources', []),
                    'metadata': msg.get('metadata', {})
                })

            return {
                'id': conv['id'],
                'user_id': conv['user_id'],
                'messages': messages,
                'created_at': conv['created_at'],
                'updated_at': conv.get('updated_at')
            }
        except Exception as e:
            print(f"Error getting conversation: {e}")
            return None

    def get_user_conversations(self, user_id: str) -> List[Dict]:
        """Get all conversations for a user"""
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()

        try:
            # Get conversations
            result = supabase.table('conversations').select('*').eq(
                'user_id', user_id
            ).order('updated_at', desc=True).execute()

            user_convs = []
            for conv in (result.data or []):
                # Get last message for this conversation
                msg_result = supabase.table('messages').select('content').eq(
                    'conversation_id', conv['id']
                ).order('created_at', desc=True).limit(1).execute()

                last_message = ""
                if msg_result.data:
                    last_message = msg_result.data[0]['content'][:100]

                # Get message count
                count_result = supabase.table('messages').select(
                    'id', count='exact'
                ).eq('conversation_id', conv['id']).execute()

                user_convs.append({
                    'id': conv['id'],
                    'created_at': conv['created_at'],
                    'updated_at': conv.get('updated_at', conv['created_at']),
                    'message_count': count_result.count or 0,
                    'last_message': last_message
                })

            return user_convs
        except Exception as e:
            print(f"Error getting user conversations: {e}")
            return []

    async def chat(
        self,
        conversation_id: str,
        user_message: str,
        user_id: str
    ) -> Dict:
        """
        Process a chat message and return AI response with sources.

        Args:
            conversation_id: Conversation ID (or "new" for new conversation)
            user_message: User's message
            user_id: User ID for context

        Returns:
            Response with AI message, sources, and metadata
        """
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()

        # Create new conversation if needed
        if conversation_id == "new":
            conversation_id = self.create_conversation(user_id)
        else:
            # Check if conversation exists
            conv = self.get_conversation(conversation_id)
            if not conv:
                conversation_id = self.create_conversation(user_id)

        # Get conversation with messages
        conv = self.get_conversation(conversation_id)
        if not conv:
            conv = {"messages": []}

        # Detect intent
        intent = self._detect_intent(user_message)
        print(f"[CHAT] User message: {user_message[:100]}...")
        print(f"[CHAT] Detected intent: {intent}")

        # Check if user is asking for a specific file
        is_file_request, requested_filename = self._is_file_request(user_message)
        file_content = None
        print(f"[CHAT] Is file request: {is_file_request}, Filename: {requested_filename}")

        if is_file_request:
            file_content = await self._get_full_file_content(requested_filename, user_message)
            print(f"[CHAT] File content found: {file_content is not None and file_content.get('found', False)}")
            if file_content:
                print(f"[CHAT] File: {file_content.get('file_name')}, Content length: {len(file_content.get('content', ''))}")

        # Fetch relevant context based on the message
        course_context = await self._get_course_context(user_message)
        wiki_context = await self._get_wikipedia_context(user_message)
        print(f"[CHAT] Course context found: {course_context.get('found', False)}")

        # Build system prompt based on request type
        if is_file_request and file_content:
            system_prompt = """You are an AI learning assistant for a university course platform.

The user has requested a specific file. Your job is to present the file content clearly and professionally.

RESPONSE FORMAT FOR FILE REQUESTS:
1. Start with a brief header showing the file name and type
2. Present the COMPLETE file content in a properly formatted code block with syntax highlighting
3. After the code, provide a brief summary of what the file contains
4. If the file is long, still show the COMPLETE content - do not truncate

EXAMPLE RESPONSE:
## 📄 File: example.cpp

```cpp
// Complete file content here
#include <iostream>

int main() {
    std::cout << "Hello World" << std::endl;
    return 0;
}
```

### Summary
This file contains a simple C++ program that prints "Hello World" to the console.

---
**Source:** [File Name from Course Materials]

IMPORTANT:
- Always use the correct language identifier in code blocks (cpp, python, java, etc.)
- Show the ENTIRE file content, not just snippets
- Use proper markdown formatting
- Add line numbers if the code is educational"""
        else:
            system_prompt = """You are an AI learning assistant for a university course platform.

CRITICAL GROUNDING RULES:
1. ONLY answer based on the provided context (course materials or Wikipedia)
2. If the context doesn't contain relevant information, say "I don't have information about this in the course materials"
3. NEVER make up facts or information not present in the context
4. When you use information from context, cite it inline like this: [Source: Title]
5. If asked about something not in the context, acknowledge this clearly

RESPONSE FORMAT:
- Use markdown formatting for readability
- For ANY code snippets, ALWAYS use fenced code blocks with language identifiers:
  ```python
  code here
  ```
- Include inline citations [Source: ...] when referencing specific information
- At the end, list which sources you actually used
- If no relevant context was provided, state that clearly

EXAMPLE:
User: What is a binary tree?
Response: A binary tree is a data structure where each node has at most two children [Source: Data Structures Lecture 5]. The left child is typically smaller and the right child is larger in a binary search tree [Source: Data Structures Lecture 5].

Sources used: Data Structures Lecture 5

If context is NOT relevant to the question, respond:
"I don't have specific information about [topic] in the available course materials. Would you like me to explain based on general knowledge, or would you prefer to search for specific course content?"
"""

        # Add context to the conversation
        context_message = ""
        sources = []

        # If file was requested and found, add full file content first
        if is_file_request and file_content and file_content.get('found'):
            lang = file_content.get('language', 'text')
            content = file_content.get('content', '')
            title = file_content.get('title', file_content.get('file_name', 'Unknown'))

            context_message += f"\n\n[REQUESTED FILE: {file_content.get('file_name', 'unknown')}]\n"
            context_message += f"Language: {lang}\n"
            context_message += f"```{lang}\n{content}\n```\n"

            sources.append({
                "type": "file",
                "title": title,
                "file_name": file_content.get('file_name'),
                "relevance": 1.0
            })

        if course_context.get("found"):
            # Format code content properly
            context_text = course_context['context']
            # Check if it looks like code and wrap appropriately
            if self._is_code_query(user_message):
                context_message += f"\n\n[COURSE MATERIALS - CODE CONTEXT]\n```\n{context_text}\n```\n"
            else:
                context_message += f"\n\n[COURSE MATERIALS CONTEXT]\n{context_text}\n"

            sources.extend([{
                "type": "course",
                "title": s["title"],
                "relevance": s["relevance"]
            } for s in course_context.get("sources", [])])

        if wiki_context.get("found"):
            context_message += f"\n\n[WIKIPEDIA CONTEXT]\n{wiki_context['combined_context'][:1500]}\n"
            sources.extend([{
                "type": "wikipedia",
                "title": a.get("title", "Unknown")
            } for a in wiki_context.get("articles", [])])

        # Build messages for API
        api_messages = []

        # Add conversation history (last 10 messages for context)
        for msg in conv["messages"][-10:]:
            api_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current message with context
        current_content = user_message
        if context_message:
            current_content = f"{user_message}\n\n---\nRelevant context for answering:{context_message}"

        api_messages.append({
            "role": "user",
            "content": current_content
        })

        # Call AI
        try:
            response = await self._call_openrouter(api_messages, system_prompt)
            ai_message = response["content"]

            # Verify grounding - check which sources were actually used
            grounding_result = self._verify_grounding(ai_message, sources)
            verified_sources = grounding_result['used_sources']

            # Store messages in database
            try:
                # Save user message
                supabase.table('messages').insert({
                    'conversation_id': conversation_id,
                    'role': 'user',
                    'content': user_message,
                    'sources': [],
                    'metadata': {}
                }).execute()

                # Save assistant message with verified sources only
                supabase.table('messages').insert({
                    'conversation_id': conversation_id,
                    'role': 'assistant',
                    'content': ai_message,
                    'sources': verified_sources,
                    'metadata': {
                        'model': response.get('model', self.model),
                        'tokens_used': response.get('usage', {}).get('total_tokens', 0),
                        'grounding_score': grounding_result['grounding_score'],
                        'is_grounded': grounding_result['is_grounded']
                    }
                }).execute()

                # Update conversation's updated_at
                supabase.table('conversations').update({
                    'title': user_message[:100]  # Use first message as title
                }).eq('id', conversation_id).execute()

            except Exception as db_error:
                print(f"Error saving messages to DB: {db_error}")

            return {
                "success": True,
                "conversation_id": conversation_id,
                "message": ai_message,
                "sources": verified_sources,  # Only return sources that were actually used
                "intent": intent,
                "grounding": {
                    "score": grounding_result['grounding_score'],
                    "is_grounded": grounding_result['is_grounded'],
                    "hallucination_risk": grounding_result['hallucination_risk'],
                    "sources_provided": len(sources),
                    "sources_used": len(verified_sources)
                },
                "metadata": {
                    "model": response["model"],
                    "tokens_used": response["usage"].get("total_tokens", 0),
                    "course_context_used": course_context.get("found", False),
                    "wikipedia_context_used": wiki_context.get("found", False)
                }
            }

        except Exception as e:
            return {
                "success": False,
                "conversation_id": conversation_id,
                "error": str(e),
                "message": "I'm sorry, I encountered an error processing your request. Please try again."
            }

    def clear_conversation(self, conversation_id: str) -> bool:
        """Clear a conversation's history (delete all messages)"""
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()

        try:
            supabase.table('messages').delete().eq(
                'conversation_id', conversation_id
            ).execute()
            return True
        except Exception as e:
            print(f"Error clearing conversation: {e}")
            return False

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages"""
        from app.core.supabase import get_supabase_admin
        supabase = get_supabase_admin()

        try:
            # Messages will be deleted via CASCADE
            supabase.table('conversations').delete().eq(
                'id', conversation_id
            ).execute()
            return True
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False


# Singleton instance
_chat_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    """Get or create chat service instance"""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
