#!/bin/bash

# Check for broken links in documentation files
# This script finds all markdown links and checks if the referenced files exist
# Supports VitePress-style links (without .md extension)

echo "=== Checking Documentation Links ==="
echo ""

DOCS_DIR="docs-site"
BROKEN_LINKS=0
TOTAL_LINKS=0
BROKEN_LIST=()

# Find all markdown files
find "$DOCS_DIR" -name "*.md" -type f | sort | while read -r file; do
    # Extract markdown links [text](path)
    while IFS= read -r line; do
        # Extract all links from the line
        echo "$line" | grep -oE '\]\([^)]+\)' | sed 's/][(]//' | sed 's/)//' | while read -r path; do
            # Skip empty paths
            [ -z "$path" ] && continue

            # Skip external links (http://, https://, mailto:, etc.)
            if [[ "$path" =~ ^https?:// ]] || [[ "$path" =~ ^mailto: ]]; then
                continue
            fi

            # Skip anchor-only links
            if [[ "$path" =~ ^# ]]; then
                continue
            fi

            TOTAL_LINKS=$((TOTAL_LINKS + 1))

            # Remove anchor links (#section) for file checking
            clean_path=$(echo "$path" | sed 's/#.*//')

            # Skip if only anchor
            [ -z "$clean_path" ] && continue

            # Resolve relative paths
            dir=$(dirname "$file")

            # Handle absolute paths from docs-site root (VitePress style)
            if [[ "$clean_path" =~ ^\/ ]]; then
                # VitePress links start with / and don't include .md
                full_path="$DOCS_DIR${clean_path}.md"
            else
                # Relative path
                full_path="$dir/${clean_path}.md"
            fi

            # Check if file exists (try with .md extension first, then without)
            if [ ! -f "$full_path" ]; then
                # Try without .md extension
                full_path_no_ext="${full_path%.md}"
                if [ ! -f "$full_path_no_ext" ] && [ ! -d "$full_path_no_ext" ]; then
                    echo "  ❌ BROKEN: $path"
                    echo "     In file: $file"
                    echo "     Expected: $full_path"
                    BROKEN_LINKS=$((BROKEN_LINKS + 1))
                    BROKEN_LIST+=("$path in $file")
                fi
            fi
        done
    done < "$file"
done

echo ""
echo "=== Summary ==="
echo "Total internal links checked: $TOTAL_LINKS"
echo "Broken links found: $BROKEN_LINKS"

if [ $BROKEN_LINKS -eq 0 ]; then
    echo "✅ All links are valid!"
    exit 0
else
    echo "❌ Found $BROKEN_LINKS broken link(s)"
    exit 1
fi

