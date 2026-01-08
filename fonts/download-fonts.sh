#!/bin/bash

# Script to download required fonts from Google Fonts
# Run this from the project root: bash fonts/download-fonts.sh

FONT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Downloading fonts to: $FONT_DIR"
echo ""

# Use raw.githubusercontent.com for direct binary downloads
# Download Roboto fonts
echo "Downloading Roboto-Regular.ttf..."
curl -L "https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/Roboto-Regular.ttf" \
  --fail --silent --show-error

if [ ! -f "$FONT_DIR/Roboto-Regular.ttf" ] || [ ! -s "$FONT_DIR/Roboto-Regular.ttf" ]; then
  echo "❌ Failed to download Roboto-Regular.ttf"
  exit 1
fi

echo "Downloading Roboto-Bold.ttf..."
curl -L "https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Bold.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/Roboto-Bold.ttf" \
  --fail --silent --show-error

if [ ! -f "$FONT_DIR/Roboto-Bold.ttf" ] || [ ! -s "$FONT_DIR/Roboto-Bold.ttf" ]; then
  echo "❌ Failed to download Roboto-Bold.ttf"
  exit 1
fi

# Download Noto Sans Devanagari fonts
echo "Downloading NotoSansDevanagari-Regular.ttf..."
curl -L "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari-Regular.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/NotoSansDevanagari-Regular.ttf" \
  --fail --silent --show-error

if [ ! -f "$FONT_DIR/NotoSansDevanagari-Regular.ttf" ] || [ ! -s "$FONT_DIR/NotoSansDevanagari-Regular.ttf" ]; then
  echo "❌ Failed to download NotoSansDevanagari-Regular.ttf"
  exit 1
fi

echo "Downloading NotoSansDevanagari-Bold.ttf..."
curl -L "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/NotoSansDevanagari-Bold.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/NotoSansDevanagari-Bold.ttf" \
  --fail --silent --show-error

if [ ! -f "$FONT_DIR/NotoSansDevanagari-Bold.ttf" ] || [ ! -s "$FONT_DIR/NotoSansDevanagari-Bold.ttf" ]; then
  echo "❌ Failed to download NotoSansDevanagari-Bold.ttf"
  exit 1
fi

echo ""
echo "✅ Font download complete!"
echo ""
echo "Verifying files..."
for font in "$FONT_DIR"/*.ttf; do
  if [ -f "$font" ]; then
    size=$(stat -f%z "$font" 2>/dev/null || stat -c%s "$font" 2>/dev/null)
    echo "  $(basename "$font"): $size bytes"
    
    # Check if file starts with TTF magic bytes (0x00010000 or 'OTTO' for OTF)
    first_bytes=$(head -c 4 "$font" | od -An -tx1 | tr -d ' \n')
    if [[ "$first_bytes" == "00010000" ]] || [[ "$first_bytes" == *"4f54544f"* ]]; then
      echo "    ✓ Valid font file"
    else
      echo "    ⚠️  Warning: May not be a valid font file (starts with: $first_bytes)"
    fi
  fi
done

