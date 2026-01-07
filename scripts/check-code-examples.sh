#!/bin/bash

# Check code examples in documentation for common issues
# This script analyzes TypeScript code blocks for syntax and import issues

echo "=== Checking Documentation Code Examples ==="
echo ""

DOCS_DIR="docs-site"
ISSUES_FOUND=0
TOTAL_EXAMPLES=0

# Find all markdown files
find "$DOCS_DIR" -name "*.md" -type f | sort | while read -r file; do
    # Extract TypeScript code blocks
    in_code_block=false
    code_block=""
    line_num=0
    block_start=0
    
    while IFS= read -r line; do
        line_num=$((line_num + 1))
        
        # Check for code block start
        if [[ "$line" =~ ^\`\`\`typescript ]] || [[ "$line" =~ ^\`\`\`ts ]]; then
            in_code_block=true
            block_start=$line_num
            code_block=""
            continue
        fi
        
        # Check for code block end
        if [[ "$line" =~ ^\`\`\`$ ]] && [ "$in_code_block" = true ]; then
            in_code_block=false
            TOTAL_EXAMPLES=$((TOTAL_EXAMPLES + 1))
            
            # Check for common issues in the code block
            
            # Issue 1: Missing imports
            if echo "$code_block" | grep -q "createReActAgent\|createPlanExecuteAgent\|createReflectionAgent\|createMultiAgentSystem"; then
                if ! echo "$code_block" | grep -q "from '@agentforge/patterns'"; then
                    echo "⚠️  Potential missing import in $file:$block_start"
                    echo "   Found pattern creation without '@agentforge/patterns' import"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi
            
            # Issue 2: ChatOpenAI without import
            if echo "$code_block" | grep -q "ChatOpenAI"; then
                if ! echo "$code_block" | grep -q "from '@langchain/openai'"; then
                    echo "⚠️  Potential missing import in $file:$block_start"
                    echo "   Found ChatOpenAI without '@langchain/openai' import"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi
            
            # Issue 3: toolBuilder without import
            if echo "$code_block" | grep -q "toolBuilder\|ToolBuilder"; then
                if ! echo "$code_block" | grep -q "from '@agentforge/core'"; then
                    echo "⚠️  Potential missing import in $file:$block_start"
                    echo "   Found toolBuilder without '@agentforge/core' import"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi
            
            # Issue 4: Zod without import
            if echo "$code_block" | grep -q "z\."; then
                if ! echo "$code_block" | grep -q "from 'zod'"; then
                    echo "⚠️  Potential missing import in $file:$block_start"
                    echo "   Found Zod usage without 'zod' import"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi
            
            # Issue 5: Unclosed braces/brackets
            open_braces=$(echo "$code_block" | grep -o "{" | wc -l)
            close_braces=$(echo "$code_block" | grep -o "}" | wc -l)
            if [ "$open_braces" -ne "$close_braces" ]; then
                echo "⚠️  Unbalanced braces in $file:$block_start"
                echo "   Open: $open_braces, Close: $close_braces"
                ISSUES_FOUND=$((ISSUES_FOUND + 1))
            fi
            
            code_block=""
            continue
        fi
        
        # Accumulate code block content
        if [ "$in_code_block" = true ]; then
            code_block="$code_block"$'\n'"$line"
        fi
    done < "$file"
done

echo ""
echo "=== Summary ==="
echo "Total TypeScript examples checked: $TOTAL_EXAMPLES"
echo "Potential issues found: $ISSUES_FOUND"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ No obvious issues found!"
    exit 0
else
    echo "⚠️  Found $ISSUES_FOUND potential issue(s)"
    echo "Note: These are heuristic checks. Manual review recommended."
    exit 0  # Don't fail, just warn
fi

