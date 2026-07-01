#!/usr/bin/env python3
"""OCR script using PaddleOCR.

Usage:
    python ocr.py <image_path>

Prints the extracted text as JSON to stdout.
"""

import json
import sys
import os

try:
    from paddleocr import PaddleOCR
except ImportError:
    print(json.dumps({"error": "PaddleOCR not installed. Run: pip install paddleocr"}))
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
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        result = ocr.ocr(image_path, cls=True)

        lines = []
        if result and result[0]:
            for line in result[0]:
                if line[1]:
                    lines.append(str(line[1][0]))

        print(json.dumps({"text": "\n".join(lines)}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
