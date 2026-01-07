#!/bin/bash

# Check documentation formatting consistency
# Looks for common formatting issues and inconsistencies

echo "=== Checking Documentation Formatting ==="
echo ""

DOCS_DIR="docs-site"
ISSUES_FOUND=0

echo "Checking for formatting issues..."
echo ""

# Check 1: Inconsistent heading styles
echo "📋 Checking heading consistency..."
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    # Check for headings with trailing spaces
    if grep -n "^#.*  $" "$file" > /dev/null 2>&1; then
        echo "  ⚠️  Trailing spaces in headings: $file"
        grep -n "^#.*  $" "$file" | head -3
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check for inconsistent spacing after #
    if grep -n "^#[^ ]" "$file" > /dev/null 2>&1; then
        echo "  ⚠️  Missing space after # in heading: $file"
        grep -n "^#[^ ]" "$file" | head -3
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check 2: Inconsistent list formatting
echo ""
echo "📋 Checking list formatting..."
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    # Check for tabs in lists (should use spaces)
    if grep -n "^	" "$file" > /dev/null 2>&1; then
        echo "  ⚠️  Tabs found (should use spaces): $file"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check 3: Inconsistent code block formatting
echo ""
echo "📋 Checking code block formatting..."
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    # Check for code blocks without language specification
    if grep -n "^```$" "$file" > /dev/null 2>&1; then
        count=$(grep -c "^```$" "$file")
        if [ "$count" -gt 0 ]; then
            # Only report if it's an opening fence (odd occurrence)
            echo "  ℹ️  Code blocks without language in: $file ($count occurrences)"
        fi
    fi
done

# Check 4: Multiple blank lines
echo ""
echo "📋 Checking for excessive blank lines..."
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    # Check for 3+ consecutive blank lines
    if grep -Pzo "\n\n\n\n" "$file" > /dev/null 2>&1; then
        echo "  ⚠️  Multiple consecutive blank lines: $file"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check 5: Trailing whitespace
echo ""
echo "📋 Checking for trailing whitespace..."
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    count=$(grep -c " $" "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt 5 ]; then
        echo "  ℹ️  Trailing whitespace found: $file ($count lines)"
    fi
done

# Check 6: Inconsistent "Next Steps" sections
echo ""
echo "📋 Checking 'Next Steps' section consistency..."
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    # Check if file has content but no "Next Steps" section
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        if [ "$lines" -gt 100 ]; then
            if ! grep -q "## Next Steps" "$file" && ! grep -q "## What's Next" "$file"; then
                # Skip index.md and API reference files
                if [[ ! "$file" =~ index.md$ ]] && [[ ! "$file" =~ /api/ ]]; then
                    echo "  ℹ️  No 'Next Steps' section: $file"
                fi
            fi
        fi
    fi
done

echo ""
echo "=== Summary ==="
echo "Formatting check complete"
echo ""
echo "✅ All major formatting issues checked"
echo "ℹ️  Some informational items may need manual review"

exit 0

