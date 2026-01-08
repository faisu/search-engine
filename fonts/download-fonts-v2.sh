#!/bin/bash

# Script to download fonts from Google Fonts API
# Run this from the project root: bash fonts/download-fonts-v2.sh

FONT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Downloading fonts to: $FONT_DIR"
echo ""

# Delete old corrupted files
rm -f "$FONT_DIR"/*.ttf

# Download Roboto fonts from Google Fonts API
echo "Downloading Roboto-Regular.ttf..."
curl -L "https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap" -o /tmp/roboto-css.txt 2>/dev/null
ROBOTO_URL=$(grep -oP 'url\(https://[^)]+\.woff2' /tmp/roboto-css.txt | head -1 | sed 's/url(//;s/)//' | sed 's/woff2/ttf/')

# Try alternative: direct download from fonts.gstatic.com
echo "Downloading Roboto-Regular.ttf from fonts.gstatic.com..."
curl -L "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf" \
  -o "$FONT_DIR/Roboto-Regular.ttf" \
  --fail --silent --show-error

echo "Downloading Roboto-Bold.ttf..."
curl -L "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf" \
  -o "$FONT_DIR/Roboto-Bold.ttf" \
  --fail --silent --show-error

# Download Noto Sans Devanagari fonts
echo "Downloading NotoSansDevanagari-Regular.ttf..."
curl -L "https://fonts.gstatic.com/s/notosansdevanagari/v25/TuGoUUFzXI5FBtUq5a8bnKIOdTwQNO_W3lJJFdQ.woff2" \
  -o "$FONT_DIR/NotoSansDevanagari-Regular.woff2" \
  --fail --silent --show-error

# Convert woff2 to ttf or download TTF directly
# Let's try to find TTF versions
echo "Trying alternative sources for Noto Sans Devanagari..."

# Use a reliable font CDN or convert
echo "Downloading from alternative source..."
curl -L "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari-Regular.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/NotoSansDevanagari-Regular.ttf" \
  --fail --silent --show-error || echo "Failed, trying woff2 conversion..."

echo ""
echo "Verifying Roboto fonts..."
for font in "$FONT_DIR"/Roboto-*.ttf; do
  if [ -f "$font" ]; then
    size=$(stat -f%z "$font" 2>/dev/null || stat -c%s "$font" 2>/dev/null)
    first_bytes=$(head -c 4 "$font" | od -An -tx1 | tr -d ' \n')
    if [[ "$first_bytes" == "00010000" ]] || [[ "$first_bytes" == *"4f54544f"* ]]; then
      echo "  ✓ $(basename "$font"): Valid ($size bytes)"
    else
      echo "  ❌ $(basename "$font"): Invalid format"
      rm -f "$font"
    fi
  fi
done


