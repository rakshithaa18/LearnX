let selectedLevel = "beginner";

const sectionTitles = [
  "🧠 Understand the Idea",
  "💻 Implement with Code",
  "📝 Practice & Test Yourself"
];

const conceptList = [
  "Backpropagation",
  "Neural Networks",
  "Convolutional Neural Network",
  "Recurrent Neural Network",
  "Gradient Descent",
  "Support Vector Machine",
  "Decision Tree",
  "Random Forest",
  "K-Means Clustering",
  "Naive Bayes",
  "Linear Regression",
  "Logistic Regression",
  "Python Lists",
  "Python Dictionaries",
  "Binary Search",
  "Merge Sort"
];

function showSuggestions() {
  const input = document.getElementById("concept").value.toLowerCase();
  const suggestionBox = document.getElementById("suggestions");
  suggestionBox.innerHTML = "";
  if (input.length < 3) return;

  conceptList
    .filter(item => item.toLowerCase().includes(input))
    .forEach(match => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.innerText = match;
      div.onclick = () => {
        document.getElementById("concept").value = match;
        suggestionBox.innerHTML = "";
      };
      suggestionBox.appendChild(div);
    });
}

function setLevel(level) {
  selectedLevel = level;
  document.querySelectorAll(".level").forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
}

let sections = [];
let currentStep = 0;

async function generate() {
  const concept = document.getElementById("concept").value;
  const output = document.getElementById("output");

  saveHistory(concept);
  showYouTubeLinks(concept);

  output.innerHTML = `
    <div style="color:#cbd5e1;font-size:14px;margin-top:40px;text-align:center;">
      ✨ Preparing your learning path…
    </div>
  `;

  const response = await fetch("http://127.0.0.1:5000/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concept: concept,
      level: selectedLevel,
      language: selectedLanguage
})
  });

  const data = await response.json();
  sections = [];

const explain = data.result.match(
  /### Explanation([\s\S]*?)(?=### Code|### Quiz|$)/
);

const code = data.result.match(
  /### Code([\s\S]*?)(?=### Quiz|$)/
);

const quiz = data.result.match(
  /### Quiz([\s\S]*)/
);


sections.push(explain ? explain[1].trim() : "No explanation available.");
sections.push(code ? code[1].trim() : "Code not applicable for this topic.");
sections.push(quiz ? quiz[1].trim() : "");


  currentStep = 0;
  showSection();
}

function showSection() {
  updateProgress();

  const output = document.getElementById("output");
  output.innerHTML = "";

  let content = sections[currentStep].trim();

  // Remove first heading line
  content = content.replace(/^.*?\n/, "");

  // REMOVE RAW QUIZ TEXT COMPLETELY
  if (currentStep === 2) {
    content = ""; 
  } else {
    const quizIndex = content.search(/\n1\.\s/);
    if (quizIndex !== -1) {
      content = content.substring(0, quizIndex);
    }
  }

  // Image support
  content = content.replace(
  /!\[(.*?)\]\((.*?)\)/g,
  `<img src="$2" alt="$1" style="max-width:100%;margin:20px 0;border-radius:12px;" />`
   );

  // If code section and empty -> show fallback
if (currentStep === 1 && content.trim() === "") {
  content = "Code not applicable for this topic.";
}


  // Code blocks
  content = content.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre class="code-block"><code>${code
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</code></pre>`;
  });

  content = content.replace(/\n/g, "<br>");

  // MAIN CONTENT CARD
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    ${currentStep === 2 ? "" : `<h3>${sectionTitles[currentStep]}</h3>`}

    <div id="content-text">${content}</div>

    <div class="nav-buttons">
      <button class="prev-btn" onclick="prevSection()" ${currentStep === 0 ? "disabled" : ""}>⬅ Previous</button>
      <button class="download-btn" onclick="downloadCurrentSection()">⬇ Download</button>

      <button class="next-btn primary-btn" onclick="nextSection()">Next ➜</button>


    </div>
  `;

  output.appendChild(card);

  // ONLY FOR QUIZ STEP
  if (currentStep === 2) {

    const quizCard = document.createElement("div");
    quizCard.className = "card";
    quizCard.style.marginTop = "25px";

    quizCard.innerHTML = `
      <h3 class="practice-title">📝 Practice & Test Yourself</h3>
      <div id="quiz-container"></div>
      <div id="quiz-result"></div>
    `;

    output.appendChild(quizCard);

    handleQuizSection(sections[currentStep]);
  }
}


function nextSection() {
  if (currentStep < sections.length - 1) {
    currentStep++;
    showSection();
  }
}

function prevSection() {
  if (currentStep > 0) {
    currentStep--;
    showSection();
  }
}

function updateProgress() {
  const progress = document.getElementById("progress");
  progress.innerHTML = "";
  ["🧠 Explaination", "💻 Code", "📝 Quiz"].forEach((label, i) => {
    const step = document.createElement("div");
    step.className = "step" + (i === currentStep ? " active" : "");
    step.innerHTML = `<div class="step-dot"></div>${label}`;
    progress.appendChild(step);
  });
}

/* ---------------- QUIZ LOGIC ---------------- */

let currentQuiz = [];

function checkQuiz() {
  let score = 0;

  currentQuiz.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);

    if (!selected) return;

    const selectedIndex = Number(selected.value);

    if (selectedIndex === q.answer) {
      score++;
    }
  });

  document.getElementById("quiz-result").innerHTML =
    `🎯 Score: ${score} / ${currentQuiz.length}`;
}

