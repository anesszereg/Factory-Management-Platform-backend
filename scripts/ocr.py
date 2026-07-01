#!/usr/bin/env python3
"""OCR script using EasyOCR.

Usage:
    python ocr.py <image_path>

Prints the extracted text as JSON to stdout.
"""

import json
import sys
import os

try:
    import easyocr
except ImportError:
    print(json.dumps({"error": "EasyOCR not installed. Run: pip install easyocr"}))
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found: {image_path}"}))
        sys.exit(1)

    try:
        reader = easyocr.Reader(['en'], gpu=False)
        result = reader.readtext(image_path)

        lines = [str(item[1]) for item in result]

        print(json.dumps({"text": "\n".join(lines)}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
