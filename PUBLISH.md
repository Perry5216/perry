# Publish this repo (does not touch perry-system)

This folder is ready. Creating `Perry5216/perry-v2` on GitHub needs a login from this machine (no `gh` session and the local SSH key is not on GitHub).

```powershell
# 1) Install GitHub CLI if needed, then log in (browser)
winget install --id GitHub.cli
gh auth login

# 2) Create the NEW repo only — do not push to perry-system
cd C:\Users\5216p\Projects\perry-v2
git branch -M main
gh repo create Perry5216/perry-v2 --public --source=. --remote=origin --push --description "Perry v2 — self-hosted multi-agent platform. v1 stays at perry-system. v3 in design."

# 3) Pin it on your profile (optional)
# Open https://github.com/Perry5216/Perry5216 and paste PROFILE-README-SNIPPET.md
# into the "Currently building" section. Keep the v1 link.
```

Do **not** run `git push` against `perry-system`. That is v1 and stays as-is.
