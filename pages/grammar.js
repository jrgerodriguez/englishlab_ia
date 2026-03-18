import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import { levelNames, grammarTopics, questionAmounts, grammarTestPrompt } from "../data/config";

export default function GrammarTest() {
  const router = useRouter();
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("tenses");
  const [amount, setAmount] = useState(10);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  async function startTest() {
    setLoading(true);
    setStarted(true);
    
    try {
      // Add timestamp and random seed to ensure unique questions every time
      const timestamp = new Date().toISOString();
      const randomSeed = Math.random().toString(36).substring(7);
      
      const prompt = grammarTestPrompt
        .replace("{amount}", amount)
        .replace("{topic}", grammarTopics[topic].label) + 
        `\n\nGeneration ID: ${timestamp}-${randomSeed}\nEnsure these questions are completely different from any previous generation.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are a helpful English grammar test generator. Return only valid JSON. Create unique questions every time, never repeat examples.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      
      setQuestions(parsed);
      setCurrentIndex(0);
      setAnswers({});
    } catch (error) {
      console.error("Error generating test:", error);
      alert("Error generating test. Please try again.");
      setStarted(false);
    }
    setLoading(false);
  }

  function handleAnswer(questionIndex, answer) {
    setAnswers({ ...answers, [questionIndex]: answer });
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  async function submitTest() {
    setEvaluating(true);
    
    let correct = 0;
    const feedback = [];

    questions.forEach((q, idx) => {
      const userAnswer = answers[idx]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      
      if (userAnswer === correctAnswer) {
        correct++;
        feedback.push({ question: q.question, status: "correct", userAnswer, correctAnswer: q.correctAnswer });
      } else {
        feedback.push({ question: q.question, status: "incorrect", userAnswer: answers[idx] || "(no answer)", correctAnswer: q.correctAnswer });
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    
    setResults({
      score,
      correct,
      total: questions.length,
      feedback,
    });
    
    setEvaluating(false);
  }

  const currentQuestion = questions[currentIndex];
  const allAnswered = questions.length > 0 && questions.every((_, idx) => answers[idx] !== undefined && answers[idx] !== "");

  // Loading screen
  if (loading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
        <div className={styles.spinnerText}>Generating your grammar test...</div>
      </div>
    );
  }

  // Evaluating screen
  if (evaluating) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner}></div>
        <div className={styles.spinnerText}>Evaluating your answers...</div>
      </div>
    );
  }

  // Results screen
  if (results) {
    const scoreColor = results.score >= 80 ? "#10b981" : results.score >= 60 ? "#f59e0b" : "#ef4444";
    const scoreLabel = results.score >= 80 ? "Excellent!" : results.score >= 60 ? "Good Job!" : "Keep Practicing!";

    return (
      <>
        <Head><title>Grammar Test Results - EnglishLab AI</title></Head>
        <div className={styles.container}>
          <div className={styles.card} style={{ maxWidth: 720 }}>
            <div className={styles.header}>
              <div className={styles.sectionLabel} style={{ marginBottom: 8, color: scoreColor }}>Test Complete</div>
              <h2 className={styles.title}>{scoreLabel}</h2>
              <div className={styles.subtitle}>
                {grammarTopics[topic].label} · {levelNames[level]} · {results.correct}/{results.total} correct
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: scoreColor, filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%' }}></div>
                <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={160} height={160} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
                    <circle cx={80} cy={80} r={72} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
                    <circle cx={80} cy={80} r={72} fill="none" stroke={scoreColor} strokeWidth={8}
                      strokeDasharray={452} strokeDashoffset={452 - (results.score / 100) * 452}
                      strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }} />
                  </svg>
                  <div style={{ fontSize: 35, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>
                    {results.score}<span style={{ fontSize: 22, color: "rgba(255,255,255,0.5)"}}>%</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 20 }}>
              {results.feedback.map((item, idx) => (
                <div key={idx} style={{
                  background: item.status === "correct" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${item.status === "correct" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#f8fafc" }}>
                    {idx + 1}. {item.question}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>
                    Your answer: <span style={{ color: item.status === "correct" ? "#34d399" : "#f87171", fontWeight: 500 }}>{item.userAnswer}</span>
                  </div>
                  {item.status === "incorrect" && (
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                      Correct answer: <span style={{ color: "#34d399", fontWeight: 500 }}>{item.correctAnswer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className={styles.startBtn} onClick={() => router.push("/")}>
                Back to Home
              </button>
              <button className={styles.startBtn} onClick={() => { setResults(null); setStarted(false); setQuestions([]); setAnswers({}); }}>
                New Test
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Test in progress
  if (started && questions.length > 0) {
    return (
      <>
        <Head><title>Grammar Test - EnglishLab AI</title></Head>
        <div className={styles.testLayout}>
          <div className={styles.testContainer}>
            
            <div className={styles.testHeader}>
              <div>
                <div className={styles.sectionLabel} style={{ marginBottom: 4 }}>
                  {grammarTopics[topic].label} · {levelNames[level]}
                </div>
                <div style={{ fontSize: 14, color: "#94a3b8" }}>
                  Question {currentIndex + 1} of {questions.length}
                </div>
              </div>
              <button className={styles.endBtn} onClick={() => { setStarted(false); setQuestions([]); setAnswers({}); }}>
                Exit Test
              </button>
            </div>

            <div className={styles.questionCard}>
              <div className={styles.questionText}>{currentQuestion.question}</div>

              {currentQuestion.type === "multiple-choice" ? (
                <div className={styles.optionsGrid}>
                  {currentQuestion.options.map((option, idx) => (
                    <label key={idx} className={styles.optionLabel}>
                      <input
                        type="radio"
                        name={`question-${currentIndex}`}
                        value={option}
                        checked={answers[currentIndex] === option}
                        onChange={(e) => handleAnswer(currentIndex, e.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  className={styles.fillBlankInput}
                  placeholder="Type your answer here..."
                  value={answers[currentIndex] || ""}
                  onChange={(e) => handleAnswer(currentIndex, e.target.value)}
                />
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
              <button
                className={styles.endBtn}
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                style={{ opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? "not-allowed" : "pointer" }}
              >
                ← Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button className={styles.startBtn} onClick={nextQuestion} style={{ flex: 1 }}>
                  Next →
                </button>
              ) : (
                <button
                  className={styles.startBtn}
                  onClick={submitTest}
                  disabled={!allAnswered}
                  style={{ flex: 1, opacity: allAnswered ? 1 : 0.5, cursor: allAnswered ? "pointer" : "not-allowed" }}
                >
                  Submit Test
                </button>
              )}
            </div>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748b" }}>
              Answered: {Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== "").length} / {questions.length}
            </div>

          </div>
        </div>
      </>
    );
  }

  // Start screen
  return (
    <>
      <Head><title>Grammar Test - EnglishLab AI</title></Head>
      <div className={styles.container}>
        <div className={styles.card}>
          
          <div className={styles.header}>
            <div className={styles.iconWrapper}>📝</div>
            <h1 className={styles.title}>Grammar Test</h1>
            <p className={styles.subtitle}>Practice English grammar with AI-generated exercises.</p>
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
            <div className={styles.sectionLabel}>Grammar Topic</div>
            <div className={styles.gridOptions}>
              {Object.entries(grammarTopics).map(([key, data]) => (
                <button key={key} onClick={() => setTopic(key)} className={`${styles.gridBtn} ${topic === key ? styles.gridBtnActive : ''}`}>
                  <span className={styles.gridBtnIcon}>{data.icon}</span>
                  {data.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Number of Questions</div>
            <div className={styles.pillGroup}>
              {questionAmounts.map((num) => (
                <button key={num} onClick={() => setAmount(num)} className={`${styles.btnPill} ${amount === num ? styles.btnPillActive : ''}`}>
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.infoBox}>
            The AI will generate <strong>{amount} questions</strong> on <strong>{grammarTopics[topic].label}</strong> at the <strong>{levelNames[level]}</strong> level.
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className={styles.endBtn} onClick={() => router.push("/")} style={{ flex: 1 }}>
              ← Back
            </button>
            <button className={styles.startBtn} onClick={startTest} style={{ flex: 2 }}>
              Start Test
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
