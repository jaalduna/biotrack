# Lessons Learned

This folder contains documented lessons from debugging sessions, deployment issues, and architectural decisions. Each lesson includes root cause analysis, resolution steps, and prevention strategies.

## Purpose

1. **Faster Diagnosis**: When similar issues occur, check here first
2. **Knowledge Preservation**: Don't lose hard-won debugging insights
3. **Onboarding**: Help new team members avoid known pitfalls
4. **Pattern Recognition**: Identify recurring issues that need architectural fixes

## Lesson Index

| ID | Title | Category | Date | Severity |
|----|-------|----------|------|----------|
| [001](./001-railway-monorepo-deployment.md) | Railway Monorepo Deployment Configuration | DevOps | 2026-01-14 | Critical |

## How to Use

### When Debugging
1. Search this folder for keywords related to your error
2. Check the "Symptoms" section of each lesson
3. Follow the "Diagnostic Workflow" if provided
4. Apply the "Prevention Checklist" after resolution

### Adding New Lessons
1. Create a new file: `NNN-short-description.md`
2. Use the template below
3. Update this README's index table
4. Cross-reference in relevant PRD sections

## Lesson Template

```markdown
# Lesson Learned: [Title]

**Date**: YYYY-MM-DD
**Category**: [DevOps/Frontend/Backend/Database/Security/Performance]
**Severity**: [Critical/High/Medium/Low]
**Time to Resolution**: X hours
**Related PRD**: [Link if applicable]

---

## Executive Summary
[One paragraph describing the issue and key insight]

---

## Problem Description

### Symptoms
- [What did you observe?]
- [Error messages?]
- [Unexpected behavior?]

### Root Cause
[Technical explanation of why this happened]

---

## Resolution Journey
[Table of attempts and learnings]

---

## Solution Applied
[What actually fixed it]

---

## Diagnostic Workflow
[Flowchart or steps for future diagnosis]

---

## Prevention Checklist
- [ ] [Step to prevent recurrence]

---

## Tags
`#tag1` `#tag2`
```

## Search Tips

- **By Error Message**: `grep -r "error message" docs/lessons-learned/`
- **By Category**: Check the index table above
- **By Tag**: Search for `#tagname` in the files
