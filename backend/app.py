from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from flask import send_file
import io
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
import re



app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = "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"

API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    concept = data.get("concept")
    level = data.get("level", "beginner")
    language = data.get("language")
    prompt = f"""
You are an expert computer science tutor.

Your task is to generate STRICTLY STRUCTURED educational content.

FAIL IF FORMAT IS NOT FOLLOWED EXACTLY.

Teach the concept "{concept}" at a {level} level in {language} Language.

IMPORTANT:
- Explanation must be in {language}
- Code should remain in English
- Quiz questions and options must be in {language}
IMPORTANT:
Reply ONLY in this exact format:
--------------------------------
### Explanation
Explain the concept in depth (minimum 12–15 sentences).
Use examples, intuition, and real-world analogies.
If applicable, include an ASCII diagram OR flow explanation.
If a diagram is relevant, embed it directly in the explanation.

--------------------------------
### Code
Provide a clean, well-commented Python example if the topic has it.
Code must be inside triple backticks.

--------------------------------
### Quiz

Generate EXACTLY 5 multiple-choice questions.

FOR EACH QUESTION, FOLLOW THIS EXACT FORMAT:

1. Question text
a) option text
b) option text
c) option text
d) option text
Answer: b

IMPORTANT RULES:
- DO NOT include explanations.
- DO NOT include feedback text.
- DO NOT include anything after the answer line.
- EXACTLY 5 questions.
- ONLY use the format shown above.
- No extra text, no markdown, no commentary.
--------------------------------
"""
    payload = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(API_URL, headers=HEADERS, data=json.dumps(payload))
    result = response.json()["choices"][0]["message"]["content"]

    return jsonify({"result": result})
@app.route("/download-section", methods=["POST"])
def download_section():
    raw_content = request.json.get("content")

    # Clean HTML breaks
    clean_text = re.sub(r"<br\s*/?>", "\n", raw_content)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    story = []

    for line in clean_text.split("\n"):
        if line.strip():
            story.append(Paragraph(line, styles["Normal"]))
            story.append(Spacer(1, 0.15 * inch))

    doc.build(story)
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="LearnX_Section.pdf")

@app.route("/download-all", methods=["POST"])
def download_all():
    print("DOWNLOAD ALL HIT")
    sections = request.json.get("sections")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    story = []

    for section in sections:
        clean_text = re.sub(r"<br\s*/?>", "\n", section)

        for line in clean_text.split("\n"):
            if line.strip():
                story.append(Paragraph(line, styles["Normal"]))
                story.append(Spacer(1, 0.15 * inch))

        story.append(Spacer(1, 0.4 * inch))  # space between sections

    doc.build(story)
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="LearnX_Full_Guide.pdf")

if __name__ == "__main__":
    app.run(debug=True)
