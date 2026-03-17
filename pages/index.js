import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import { levelNames, levelColors, scenarios, systemPrompts, openingMessages, evaluationPrompt } from "../data/config";

// ----- Helper Components -----

function formatTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

function ScoreIndicator({ value, color, size = 80 }) {
  const strokeWidth = 8;
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }} />
      </svg>
      <div style={{ fontSize: size * 0.22, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>
        {value}<span style={{ fontSize: size * 0.14, color: "rgba(255,255,255,0.5)"}}>%</span>
      </div>
    </div>
  );
}

// ----- Main Page Component -----

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("home"); // "home", "chat", "grammar"
  const [level, setLevel] = useState("easy");
  const [scenario, setScenario] = useState("hotel");
  
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(240);
  const [sessionActive, setSessionActive] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState(null);
  const [started, setStarted] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (sessionActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (sessionActive && timeLeft === 0) {
      endSession();
    }
    return () => clearTimeout(timerRef.current);
  }, [sessionActive, timeLeft]);

  // Session Handlers
  async function startSession(lvl, sc) {
    clearTimeout(timerRef.current);
    setResults(null);
    setEvaluating(false);
    setStarted(true);
    setSessionActive(true);
    setTimeLeft(240);
    setInput("");

    const key = `${sc}_${lvl}`;
    const opening = openingMessages[key] || openingMessages[`${sc}_easy`];
    const openingMsg = { sender: "customer", text: opening, time: formatTime() };
    setMessages([openingMsg]);
    setHistory([{ role: "assistant", content: opening }]);
  }

  async function endSession() {
    clearTimeout(timerRef.current);
    setSessionActive(false);
    setEvaluating(true);

    const studentMessages = history.filter((m) => m.role === "user").map((m) => m.content);
    if (studentMessages.length === 0) {
      setEvaluating(false);
      setResults({ grammar: 0, coherence: 0, professionalism: 0, overall: 0, grammarFeedback: "No messages to evaluate.", coherenceFeedback: "No messages to evaluate.", professionalismFeedback: "No messages to evaluate.", strongPoint: "N/A", improvementTip: "Try to send at least a few messages next time!" });
      return;
    }

    const conversationText = history.map((m) => `${m.role === "user" ? "AGENT" : "CUSTOMER"}: ${m.content}`).join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: evaluationPrompt,
          messages: [{ role: "user", content: `Evaluate this conversation:\n\n${conversationText}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
    } catch {
      setResults({ grammar: 70, coherence: 70, professionalism: 70, overall: 70, grammarFeedback: "Could not evaluate grammar.", coherenceFeedback: "Could not evaluate coherence.", professionalismFeedback: "Could not evaluate professionalism.", strongPoint: "You completed the session!", improvementTip: "Keep practicing regularly." });
    }
    setEvaluating(false);
  }

  async function handleSend() {
    if (!input.trim() || isTyping || !sessionActive) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { sender: "user", text, time: formatTime() };
    setMessages((prev) => [...prev, userMsg]);
    const newHistory = [...history, { role: "user", content: text }];
    setHistory(newHistory);
    setIsTyping(true);

    try {
      const system = systemPrompts[level].replace("{scenario}", scenarios[scenario].role);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory, system }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I see. Could you help me with that?";
      setMessages((prev) => [...prev, { sender: "customer", text: reply, time: formatTime() }]);
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "customer", text: "Sorry, could you repeat that?", time: formatTime() }]);
    }
    setIsTyping(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function autoResize(e) {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  // Common Variables
  const sc = scenarios[scenario];
  const timerColor = timeLeft <= 30 ? "#f87171" : timeLeft <= 60 ? "#fbbf24" : "#34d399";
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  // View: Evaluating Loader
  if (evaluating) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
        <div className={styles.spinnerText}>Analyzing your English proficiency...</div>
      </div>
    );
  }

  // View: Results Screen
  if (results) {
    const overallColor = results.overall >= 80 ? "#10b981" : results.overall >= 60 ? "#f59e0b" : "#ef4444";
    const overallLabel = results.overall >= 80 ? "Excellent Performance!" : results.overall >= 60 ? "Good Job!" : "Keep Practicing!";

    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ maxWidth: 640 }}>
          <div className={styles.header}>
            <div className={styles.sectionLabel} style={{ marginBottom: 8, color: overallColor }}>Session Complete</div>
            <h2 className={styles.title}>{overallLabel}</h2>
            <div className={styles.subtitle}>{sc.role} · {levelNames[level]}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: overallColor, filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%' }}></div>
              <ScoreIndicator value={results.overall} color={overallColor} size={160} />
            </div>
          </div>

          <div className={styles.resultsGrid}>
             {[
               { label: "Grammar", value: results.grammar, feedback: results.grammarFeedback },
               { label: "Coherence", value: results.coherence, feedback: results.coherenceFeedback },
               { label: "Professionalism", value: results.professionalism, feedback: results.professionalismFeedback },
             ].map((item) => {
               const itemColor = item.value >= 80 ? "#10b981" : item.value >= 60 ? "#f59e0b" : "#ef4444";
               return (
                 <div key={item.label} className={styles.resultBox}>
                   <ScoreIndicator value={item.value} color={itemColor} size={84} />
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8 }}>
                     <div className={styles.resultLabel}>{item.label}</div>
                     <div className={styles.resultFeedback}>{item.feedback}</div>
                   </div>
                 </div>
               );
             })}
          </div>

          <div className={styles.feedbackGrid}>
             <div className={`${styles.feedbackCard} ${styles.strong}`}>
               <div className={styles.feedbackTitle}>Strong Point</div>
               <div className={styles.feedbackText}>{results.strongPoint}</div>
             </div>
             <div className={`${styles.feedbackCard} ${styles.improve}`}>
               <div className={styles.feedbackTitle}>To Improve</div>
               <div className={styles.feedbackText}>{results.improvementTip}</div>
             </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className={styles.startBtn} onClick={() => { setResults(null); setStarted(false); setMode("home"); }}>
              Back to Home
            </button>
            <button className={styles.startBtn} onClick={() => { setResults(null); setStarted(false); setMode("chat"); }}>
              New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View: Start Screen (Mode Selection)
  if (!started && mode === "home") {
    return (
      <>
        <Head><title>EnglishLab AI</title></Head>
        <div className={styles.container}>
          <div className={styles.card}>
            
            <div className={styles.header}>
              <div className={styles.iconWrapper}>✨</div>
              <h1 className={styles.title}>EnglishLab AI</h1>
              <p className={styles.subtitle}>Immersive AI-driven English training platform.</p>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Choose Your Practice Mode</div>
              <div className={styles.gridOptions}>
                <button onClick={() => setMode("chat")} className={styles.gridBtn}>
                  <span className={styles.gridBtnIcon}>💬</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Chat Practice</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>Roleplay conversations with AI customers</div>
                  </div>
                </button>
                <button onClick={() => router.push("/grammar")} className={styles.gridBtn}>
                  <span className={styles.gridBtnIcon}>📝</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Grammar Tests</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>Practice tenses, conditionals, and more</div>
                  </div>
                </button>
              </div>
            </div>

            <div className={styles.infoBox}>
              Choose between <strong>interactive chat practice</strong> or <strong>grammar exercises</strong> to improve your English skills.
            </div>

          </div>
        </div>
      </>
    );
  }

  // View: Chat Setup Screen
  if (!started && mode === "chat") {
    return (
      <>
        <Head><title>EnglishLab AI - Chat Practice</title></Head>
        <div className={styles.container}>
          <div className={styles.card}>
            
            <div className={styles.header}>
              <div className={styles.iconWrapper}>💬</div>
              <h1 className={styles.title}>Chat Practice</h1>
              <p className={styles.subtitle}>Immersive AI-driven call center training.</p>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Difficulty Level</div>
              <div className={styles.pillGroup}>
                {Object.entries(levelNames).map(([key, name]) => (
                  <button key={key} onClick={() => setLevel(key)} className={`${styles.btnPill} ${level === key ? styles.btnPillActive : ''}`}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Roleplay Scenario</div>
              <div className={styles.gridOptions}>
                {Object.entries(scenarios).map(([key, data]) => (
                  <button key={key} onClick={() => setScenario(key)} className={`${styles.gridBtn} ${scenario === key ? styles.gridBtnActive : ''}`}>
                    <span className={styles.gridBtnIcon}>{data.icon}</span>
                    {data.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.infoBox}>
              You have <strong>2 minutes</strong> to assist the customer. Respond professionally to earn a high score.
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className={styles.endBtn} onClick={() => setMode("home")} style={{ flex: 1 }}>
                ← Back
              </button>
              <button className={styles.startBtn} onClick={() => startSession(level, scenario)} style={{ flex: 2 }}>
                Initialize Session
              </button>
            </div>

          </div>
        </div>
      </>
    );
  }

  // View: Chat Interface
  return (
    <>
      <Head><title>Active Session - EnglishLab AI</title></Head>
      <div className={styles.chatLayout}>
        
        {/* Header */}
        <header className={styles.chatHeader}>
          <div className={styles.avatar}>{sc.initials}</div>
          <div className={styles.headerInfo}>
            <h2 className={styles.headerName}>{sc.name}</h2>
            <div className={styles.headerRole}>{sc.role} · {levelNames[level]}</div>
          </div>
          <div className={styles.headerTimer}>
            <div className={styles.timeText} style={{ color: timerColor }}>{mins}:{secs}</div>
            <button className={styles.endBtn} onClick={endSession}>End Call</button>
          </div>
        </header>

        {/* Messages List */}
        <div className={styles.chatMessages}>
          {messages.map((msg, i) => {
            const isUser = msg.sender === "user";
            return (
              <div key={i} className={`${styles.messageRow} ${isUser ? styles.messageRowUser : ''}`}>
                {!isUser && <div className={styles.avatar} style={{ width: 36, height: 36, fontSize: 13, boxShadow: 'none' }}>{sc.initials}</div>}
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
                    {msg.text}
                  </div>
                  <div className={styles.msgTime}>{msg.time}</div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
             <div className={styles.messageRow}>
               <div className={styles.avatar} style={{ width: 36, height: 36, fontSize: 13, boxShadow: 'none' }}>{sc.initials}</div>
               <div className={styles.typingIndicator}>
                 <div className={styles.dot}></div>
                 <div className={styles.dot}></div>
                 <div className={styles.dot}></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
             <textarea 
                ref={textareaRef} 
                value={input} 
                onChange={(e) => { setInput(e.target.value); autoResize(e); }} 
                onKeyDown={handleKey} 
                placeholder={sessionActive ? "Type your response..." : "Session ended"} 
                disabled={!sessionActive || isTyping} 
                className={styles.textarea}
                rows={1}
             />
          </div>
          <button className={styles.sendBtn} onClick={handleSend} disabled={isTyping || !input.trim() || !sessionActive}>
             <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

      </div>
    </>
  );
}