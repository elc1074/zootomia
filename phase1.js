const fs = require('fs');
let content = fs.readFileSync('src/app/game/page.tsx', 'utf-8');

// Imports tokens
if (content.indexOf('import { tokens }') === -1) {
  content = content.replace('import { IMAGES', 'import { tokens } from "@/styles/tokens";\nimport { IMAGES');
}

// Add streak state
if (content.indexOf('setCurrentStreak') === -1) {
  content = content.replace('const [incorrectCount, setIncorrectCount] = useState(0);', 'const [incorrectCount, setIncorrectCount] = useState(0);\n  const [currentStreak, setCurrentStreak] = useState(0);\n  const [bestStreak, setBestStreak] = useState(0);\n  const [questionResults, setQuestionResults] = useState<("DIRECT" | "ALTERNATIVE" | "WRONG")[]>([]);');

  // Reset states
  content = content.replace('setIncorrectCount(0);', 'setIncorrectCount(0);\n    setCurrentStreak(0);\n    setBestStreak(0);\n    setQuestionResults([]);');

  // Handle direct correct answer
  content = content.replace('setFeedback("correct");\n      setScore((s) => s + 10);\n      setCorrectCount((c) => c + 1);', 
`setFeedback("correct");
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => { const n = c + 1; if (n > bestStreak) setBestStreak(n); return n; });
      setQuestionResults(r => [...r, "DIRECT"]);`);
  content = content.replace('setFeedback("correct");\r\n      setScore((s) => s + 10);\r\n      setCorrectCount((c) => c + 1);', 
`setFeedback("correct");
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => { const n = c + 1; if (n > bestStreak) setBestStreak(n); return n; });
      setQuestionResults(r => [...r, "DIRECT"]);`);

  // Handle alternative correct/wrong
  content = content.replace('setIncorrectCount((c) => c + 1);\n    }', 
`setIncorrectCount((c) => c + 1);
      setCurrentStreak(0);
      setQuestionResults(r => [...r, "WRONG"]);
    }`);
  content = content.replace('setIncorrectCount((c) => c + 1);\r\n    }', 
`setIncorrectCount((c) => c + 1);
      setCurrentStreak(0);
      setQuestionResults(r => [...r, "WRONG"]);
    }`);

  content = content.replace('setScore((s) => s + 5);\n      setCorrectCount((c) => c + 1);', 
`setScore((s) => s + 5);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => { const n = c + 1; if (n > bestStreak) setBestStreak(n); return n; });
      setQuestionResults(r => [...r, "ALTERNATIVE"]);`);
  content = content.replace('setScore((s) => s + 5);\r\n      setCorrectCount((c) => c + 1);', 
`setScore((s) => s + 5);
      setCorrectCount((c) => c + 1);
      setCurrentStreak((c) => { const n = c + 1; if (n > bestStreak) setBestStreak(n); return n; });
      setQuestionResults(r => [...r, "ALTERNATIVE"]);`);
}

fs.writeFileSync('src/app/game/page.tsx', content, 'utf-8');
