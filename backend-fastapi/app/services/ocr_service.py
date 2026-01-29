"""
OCR Service for Handwritten Notes Digitization
Supports multiple OCR backends:
1. Tesseract OCR (local, requires installation)
2. AI-based OCR (using Claude/OpenRouter - no installation needed)
"""

import io
import base64
import httpx
from typing import Optional, List, Dict, Any
from PIL import Image, ImageEnhance, ImageFilter
from app.core.config import settings


class OCRService:
    """
    Service for extracting text from handwritten notes.
    Falls back to AI-based OCR if Tesseract is not available.
    """

    def __init__(self):
        """Initialize OCR service."""
        self.tesseract_available = self._check_tesseract()
        self.openrouter_key = getattr(settings, 'openrouter_api_key', None)

    def _check_tesseract(self) -> bool:
        """Check if Tesseract is installed."""
        try:
            import pytesseract
            import platform
            if platform.system() == 'Windows':
                # Try common installation paths
                import os
                possible_paths = [
                    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                    r'C:\Tesseract-OCR\tesseract.exe',
                ]
                for path in possible_paths:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        break
            # Try a simple test
            pytesseract.get_tesseract_version()
            print("Tesseract OCR is available")
            return True
        except ImportError:
            print("pytesseract not installed - will use AI OCR")
            return False
        except Exception as e:
            print(f"Tesseract not available: {e} - will use AI OCR")
            return False

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR results.
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Resize if too large
        max_dimension = 2000
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        return image

    def enhance_image(self, image: Image.Image) -> Image.Image:
        """
        Enhance image for better handwriting recognition.
        """
        # Convert to grayscale
        image = image.convert('L')

        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)

        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)

        # Apply slight blur to reduce noise
        image = image.filter(ImageFilter.MedianFilter(size=3))

        # Binarize
        threshold = 150
        image = image.point(lambda p: 255 if p > threshold else 0)

        # Convert back to RGB
        image = image.convert('RGB')

        return image

    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string."""
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    async def _extract_with_tesseract(
        self,
        image: Image.Image
    ) -> Dict[str, Any]:
        """Extract text using Tesseract OCR."""
        import pytesseract

        # Get detailed data including confidence
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

        texts = []
        confidences = []

        for i, conf in enumerate(data['conf']):
            if int(conf) > 0:
                text = data['text'][i].strip()
                if text:
                    texts.append(text)
                    confidences.append(int(conf))

        full_text = ' '.join(texts)
        avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0

        # Also get simple text extraction (preserves more structure)
        simple_text = pytesseract.image_to_string(image)

        if len(simple_text.strip()) > len(full_text):
            full_text = simple_text.strip()

        # If OpenRouter is available, structure the text with AI
        if self.openrouter_key and len(full_text) > 50:
            try:
                structured_text = await self._structure_text_with_ai(full_text)
                if structured_text:
                    full_text = structured_text
            except Exception as e:
                print(f"AI structuring failed, using raw text: {e}")

        return {
            'text': full_text,
            'confidence': avg_confidence,
            'engine': 'tesseract+ai' if self.openrouter_key else 'tesseract',
            'word_count': len(full_text.split())
        }

    async def _structure_text_with_ai(self, raw_text: str) -> Optional[str]:
        """Use AI to structure raw OCR text into academic format."""
        if not self.openrouter_key or len(raw_text) < 50:
            return None

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "anthropic/claude-3.5-haiku",  # Fast model for text processing
                        "messages": [
                            {
                                "role": "user",
                                "content": f"""Transform this raw OCR-extracted text into professionally structured academic notes using markdown.

## FORMATTING REQUIREMENTS:

### Headings & Structure:
- # for main title
- ## for major sections
- ### for subsections
- Use --- to separate major topics

### Definitions (REQUIRED FORMAT):
**Term Name**
: Definition explanation here

### Key Terms:
- Bold all **important concepts** and **technical terms**

### Lists:
- Use bullet points (-) for unordered items
- Use numbers (1. 2. 3.) for sequential steps or ordered items

### Math & Formulas:
- Inline: $formula$
- Block: $$formula$$

### Code:
```language
code here
```

### Examples & Notes:
> **Example:** Description here

