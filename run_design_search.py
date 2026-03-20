import sys
import subprocess
import os

def run_design_search(query):
    # Set PYTHONIOENCODING to utf-8
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    
    cmd = [
        "python", ".agent/.shared/ui-ux-pro-max/scripts/search.py", query, "--design-system", "-f", "markdown"
    ]
    
    result = subprocess.run(cmd, env=env, capture_output=True, text=True, encoding="utf-8")
    
    if result.returncode == 0:
        with open("design_system.md", "w", encoding="utf-8") as f:
            f.write(result.stdout)
        print("Design system generated in design_system.md")
    else:
        print("Error:", result.stderr)

if __name__ == "__main__":
    query = "movie streaming entertainment cinema library playlists responsive"
    run_design_search(query)
