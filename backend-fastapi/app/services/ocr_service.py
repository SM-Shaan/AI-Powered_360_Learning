"""
OCR Service for Handwritten Notes Digitization
Uses Tesseract OCR (via pytesseract) for text extraction from images
"""

import io
from typing import Optional, List, Dict, Any
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract


class OCRService:
    """
    Service for extracting text from handwritten notes using Tesseract OCR.
    """

    def __init__(self):
        """Initialize OCR service."""
        # On Windows, you may need to set the tesseract path
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR results.

        Args:
            image: PIL Image object

        Returns:
            Preprocessed PIL Image
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Resize if too large (helps with processing speed)
        max_dimension = 2000
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        return image

    def enhance_image(self, image: Image.Image) -> Image.Image:
        """
        Enhance image for better handwriting recognition.

        Args:
            image: PIL Image object

        Returns:
            Enhanced PIL Image
        """
        # Convert to grayscale for better OCR
        image = image.convert('L')

        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)

        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)

        # Apply slight blur to reduce noise then sharpen
        image = image.filter(ImageFilter.MedianFilter(size=3))

        # Binarize (convert to black and white) for better OCR
        threshold = 150
        image = image.point(lambda p: 255 if p > threshold else 0)

        # Convert back to RGB for consistency
        image = image.convert('RGB')

        return image

    async def extract_text_from_image(
        self,
        image_data: bytes,
        enhance: bool = True
    ) -> Dict[str, Any]:
        """
        Extract text from an image using Tesseract OCR.

        Args:
            image_data: Raw image bytes
            enhance: Whether to apply image enhancement

        Returns:
            Dict containing:
                - text: Extracted text as string
                - confidence: Average confidence score
                - engine: OCR engine used
        """
        # Load image
        image = Image.open(io.BytesIO(image_data))

        # Preprocess
        image = self.preprocess_image(image)

        # Optionally enhance
        if enhance:
            image = self.enhance_image(image)

        # Extract text using Tesseract
        try:
            # Get detailed data including confidence
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

            # Extract text and calculate average confidence
            texts = []
            confidences = []

            for i, conf in enumerate(data['conf']):
                if int(conf) > 0:  # Only include words with positive confidence
                    text = data['text'][i].strip()
                    if text:
                        texts.append(text)
                        confidences.append(int(conf))

            full_text = ' '.join(texts)
            avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0

            # Also get the simple text extraction for comparison
            simple_text = pytesseract.image_to_string(image)

            # Use the longer/better result
            if len(simple_text.strip()) > len(full_text):
                full_text = simple_text.strip()

            return {
                'text': full_text,
                'confidence': avg_confidence,
                'engine': 'tesseract',
                'word_count': len(texts)
            }

        except pytesseract.TesseractNotFoundError:
            raise Exception(
                "Tesseract OCR is not installed. Please install it:\n"
                "Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki\n"
                "Mac: brew install tesseract\n"
                "Linux: sudo apt install tesseract-ocr"
            )
        except Exception as e:
            raise Exception(f"OCR processing failed: {str(e)}")

    async def extract_text_from_file(
        self,
        file_path: str,
        enhance: bool = True
    ) -> Dict[str, Any]:
        """
        Extract text from an image file.

        Args:
            file_path: Path to the image file
            enhance: Whether to apply image enhancement

        Returns:
            OCR results dict
        """
        with open(file_path, 'rb') as f:
            image_data = f.read()
        return await self.extract_text_from_image(image_data, enhance)

    async def batch_extract(
        self,
        images: List[bytes],
        enhance: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Extract text from multiple images.

        Args:
            images: List of image bytes
            enhance: Whether to apply image enhancement

        Returns:
            List of OCR results
        """
        results = []
        for image_data in images:
            try:
                result = await self.extract_text_from_image(image_data, enhance)
                results.append(result)
            except Exception as e:
                results.append({
                    'text': '',
                    'confidence': 0,
                    'engine': 'tesseract',
                    'error': str(e)
                })
        return results


# Singleton instance
_ocr_service: Optional[OCRService] = None


def get_ocr_service(engine: str = "tesseract") -> OCRService:
    """Get or create OCR service instance"""
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = OCRService()
    return _ocr_service
