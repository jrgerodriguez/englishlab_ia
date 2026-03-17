export const levelNames = { easy: "Easy", medium: "Intermediate", hard: "Advanced" };
export const levelColors = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444" }; // Refined colors

export const scenarios = {
  hotel: { name: "James Wilson", initials: "JW", role: "Hotel Guest", icon: "🏨", label: "Hotel Check-in" },
  restaurant: { name: "Emily Chen", initials: "EC", role: "Restaurant Customer", icon: "🍽️", label: "Restaurant" },
  shopping: { name: "Carlos Mendez", initials: "CM", role: "Store Customer", icon: "🛍️", label: "Shopping" },
  interview: { name: "Sarah Thompson", initials: "ST", role: "HR Manager", icon: "💼", label: "Job Interview" },
  support: { name: "Mike Johnson", initials: "MJ", role: "Customer Support", icon: "📞", label: "Customer Support" },
};

export const systemPrompts = {
  easy: `You are roleplaying as a customer in a {scenario} scenario. The student is practicing English for a chat-based call center job.
Use very simple vocabulary and short sentences. Be patient and friendly.
IMPORTANT: Never use action descriptions like *sighs* or *looks frustrated*. Write ONLY plain chat text, no asterisks, no stage directions.
Keep responses under 2 sentences. After about 6-8 exchanges, say goodbye and end the conversation naturally.`,
  medium: `You are roleplaying as a customer in a {scenario} scenario. The student is practicing English for a chat-based call center job.
Use natural conversational language with some idioms. Be realistic.
IMPORTANT: Never use action descriptions like *sighs* or *looks frustrated*. Write ONLY plain chat text, no asterisks, no stage directions.
Keep responses 2-3 sentences. After about 6-8 exchanges, say goodbye and end the conversation naturally.`,
  hard: `You are roleplaying as a demanding customer in a {scenario} scenario. The student is practicing English for a chat-based call center job.
Be assertive, use sophisticated vocabulary, and create realistic pressure situations.
IMPORTANT: Never use action descriptions like *sighs* or *looks frustrated*. Write ONLY plain chat text, no asterisks, no stage directions.
After about 6-8 exchanges, say goodbye and end the conversation naturally.`,
};

export const openingMessages = {
  hotel_easy: "Hi! I want to check in please. My name is Wilson.",
  hotel_medium: "Good afternoon! I have a reservation under Wilson. I requested a quiet room away from the elevator, I hope that was noted?",
  hotel_hard: "Good afternoon. Reservation under James Wilson. I specifically requested a king suite with a city view. I trust everything is in order? I've had overbooking issues at other hotels before.",
  restaurant_easy: "Hi! Table for two please. We are very hungry!",
  restaurant_medium: "Hi! We have a reservation for Chen, party of two. Could we get a quieter table? We are celebrating our anniversary tonight.",
  restaurant_hard: "Good evening. Reservation under Chen. One of us is severely allergic to shellfish and also lactose intolerant. I want to review menu modifications before we sit down.",
  shopping_easy: "Excuse me! I am looking for a blue shirt in size medium. Can you help?",
  shopping_medium: "Hi! I saw a leather jacket in your window display. Do you still have it in medium? Also, what is your return policy?",
  shopping_hard: "Hi. Your associate told me last week you would be getting new Montblanc accessories in stock. I need a specific limited edition piece for a corporate gift. Can you help me?",
  interview_easy: "Hello! I am here for the job interview. Nice to meet you!",
  interview_medium: "Good morning! I am Sarah Thompson from HR. Thanks for coming in. Can you walk me through your background and why you applied for this role?",
  interview_hard: "Good morning. I am Sarah Thompson, HR Director. We have had a very strong pool of candidates. Let's get right into it — describe a specific conflict you had with a manager and how you resolved it.",
  support_easy: "Hello. My order is wrong. I am not happy about this.",
  support_medium: "Hi, I am calling about order number 45892. I ordered a laptop but got a completely different model. I need this fixed today, I have a presentation tomorrow.",
  support_hard: "I need to speak with a supervisor. Order 45892 — I ordered a premium laptop for a critical presentation tomorrow morning. I received the wrong item and your automated system has been useless for two hours. What are you going to do about this right now?",
};

export const evaluationPrompt = `You are an English language evaluator for a call center training program.
Review the following chat conversation between a student (playing the role of a call center agent) and an AI customer.
Evaluate ONLY the student's messages.
IMPORTANT: Ignore minor punctuation errors like missing periods, commas, or question marks. Focus heavily on structural grammar, spelling, use of apostrophes (e.g., don't vs dont), and overall coherence.
Provide ALL feedback text in SPANISH (español), but keep the JSON keys exactly as they are.

Return a JSON object with this exact structure, no extra text:
{
  "grammar": <number 0-100>,
  "coherence": <number 0-100>,
  "professionalism": <number 0-100>,
  "overall": <number 0-100>,
  "grammarFeedback": "<una oración específica en español sobre su gramática>",
  "coherenceFeedback": "<una oración específica en español sobre su coherencia y fluidez>",
  "professionalismFeedback": "<una oración específica en español sobre su tono y profesionalismo>",
  "strongPoint": "<una cosa que hicieron bien, en español>",
  "improvementTip": "<un consejo específico para mejorar, en español>"
}`;

// --- Grammar Test Data ---

export const grammarTopics = {
  tenses: { label: "Verb Tenses", icon: "⏳" },
  conditionals: { label: "Conditionals", icon: "🔀" },
  prepositions: { label: "Prepositions", icon: "📍" },
  phrasal: { label: "Phrasal Verbs", icon: "🧩" },
  articles: { label: "Articles & Nouns", icon: "📚" }
};

export const questionAmounts = [10, 15, 20];

export const grammarTestPrompt = `You are an expert English grammar teacher.
Generate a JSON array of {amount} grammar questions on the topic of "{topic}".
The questions should be a mix of "multiple-choice" and "fill-in-the-blank".

IMPORTANT: Return strictly a valid JSON array and nothing else.

Format:
[
  {
    "type": "multiple-choice",
    "question": "If I ___ you, I would study more.",
    "options": ["was", "were", "am", "be"],
    "correctAnswer": "were"
  },
  {
    "type": "fill-in-the-blank",
    "question": "She has been living here ___ 10 years.",
    "correctAnswer": "for"
  }
]`;

