#!/usr/bin/env python3
"""Pre-download EasyOCR models during build."""

import easyocr

print('Downloading EasyOCR models...')
reader = easyocr.Reader(['en'], gpu=False)
print('EasyOCR models ready')
