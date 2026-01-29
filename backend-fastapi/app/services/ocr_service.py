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

        # Also get simple text extraction
        simple_text = pytesseract.image_to_string(image)

        if len(simple_text.strip()) > len(full_text):
            full_text = simple_text.strip()

        return {
            'text': full_text,
            'confidence': avg_confidence,
            'engine': 'tesseract',
            'word_count': len(texts)
        }

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
                        "model": "anthropic/claude-3.5-sonnet",
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
                                        "text": """Extract ALL text from this handwritten notes image.

Instructions:
- Transcribe every word you can read, even if partially legible
- Preserve the structure (paragraphs, bullet points, numbered lists)
- Use markdown formatting where appropriate
- If you see diagrams or drawings, describe them briefly in [brackets]
- If a word is unclear, make your best guess
- Do NOT add any commentary - only output the transcribed text

Transcribed text:"""
                                    }
                                ]
                            }
                        ],
                        "max_tokens": 4000
                    }
                )

                print(f"OpenRouter response status: {response.status_code}")

                if response.status_code != 200:
                    error_text = response.text
                    print(f"OpenRouter error: {error_text}")
                    raise Exception(f"AI OCR failed (status {response.status_code}): {error_text[:200]}")

                result = response.json()
                extracted_text = result['choices'][0]['message']['content']
                print(f"OCR extracted {len(extracted_text)} characters")

                return {
                    'text': extracted_text,
                    'confidence': 0.85,  # AI generally has good accuracy
                    'engine': 'ai-vision',
                    'word_count': len(extracted_text.split())
                }
        except httpx.TimeoutException:
            raise Exception("AI OCR timed out. Try with a smaller image.")
        except httpx.RequestError as e:
            raise Exception(f"Network error during AI OCR: {str(e)}")

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