function renderQuiz() {
  const area = document.getElementById("quiz-container");
  const result = document.getElementById("quiz-result");

  area.innerHTML = "";
  result.innerHTML = "";

  currentQuiz.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "quiz-question";

    div.innerHTML = `
      <p><strong>${i + 1}. ${q.question}</strong></p>
      ${q.options.map((opt, idx) => `
        <label class="quiz-option" style="display:block; margin-bottom:10px;">
          <input type="radio" name="q${i}" value="${idx}">
          ${opt}
        </label>
      `).join("")}
    `;

    area.appendChild(div);
  });

  const btn = document.createElement("button");
  btn.className = "quiz-submit";
  btn.innerText = "Submit Quiz";
  btn.onclick = checkQuiz;

  area.appendChild(btn);
  area.appendChild(result);
}


function handleQuizSection(rawText) {
  const lines = rawText.split("\n");
  currentQuiz = [];

  let q = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    // QUESTION
    if (/^\d+\./.test(trimmed)) {
      if (q) currentQuiz.push(q);

      q = {
        question: trimmed.replace(/^\d+\./, "").trim(),
        options: [],
        answer: -1
      };
    }

    // OPTIONS
    else if (/^[a-d]\)/i.test(trimmed) && q) {
      q.options.push(trimmed.substring(2).trim());
    }

    // ANSWER
    else if (trimmed.startsWith("Answer:") && q) {
      const letter = trimmed.split(":")[1].trim().toLowerCase();
      q.answer = letter.charCodeAt(0) - 97;
    }
  });

  if (q) currentQuiz.push(q);

  renderQuiz();
}


/* ---------------- UTILITIES (UNCHANGED) ---------------- */

function saveHistory(concept) {
  let history = JSON.parse(localStorage.getItem("learnx_history")) || [];
  history = history.filter(h => h !== concept);
  history.unshift(concept);
  if (history.length > 3) history.pop();
  localStorage.setItem("learnx_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const box = document.getElementById("history");
  box.innerHTML = "";
  (JSON.parse(localStorage.getItem("learnx_history")) || []).forEach(item => {
    const chip = document.createElement("div");
    chip.className = "history-item";
    chip.textContent = item;
    chip.onclick = () => document.getElementById("concept").value = item;
    box.appendChild(chip);
  });
}

function showYouTubeLinks(concept) {
  const yt = document.getElementById("youtube-links");
  if (!yt) return;
  const base = "https://www.youtube.com/results?search_query=";
  yt.innerHTML = `
    <ul class="yt-list">
      <li><a target="_blank" href="${base}${concept}+tutorial">📘 Beginner Tutorial</a></li>
      <li><a target="_blank" href="${base}${concept}+animated">🎥 Animated Explanation</a></li>
      <li><a target="_blank" href="${base}${concept}+real+world">🌍 Real World Examples</a></li>
      <li><a target="_blank" href="${base}${concept}+interview+questions">💼 Interview Questions</a></li>
    </ul>
  `;
}
let speech;

function readAloud() {
  const content = document.getElementById("content-text");
  if (!content || content.innerText.trim() === "") {
    alert("Nothing to read yet");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(content.innerText);

  const voices = window.speechSynthesis.getVoices();

  // Map UI language → voice language code
  const languageMap = {
    English: "en",
    Hindi: "hi",
    Tamil: "ta",
    Telugu: "te",
    Kannada: "kn"
  };

  const langCode = languageMap[selectedLanguage] || "en";

  const voice = voices.find(v => v.lang.startsWith(langCode));

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }

  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}


function stopRead() {
  window.speechSynthesis.cancel();
}

function startListening() {

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech recognition not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage === "English" ? "en-US" : "hi-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    document.getElementById("concept").value =
      event.results[0][0].transcript;
  };

  recognition.onerror = (e) => {
    alert("Mic error: " + e.error);
  };

  recognition.start();
}

function downloadCurrentSection() {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  // Grab ONLY the current content text (exclude buttons and quiz)
  const contentDiv = document.getElementById("content-text");
  if (!contentDiv || contentDiv.innerText.trim() === "") {
    alert("Nothing to download for this section!");
    return;
  }

  const content = contentDiv.innerText;

  // Wrap text to page width
  const lines = doc.splitTextToSize(content, 180);
  doc.text(lines, 10, 10);

  // Save PDF with section title
  const sectionName = ["Explanation", "Code", "Practice"][currentStep];
  doc.save(`LearnX_${sectionName}.pdf`);
}

let selectedLanguage = "English";
document.getElementById("language-btn").onclick = () => {
  const menu = document.getElementById("language-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};
function setLanguage(lang) {
  selectedLanguage = lang;
  document.getElementById("language-btn").innerText = `🌐 ${lang}`;
  document.getElementById("language-menu").style.display = "none";
}
