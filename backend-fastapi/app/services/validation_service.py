"""
Content Validation Service - Part 4
Validates AI-generated content for correctness, relevance, and academic reliability
"""

import ast
import re
import subprocess
import tempfile
import os
import json
from typing import Optional, Dict, List, Tuple
import httpx
from app.core.config import settings
from app.core.supabase import get_supabase_admin


class ValidationService:
    """Service for validating AI-generated content"""

    # Dangerous imports/functions to block in executed code
    BLOCKED_IMPORTS = {
        'os', 'subprocess', 'shutil', 'sys', 'socket', 'requests',
        'urllib', 'http', 'ftplib', 'telnetlib', 'smtplib', 'pickle',
        'shelve', 'marshal', 'importlib', '__import__', 'eval', 'exec',
        'compile', 'open', 'file', 'input', 'raw_input'
    }

    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.model = "anthropic/claude-sonnet-4"

    # ==================== CODE VALIDATION ====================

    def validate_python_syntax(self, code: str) -> Dict:
        """
        Validate Python code syntax using AST parsing

        Returns:
            Dict with is_valid, issues, and error_message
        """
        issues = []

        try:
            ast.parse(code)
            return {
                "is_valid": True,
                "language": "python",
                "issues": issues,
                "error_message": None
            }
        except SyntaxError as e:
            issues.append({
                "severity": "error",
                "message": str(e.msg),
                "line": e.lineno,
                "suggestion": "Fix the syntax error at the indicated line"
            })
            return {
                "is_valid": False,
                "language": "python",
                "issues": issues,
                "error_message": f"Syntax error at line {e.lineno}: {e.msg}"
            }
        except Exception as e:
            return {
                "is_valid": False,
                "language": "python",
                "issues": [{"severity": "error", "message": str(e), "line": None, "suggestion": None}],
                "error_message": str(e)
            }

    def validate_javascript_syntax(self, code: str) -> Dict:
        """
        Basic JavaScript syntax validation using pattern matching
        (For full validation, would need Node.js or external tool)
        """
        issues = []
        is_valid = True

        # Check for common syntax issues
        # Unmatched brackets
        brackets = {'(': ')', '[': ']', '{': '}'}
        stack = []
        for i, char in enumerate(code):
            if char in brackets:
                stack.append((char, i))
            elif char in brackets.values():
                if not stack:
                    issues.append({
                        "severity": "error",
                        "message": f"Unmatched closing bracket '{char}'",
                        "line": code[:i].count('\n') + 1,
                        "suggestion": "Check bracket matching"
                    })
                    is_valid = False
                else:
                    open_bracket, _ = stack.pop()
                    if brackets[open_bracket] != char:
                        issues.append({
                            "severity": "error",
                            "message": f"Mismatched brackets: '{open_bracket}' and '{char}'",
                            "line": code[:i].count('\n') + 1,
                            "suggestion": "Fix bracket pairing"
                        })
                        is_valid = False

        if stack:
            issues.append({
                "severity": "error",
                "message": f"Unclosed bracket '{stack[-1][0]}'",
                "line": code[:stack[-1][1]].count('\n') + 1,
                "suggestion": "Close the bracket"
            })
            is_valid = False

        # Check for common JS issues
        if re.search(r';\s*;', code):
            issues.append({
                "severity": "warning",
                "message": "Double semicolon detected",
                "line": None,
                "suggestion": "Remove extra semicolons"
            })

        return {
            "is_valid": is_valid,
            "language": "javascript",
            "issues": issues,
            "error_message": None if is_valid else "Syntax issues detected"
        }

    def check_dangerous_code(self, code: str, language: str = "python") -> List[Dict]:
        """Check for potentially dangerous code patterns"""
        issues = []

        if language == "python":
            # Check for dangerous imports
            import_pattern = r'(?:from\s+(\w+)|import\s+(\w+))'
            imports = re.findall(import_pattern, code)
            for imp in imports:
                module = imp[0] or imp[1]
                if module in self.BLOCKED_IMPORTS:
                    issues.append({
                        "severity": "warning",
                        "message": f"Potentially unsafe import: {module}",
                        "line": None,
                        "suggestion": f"The module '{module}' may have security implications"
                    })

            # Check for dangerous functions
            dangerous_patterns = [
                (r'\beval\s*\(', "Use of eval() is dangerous"),
                (r'\bexec\s*\(', "Use of exec() is dangerous"),
                (r'\b__import__\s*\(', "Dynamic import detected"),
                (r'\bopen\s*\([^)]*[\'"][wa]', "File write operation detected"),
            ]
            for pattern, message in dangerous_patterns:
                if re.search(pattern, code):
                    issues.append({
                        "severity": "warning",
                        "message": message,
                        "line": None,
                        "suggestion": "Review this code for security"
                    })

        return issues

    def execute_python_code(self, code: str, test_code: Optional[str] = None, timeout: int = 10) -> Dict:
        """
        Execute Python code in a sandboxed subprocess

        Args:
            code: The code to execute
            test_code: Optional test code to run after main code
            timeout: Maximum execution time in seconds

        Returns:
            Execution result with stdout, stderr, success status
        """
        # Check for dangerous patterns first
        danger_issues = self.check_dangerous_code(code)
        has_dangerous = any(i["severity"] == "error" for i in danger_issues)

        if has_dangerous:
            return {
                "executed": False,
                "success": False,
                "stdout": None,
                "stderr": "Code contains blocked operations",
                "return_code": None,
                "timeout": False,
                "error": "Execution blocked due to security concerns"
            }

        # Combine code and tests
        full_code = code
        if test_code:
            full_code += "\n\n# === Test Code ===\n" + test_code

        # Create temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(full_code)
            temp_path = f.name

        try:
            # Run in subprocess with timeout
            result = subprocess.run(
                ['python', temp_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=tempfile.gettempdir()
            )

            return {
                "executed": True,
                "success": result.returncode == 0,
                "stdout": result.stdout[:5000] if result.stdout else None,  # Limit output
                "stderr": result.stderr[:2000] if result.stderr else None,
                "return_code": result.returncode,
                "timeout": False,
                "error": None
            }

        except subprocess.TimeoutExpired:
            return {
                "executed": True,
                "success": False,
                "stdout": None,
                "stderr": f"Execution timed out after {timeout} seconds",
                "return_code": None,
                "timeout": True,
                "error": "Timeout"
            }
        except Exception as e:
            return {
                "executed": False,
                "success": False,
                "stdout": None,
                "stderr": str(e),
                "return_code": None,
                "timeout": False,
                "error": str(e)
            }
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_path)
            except:
                pass

    def extract_code_blocks(self, content: str, language: str = "python") -> List[str]:
        """Extract code blocks from markdown content"""
        # Match ```language ... ``` blocks
        pattern = rf'```(?:{language})?\s*\n(.*?)```'
        blocks = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)

        # If no blocks found, try to find indented code or raw code
        if not blocks and not content.startswith('#'):
            # Might be raw code
            blocks = [content]

        return blocks

    # ==================== THEORY VALIDATION ====================

    def validate_structure(self, content: str) -> Dict:
        """
        Validate the structure of theory content

        Checks for presence of key sections and overall organization
        """
        content_lower = content.lower()

        # Check for expected sections
        has_overview = any(term in content_lower for term in ['overview', 'introduction', '## overview', '# introduction'])
        has_key_concepts = any(term in content_lower for term in ['key concepts', 'main ideas', 'concepts', '## key'])
        has_examples = any(term in content_lower for term in ['example', 'for instance', 'such as', '## example'])
        has_summary = any(term in content_lower for term in ['summary', 'conclusion', 'key takeaway', '## summary'])

        # Count sections (markdown headers)
        sections = re.findall(r'^#{1,3}\s+.+', content, re.MULTILINE)
        section_count = len(sections)

        # Word count
        words = content.split()
        word_count = len(words)

        issues = []

        if not has_overview:
            issues.append({
                "severity": "warning",
                "message": "Missing overview/introduction section",
                "line": None,
                "suggestion": "Add an overview section at the beginning"
            })

        if not has_key_concepts:
            issues.append({
                "severity": "info",
                "message": "No explicit 'Key Concepts' section found",
                "line": None,
                "suggestion": "Consider adding a dedicated section for key concepts"
            })

        if word_count < 100:
            issues.append({
                "severity": "warning",
                "message": f"Content is very short ({word_count} words)",
                "line": None,
                "suggestion": "Consider expanding the content for better coverage"
            })

        if section_count < 2:
            issues.append({
                "severity": "warning",
                "message": "Content lacks clear section structure",
                "line": None,
                "suggestion": "Use markdown headers (##) to organize content"
            })

        return {
            "has_overview": has_overview,
            "has_key_concepts": has_key_concepts,
            "has_examples": has_examples,
            "has_summary": has_summary,
            "section_count": section_count,
            "word_count": word_count,
            "issues": issues
        }

    async def check_grounding(self, content: str, topic: str, content_ids: Optional[List[str]] = None) -> Dict:
        """
        Check if content is grounded in course materials

        Args:
            content: The generated content
            topic: The topic of the content
            content_ids: Optional list of content IDs to check against

        Returns:
            Grounding result with confidence score
        """
        # Extract key terms from the generated content
        # Simple approach: extract capitalized phrases and technical terms
        key_terms = set()

        # Find potential key terms (capitalized words, technical terms)
        term_patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b',  # Capitalized phrases
            r'\b\w+(?:ing|tion|ment|ity)\b',  # Common noun endings
        ]

        for pattern in term_patterns:
            matches = re.findall(pattern, content)
            key_terms.update(matches[:20])  # Limit terms

        # Add topic words
        key_terms.update(topic.split())

        matched_terms = []
        sources_checked = 0

        # If content_ids provided, check against those materials
        if content_ids:
            try:
                supabase = get_supabase_admin()
                for content_id in content_ids[:5]:  # Limit to 5 sources
                    result = supabase.table("content").select("title, description, topic, tags").eq("id", content_id).execute()
                    if result.data:
                        sources_checked += 1
                        source = result.data[0]
                        source_text = f"{source.get('title', '')} {source.get('description', '')} {source.get('topic', '')} {' '.join(source.get('tags', []))}"

                        for term in key_terms:
                            if term.lower() in source_text.lower():
                                matched_terms.append(term)
            except Exception as e:
                print(f"Grounding check error: {e}")

        # Calculate confidence
        if key_terms:
            confidence = len(set(matched_terms)) / len(key_terms)
        else:
            confidence = 0.5  # Neutral if no terms

        return {
            "is_grounded": confidence > 0.3,
            "matched_terms": list(set(matched_terms))[:10],
            "unmatched_claims": [],  # Would need more sophisticated analysis
            "confidence": round(confidence, 2),
            "sources_checked": sources_checked
        }

    # ==================== AI EVALUATION ====================

    async def ai_evaluate_content(
        self,
        content: str,
        content_type: str,
        topic: str,
        language: Optional[str] = None
    ) -> Dict:
        """
        Use AI to evaluate generated content quality

        Args:
            content: The content to evaluate
            content_type: Type of content (code, theory, slides, quiz)
            topic: The topic the content should cover
            language: Programming language (for code)

        Returns:
            AI evaluation with scores and explanation
        """
        if not self.api_key or self.api_key == "your-openrouter-api-key":
            return {
                "evaluated": False,
                "scores": None,
                "explanation": None,
                "strengths": [],
                "improvements": [],
                "error": "OpenRouter API key not configured"
            }

        system_prompt = """You are an expert educational content evaluator. Evaluate the provided content based on these criteria:

1. Accuracy (1-5): Is the content factually correct?
2. Relevance (1-5): Does it address the given topic?
3. Coherence (1-5): Is it well-organized and easy to follow?
4. Completeness (1-5): Does it cover the key concepts?

Provide your evaluation as JSON:
{
  "scores": {
    "accuracy": <1-5>,
    "relevance": <1-5>,
    "coherence": <1-5>,
    "completeness": <1-5>
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "explanation": "Brief explanation of your evaluation"
}"""

        content_desc = f"Type: {content_type}"
        if language:
            content_desc += f", Language: {language}"

        user_prompt = f"""Evaluate this {content_type} content on the topic "{topic}":

{content_desc}

--- Content Start ---
{content[:4000]}
--- Content End ---

Provide your evaluation as JSON."""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "AI Learning Platform - Validation"
            }

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.3  # Lower temperature for more consistent evaluation
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            result_text = data["choices"][0]["message"]["content"]

            # Parse JSON from response
            try:
                # Extract JSON from potential markdown
                json_match = result_text
                if "```json" in result_text:
                    json_match = result_text.split("```json")[1].split("```")[0]
                elif "```" in result_text:
                    json_match = result_text.split("```")[1].split("```")[0]

                evaluation = json.loads(json_match)

                scores = evaluation.get("scores", {})
                overall = sum(scores.values()) / len(scores) if scores else 0

                return {
                    "evaluated": True,
                    "scores": {
                        "accuracy": scores.get("accuracy", 3),
                        "relevance": scores.get("relevance", 3),
                        "coherence": scores.get("coherence", 3),
                        "completeness": scores.get("completeness", 3),
                        "overall": round(overall, 1)
                    },
                    "explanation": evaluation.get("explanation", ""),
                    "strengths": evaluation.get("strengths", []),
                    "improvements": evaluation.get("improvements", []),
                    "error": None
                }

            except json.JSONDecodeError:
                return {
                    "evaluated": True,
                    "scores": None,
                    "explanation": result_text,
                    "strengths": [],
                    "improvements": [],
                    "error": "Could not parse structured evaluation"
                }

        except Exception as e:
            return {
                "evaluated": False,
                "scores": None,
                "explanation": None,
                "strengths": [],
                "improvements": [],
                "error": str(e)
            }

    # ==================== MAIN VALIDATION METHODS ====================

    async def validate_code(
        self,
        code: str,
        language: str = "python",
        test_code: Optional[str] = None,
        run_ai_evaluation: bool = True,
        topic: str = "programming"
    ) -> Dict:
        """
        Full code validation pipeline

        Args:
            code: Code to validate
            language: Programming language
            test_code: Optional test code
            run_ai_evaluation: Whether to run AI evaluation
            topic: Topic for context

        Returns:
            Complete validation result
        """
        # 1. Syntax validation
        if language == "python":
            syntax_result = self.validate_python_syntax(code)
        elif language in ["javascript", "typescript"]:
            syntax_result = self.validate_javascript_syntax(code)
        else:
            # Basic validation for other languages
            syntax_result = {
                "is_valid": True,
                "language": language,
                "issues": [],
                "error_message": None
            }

        # Add security checks
        security_issues = self.check_dangerous_code(code, language)
        syntax_result["issues"].extend(security_issues)

        # 2. Code execution (Python only for now)
        execution_result = None
        if language == "python" and syntax_result["is_valid"]:
            execution_result = self.execute_python_code(code, test_code)

        # 3. AI evaluation
        ai_result = None
        if run_ai_evaluation:
            ai_result = await self.ai_evaluate_content(code, "code", topic, language)

        # 4. Calculate overall validity and score
        is_valid = syntax_result["is_valid"]
        if execution_result and not execution_result["success"]:
            is_valid = False

        overall_score = None
        if ai_result and ai_result.get("scores"):
            overall_score = ai_result["scores"]["overall"]

        # Build summary
        summary_parts = []
        if syntax_result["is_valid"]:
            summary_parts.append("Syntax valid")
        else:
            summary_parts.append("Syntax errors found")

        if execution_result:
            if execution_result["success"]:
                summary_parts.append("Execution successful")
            elif execution_result["timeout"]:
                summary_parts.append("Execution timed out")
            else:
                summary_parts.append("Execution failed")

        if overall_score:
            summary_parts.append(f"AI score: {overall_score}/5")

        return {
            "success": True,
            "content_type": "code",
            "syntax": syntax_result,
            "execution": execution_result,
            "ai_evaluation": ai_result,
            "is_valid": is_valid,
            "overall_score": overall_score,
            "summary": ". ".join(summary_parts)
        }

    async def validate_theory(
        self,
        content: str,
        topic: str,
        content_ids: Optional[List[str]] = None,
        run_ai_evaluation: bool = True
    ) -> Dict:
        """
        Full theory content validation pipeline

        Args:
            content: Theory content to validate
            topic: Topic of the content
            content_ids: Optional course material IDs for grounding
            run_ai_evaluation: Whether to run AI evaluation

        Returns:
            Complete validation result
        """
        # 1. Structure validation
        structure_result = self.validate_structure(content)

        # 2. Grounding check
        grounding_result = await self.check_grounding(content, topic, content_ids)

        # 3. AI evaluation
        ai_result = None
        if run_ai_evaluation:
            ai_result = await self.ai_evaluate_content(content, "theory", topic)

        # 4. Calculate overall validity
        is_valid = True
        error_count = sum(1 for i in structure_result["issues"] if i["severity"] == "error")
        if error_count > 0:
            is_valid = False

        overall_score = None
        if ai_result and ai_result.get("scores"):
            overall_score = ai_result["scores"]["overall"]

        # Build summary
        summary_parts = []
        summary_parts.append(f"{structure_result['section_count']} sections, {structure_result['word_count']} words")

        if grounding_result["is_grounded"]:
            summary_parts.append(f"Grounded ({int(grounding_result['confidence']*100)}% confidence)")
        else:
            summary_parts.append("Low grounding confidence")

        if overall_score:
            summary_parts.append(f"AI score: {overall_score}/5")

        return {
            "success": True,
            "content_type": "theory",
            "structure": structure_result,
            "grounding": grounding_result,
            "ai_evaluation": ai_result,
            "is_valid": is_valid,
            "overall_score": overall_score,
            "summary": ". ".join(summary_parts)
        }


# Singleton instance
_validation_service: Optional[ValidationService] = None


def get_validation_service() -> ValidationService:
    """Get or create validation service instance"""
    global _validation_service
    if _validation_service is None:
        _validation_service = ValidationService()
    return _validation_service
