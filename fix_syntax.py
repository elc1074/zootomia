import sys

with open('src/app/game/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Replace the block from line 619 to 660 with the FinishedScreen call
new_finished_state = """      ) : (
        /* ─── FINISHED STATE ─── */
        <FinishedScreen
          questions={questions}
          questionResults={questionResults}
          score={score}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          bestStreak={bestStreak}
          cardFormat={cardFormat}
          setCardFormat={setCardFormat}
          handleReturnMenu={() => setShowExitModal(true)}
          language={language}
          especie={especie}
          t={t}
          playSame={() => {
            setQuestions(buildQuestions(IMAGES.filter((img) => img.especie === especie)));
            setQuestionIndex(0);
            setViewIndex(0);
            setScore(0);
            setCorrectCount(0);
            setIncorrectCount(0);
            setCurrentStreak(0);
            setBestStreak(0);
            setQuestionResults([]);
            setQuestionState("AWAITING_TEXT_ANSWER");
            setTextAnswer("");
            setEmptyError(false);
            setFeedback(null);
            setSelectedOption(null);
            setGameState("IN_PROGRESS");
          }}
        />
      )}
"""

# The line indices are 0-based.
# 619 is line index 618. 
# 660 is line index 659.
lines = lines[:618] + [new_finished_state] + lines[660:]

# 2. Fix the SpeciesSelector corruption.
# We need to find `        {especies.map((e) => (` inside SpeciesSelector and keep it up to `</select>`.
# Wait, the lines have shifted. Let's find SpeciesSelector and fix it by string replacement on the joined string.

content = "".join(lines)

corrupted_species_selector = """      >
        {especies.map((e) => (
          <option key={e} value={e} style={{ color: "#1A2E22" }}>
            {e}
          </option>
        ))}
      ) : (
        /* ─── FINISHED STATE ─── */"""

fixed_species_selector = """      >
        {especies.map((e) => (
          <option key={e} value={e} style={{ color: "#1A2E22" }}>
            {e}
          </option>
        ))}
      </select>
    </div>
  );
}"""

# We just truncate the content before `) : (\n        /* ─── FINISHED STATE ─── */` inside the SpeciesSelector
# Actually, the easiest way is to find the function `ScoreTile` and cut out everything between `        ))} \n` and `function ScoreTile`.
start_idx = content.find("        {especies.map((e) => (")
if start_idx != -1:
    end_map = content.find("        ))}", start_idx) + 11
    # Find next function (ScoreTile)
    score_tile_idx = content.find("function ScoreTile", end_map)
    if score_tile_idx != -1:
        content = content[:end_map] + "\n      </select>\n    </div>\n  );\n}\n\n" + content[score_tile_idx:]

with open('src/app/game/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

