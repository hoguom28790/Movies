---
description: Finish current task, clear build artifacts, and deploy to GitHub.
// turbo-all
---

# /ship - Final Task Completion & Deployment

Use this command when a task is finished and you are ready to push changes.

## 📋 Mandatory Steps

// turbo
1. **Clear Build Artifacts**
   - Command: `if (Test-Path .next) { Remove-Item -Recurse -Force .next }` (PowerShell)
   - Purpose: Ensure fresh builds and prevent cache issues in production.

2. **Commit Changes**
   - Command: `git add .`
   - Command: `git commit -m "feat: completed task [TASK_SUMMARY]"`
   - Note: Use descriptive commit messages.

3. **Deploy to GitHub**
   - Command: `git push`
   - Purpose: Sync with remote repository and trigger CI/CD (Vercel/etc).

4. **Verify Deployment**
   - Run `python .agent/scripts/checklist.py .`
   - Check online status if applicable.

## 🚀 Execution Summary

```markdown
## 🏁 Task Shipped
### Summary of Changes:
- [Change 1]
- [Change 2]

### Cleanup & Deploy:
- [x] .next cleared
- [x] Git committed
- [x] Pushed to GitHub
```
