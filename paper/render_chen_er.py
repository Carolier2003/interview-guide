from playwright.sync_api import sync_playwright
from PIL import Image

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 2000, "height": 1400})

    # Read the SVG file
    with open('/tmp/chen_er_square.svg', 'r') as f:
        svg_content = f.read()

    # Create HTML with the SVG embedded
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {{ margin: 0; padding: 0; background: #ffffff; }}
svg {{ display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""

    page.set_content(html)
    page.wait_for_timeout(500)

    # Take full page screenshot
    page.screenshot(path="/Users/carol/workspace/interview-guide/paper/chapter3_fig3_full.png")

    browser.close()

# No crop needed - use the full screenshot directly
import shutil
shutil.copy("/Users/carol/workspace/interview-guide/paper/chapter3_fig3_full.png",
            "/Users/carol/workspace/interview-guide/paper/chapter3_fig3.png")

print("Saved to chapter3_fig3.png")
