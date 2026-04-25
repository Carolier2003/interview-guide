from playwright.sync_api import sync_playwright
from PIL import Image

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 2000, "height": 1200})
    page.goto("http://localhost:6003?mcp=mcp-mo5mfj6n-hpp2av")
    page.wait_for_timeout(4000)

    # Full page screenshot
    full_path = "/Users/carol/workspace/interview-guide/paper/chapter3_fig3_full.png"
    page.screenshot(path=full_path)
    print("Full screenshot saved")

    browser.close()

# Crop with PIL
img = Image.open(full_path)
# Crop the diagram area (adjust based on visual inspection)
crop = img.crop((210, 125, 1230, 720))
crop.save("/Users/carol/workspace/interview-guide/paper/chapter3_fig3.png")
print("Cropped and saved to chapter3_fig3.png")