### Tables (if data is tabular):
| Header 1 | Header 2 |
|----------|----------|
| Data     | Data     |

## INSTRUCTIONS:
1. Identify the main topic/title and create a heading
2. Organize content into logical sections
3. Format all definitions properly with the **: format
4. Fix OCR errors but preserve technical accuracy
5. Add proper spacing between sections
6. Output ONLY the formatted markdown, no explanations

## RAW OCR TEXT:
{raw_text}

## STRUCTURED MARKDOWN OUTPUT:"""
                            }
                        ],
                        "max_tokens": 4000,
                        "temperature": 0.1
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    structured = result['choices'][0]['message']['content']
                    return self._clean_ocr_output(structured)
        except Exception as e:
            print(f"Text structuring error: {e}")

        return None

    async def _extract_with_ai(
        self,
        image: Image.Image
    ) -> Dict[str, Any]:
        """Extract text using AI (Claude via OpenRouter)."""
        if not self.openrouter_key:
            raise Exception(
                "AI OCR requires OPENROUTER_API_KEY in .env file. "
                "Alternatively, install Tesseract OCR."
            )

        # Convert image to base64
        base64_image = self._image_to_base64(image)
        print(f"Image converted to base64, length: {len(base64_image)}")

        # Call OpenRouter API with vision model
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                print("Calling OpenRouter API for OCR...")
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AI Learning Platform OCR"
                    },
                    json={
                        "model": "anthropic/claude-sonnet-4",
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/png;base64,{base64_image}"
                                        }
                                    },
                                    {
                                        "type": "text",
                                        "text": """You are an expert academic document processor. Extract ALL text from this handwritten/typed notes image and structure it into professional academic markdown format.

## MANDATORY OUTPUT STRUCTURE:

### 1. TITLE/HEADER (if visible)
```
# [Main Title or Topic]
```

### 2. SECTIONS & SUBSECTIONS
Use proper heading hierarchy:
```
## Section Name
### Subsection Name
#### Sub-subsection (if needed)
```

### 3. DEFINITIONS (format ALL definitions like this):
```
**Term Name**
: Definition text here. Include all relevant details.
```

### 4. KEY CONCEPTS (highlight important terms):
```
The **important concept** is explained as follows...
```

### 5. MATHEMATICAL FORMULAS:
- Inline math: $E = mc^2$
- Block equations:
$$
\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$

### 6. LISTS & BULLET POINTS:
```
- First item
- Second item
  - Nested item

1. Numbered step one
2. Numbered step two
```

### 7. CODE BLOCKS (if any programming content):
```python
def example():
    return "code here"
```

### 8. TABLES (if tabular data exists):
```
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

### 9. EXAMPLES & NOTES:
```
> **Example:** This is an example or important note
> Additional context here
```

### 10. DIAGRAMS/FIGURES:
```
![Diagram Description](diagram)
*Figure 1: Caption describing the diagram*
```

## CONTENT RULES:
1. Extract EVERY piece of text visible in the image
2. Preserve the logical hierarchy and relationships
3. Fix obvious OCR/spelling errors but keep technical terms exact
4. Mark unclear text as [unclear] or [?]
5. Describe any diagrams, graphs, or figures in detail
6. Use horizontal rules (---) to separate major sections
7. Add blank lines between sections for readability

## OUTPUT FORMAT:
Start directly with the structured markdown content. Do NOT include any preamble like "Here is the extracted text" - just output the formatted notes.

BEGIN EXTRACTION:"""
                                    }
                                ]
                            }
                        ],
                        "max_tokens": 8000,
                        "temperature": 0.1  # Low temperature for accurate extraction
                    }
                )

                print(f"OpenRouter response status: {response.status_code}")

                if response.status_code != 200:
                    error_text = response.text
                    print(f"OpenRouter error: {error_text}")
                    raise Exception(f"AI OCR failed (status {response.status_code}): {error_text[:200]}")

                result = response.json()
                extracted_text = result['choices'][0]['message']['content']

                # Clean up the output - remove any preamble if the model added it
                extracted_text = self._clean_ocr_output(extracted_text)

                print(f"OCR extracted {len(extracted_text)} characters")

                return {
                    'text': extracted_text,
                    'confidence': 0.90,  # AI generally has good accuracy
                    'engine': 'ai-vision-claude',
                    'word_count': len(extracted_text.split()),
                    'structured': True
                }
        except httpx.TimeoutException:
            raise Exception("AI OCR timed out. Try with a smaller image.")
        except httpx.RequestError as e:
            raise Exception(f"Network error during AI OCR: {str(e)}")

    def _clean_ocr_output(self, text: str) -> str:
        """Clean up OCR output by removing common preambles."""
        # Common preambles to remove
        preambles = [
            "Here is the extracted text:",
            "Here's the extracted text:",
            "Here is the structured content:",
            "Here's the structured content:",
            "Here are the notes:",
            "Here's the markdown:",
            "Extracted content:",
            "BEGIN EXTRACTION:",
        ]

        cleaned = text.strip()
        for preamble in preambles:
            if cleaned.lower().startswith(preamble.lower()):
                cleaned = cleaned[len(preamble):].strip()

        # Remove leading/trailing code block markers if the whole thing is wrapped
        if cleaned.startswith("```markdown") and cleaned.endswith("```"):
            cleaned = cleaned[11:-3].strip()
        elif cleaned.startswith("```") and cleaned.endswith("```"):
            # Find the first newline after ```
            first_newline = cleaned.find('\n')
            if first_newline != -1:
                cleaned = cleaned[first_newline+1:-3].strip()

        return cleaned

    async def extract_text_from_image(
        self,
        image_data: bytes,
        enhance: bool = True
    ) -> Dict[str, Any]:
        """
        Extract text from an image.

        Args:
            image_data: Raw image bytes
            enhance: Whether to apply image enhancement

        Returns:
            Dict with text, confidence, engine, word_count
        """
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_data))
        image = self.preprocess_image(image)

        if enhance:
            enhanced_image = self.enhance_image(image)
        else:
            enhanced_image = image

        # Try Tesseract first if available
        if self.tesseract_available:
            try:
                return await self._extract_with_tesseract(enhanced_image)
            except Exception as e:
                print(f"Tesseract OCR failed: {e}, falling back to AI OCR")

        # Fall back to AI-based OCR
        try:
            # Use original image (not enhanced) for AI - it handles preprocessing itself
            return await self._extract_with_ai(image)
        except Exception as e:
            raise Exception(
                f"OCR failed. Error: {str(e)}\n\n"
                "To fix this, either:\n"
                "1. Install Tesseract OCR:\n"
                "   - Windows: https://github.com/UB-Mannheim/tesseract/wiki\n"
                "   - Mac: brew install tesseract\n"
                "   - Linux: sudo apt install tesseract-ocr\n\n"
                "2. Or set OPENROUTER_API_KEY in .env for AI-based OCR"
            )

    async def extract_text_from_file(
        self,
        file_path: str,
        enhance: bool = True
    ) -> Dict[str, Any]:
        """Extract text from an image file."""
        with open(file_path, 'rb') as f:
            image_data = f.read()
        return await self.extract_text_from_image(image_data, enhance)

    async def batch_extract(
        self,
        images: List[bytes],
        enhance: bool = True
    ) -> List[Dict[str, Any]]:
        """Extract text from multiple images."""
        results = []
        for image_data in images:
            try:
                result = await self.extract_text_from_image(image_data, enhance)
                results.append(result)
            except Exception as e:
                results.append({
                    'text': '',
                    'confidence': 0,
                    'engine': 'none',
                    'error': str(e)
                })
        return results


# Singleton instance
_ocr_service: Optional[OCRService] = None


def get_ocr_service(engine: str = "auto") -> OCRService:
    """Get or create OCR service instance."""
    global _ocr_service
    if _ocr_service is None:
        print("Initializing OCR service...")
        _ocr_service = OCRService()
        print(f"OCR service initialized. Tesseract available: {_ocr_service.tesseract_available}, OpenRouter key: {'set' if _ocr_service.openrouter_key else 'NOT SET'}")
    return _ocr_service


def reset_ocr_service():
    """Reset the OCR service singleton (useful for testing)."""
    global _ocr_service
    _ocr_service = None
