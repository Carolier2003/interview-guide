import xml.etree.ElementTree as ET

def create_dfd():
    ns = "http://www.w3.org/2000/svg"
    ET.register_namespace("", ns)
    svg = ET.Element("svg", {
        "xmlns": ns,
        "width": "800",
        "height": "600",
        "viewBox": "0 0 800 600",
        "style": "background-color: white;"
    })
    
    def add_text(x, y, text, size=14, weight="normal", anchor="middle"):
        el = ET.SubElement(svg, "text", {
            "x": str(x), "y": str(y),
            "font-family": "SimHei, Heiti, sans-serif",
            "font-size": str(size),
            "font-weight": weight,
            "text-anchor": anchor,
            "fill": "black"
        })
        el.text = text
        return el
    
    def add_rect(x, y, w, h, label):
        ET.SubElement(svg, "rect", {
            "x": str(x), "y": str(y), "width": str(w), "height": str(h),
            "fill": "white", "stroke": "black", "stroke-width": "2"
        })
        add_text(x + w/2, y + h/2 + 5, label, size=15, weight="bold")
    
    def add_circle(cx, cy, r, label):
        ET.SubElement(svg, "circle", {
            "cx": str(cx), "cy": str(cy), "r": str(r),
            "fill": "white", "stroke": "black", "stroke-width": "2"
        })
        add_text(cx, cy + 6, label, size=16, weight="bold")
    
    def arrow_line(x1, y1, x2, y2):
        ET.SubElement(svg, "line", {
            "x1": str(x1), "y1": str(y1), "x2": str(x2), "y2": str(y2),
            "stroke": "black", "stroke-width": "2",
            "marker-end": "url(#arrowhead)"
        })
    
    # Arrow marker
    defs = ET.SubElement(svg, "defs")
    marker = ET.SubElement(defs, "marker", {
        "id": "arrowhead", "markerWidth": "10", "markerHeight": "7",
        "refX": "9", "refY": "3.5", "orient": "auto"
    })
    ET.SubElement(marker, "polygon", {
        "points": "0 0, 10 3.5, 0 7", "fill": "black"
    })
    
    # Entities
    add_rect(60, 270, 140, 60, "求职者")
    add_rect(330, 40, 140, 60, "LLM服务")
    add_rect(600, 270, 140, 60, "语音服务")
    
    # System (center circle)
    add_circle(400, 300, 100, "AI面试辅导系统")
    
    # --- Left: 求职者 ---
    # Input: 求职者 → 系统 (upper)
    arrow_line(200, 275, 302, 275)
    add_text(250, 268, "简历文件、面试配置、答题", size=13, anchor="middle")
    
    # Output: 系统 → 求职者 (lower)
    arrow_line(302, 325, 200, 325)
    add_text(250, 340, "分析报告、题目、反馈、播报", size=13, anchor="middle")
    
    # --- Top: LLM服务 ---
    # Request: 系统 → LLM (left side)
    arrow_line(390, 200, 390, 100)
    add_text(330, 155, "评分/生成/RAG请求", size=13, anchor="middle")
    
    # Response: LLM → 系统 (right side)
    arrow_line(410, 100, 410, 200)
    add_text(470, 155, "评分结果/内容/RAG回答", size=13, anchor="middle")
    
    # --- Right: 语音服务 ---
    # Request: 系统 → 语音 (upper)
    arrow_line(498, 283, 600, 280)
    add_text(550, 273, "ASR音频、TTS文本", size=13, anchor="middle")
    
    # Response: 语音 → 系统 (lower)
    arrow_line(600, 320, 498, 317)
    add_text(550, 335, "ASR文本、TTS音频流", size=13, anchor="middle")
    
    # Title
    add_text(400, 560, "图X 顶层数据流图", size=16, weight="bold")
    
    tree = ET.ElementTree(svg)
    tree.write("/Users/carol/workspace/interview-guide/paper/top_level_dfd_v3.svg",
               encoding="utf-8", xml_declaration=True)

create_dfd()
