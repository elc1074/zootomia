Zootomia — Software Specification
Version: 2.0
Status: Specification / Pre-implementation
Project: Zootomia
Platform: Desktop
Primary Technology: React + Next.js + TypeScript/JavaScript
Future Runtime: Electron
1. Specification Principles
This document is the single source of truth for the implementation of Zootomia.
The implementation must follow the requirements defined in this document.
1.1 General rules
The implementation must:
continue the existing Zootomia project instead of creating a new project;
preserve the existing React/Next.js architecture unless this specification explicitly requires a change;
use TypeScript/JavaScript;
preserve the existing visual identity when this specification does not explicitly require a visual change;
support bilingual interfaces (Portuguese and Spanish) via a global language selector in the Main Menu;
reuse existing components, styles, assets, and project conventions when they are compatible with this specification;
avoid introducing functionality that is not specified;
avoid removing existing functionality unless this specification explicitly requires its removal;
avoid making assumptions about unspecified behavior when that behavior can affect the user experience or application architecture.
When an implementation decision is required and this specification does not define the expected behavior, the decision must be treated as an open question rather than silently invented by the implementer.
2. Project Overview
Zootomia is a desktop-oriented educational quiz game designed to support the study of the anatomy of domestic animals.
The initial scope focuses on:
dogs;
cats;
anatomical models, primarily bones;
identification of anatomical structures through images.
The target audience is students in the second semester of Veterinary Medicine. The system already has an initial interface implemented using React and Next.js. The new implementation must continue from the existing project. The application will eventually be encapsulated using Electron.
3. Platform and Technical Constraints
3.1 Current environment
The application currently runs as a web application using:
React;
Next.js;
TypeScript and/or JavaScript.
The existing project structure must be preserved whenever possible.
3.2 Future Electron compatibility
The application will eventually be packaged using Electron. Features that interact with the operating system, especially the Exit function, must therefore be implemented in a way that allows integration with Electron. The implementation must not introduce browser-only behavior that would prevent the future Electron integration.
3.3 Desktop target
The application is intended for desktop use. Mobile-specific layouts and interactions are not part of the current scope. The interface must remain usable when the desktop application window is resized, unless the existing project explicitly establishes a fixed-window behavior.
4. Global Navigation
The application contains four primary screens:
Main Menu
Game
Gallery
About
4.1 Navigation map
Current Screen
User Action
Destination
Main Menu
Click "Jogar"
Game
Main Menu
Click "Galeria"
Gallery
Main Menu
Click "Sobre"
About
Main Menu
Click "Sair" and confirm
Application exit
Game
Return to main menu
Main Menu
Gallery
Return to main menu
Main Menu
About
Return to main menu
Main Menu

4.2 Navigation restrictions
The Game screen has special navigation behavior when a game is in progress. Leaving an active game requires user confirmation because the current game progress will be discarded. Leaving the Game screen after the game has finished does not require confirmation.
5. FEATURE 1 — Main Menu
5.1 Purpose
The Main Menu is the initial screen of the game and acts as the primary navigation interface. The screen must provide four actions:
Jogar
Galeria
Sobre
Sair
5.2 Existing visual identity
The existing Main Menu visual identity must be preserved. The implementation must maintain:
the existing green color palette;
the existing earthy beige color palette;
the existing dog image used as decoration;
the existing overall visual composition, except where this specification explicitly requires a change.
The existing assets should be reused rather than replaced with newly generated assets.
5.3 Visible content
The Main Menu must display only the content necessary for the menu. The following elements must be present:
game title;
current game version;
"Jogar" button;
"Galeria" button;
"Sobre" button;
"Sair" button;
a language toggle button (PT/ES) in the top right corner.
No additional explanatory or decorative text should be introduced.
5.4 Menu interactions
The user must be able to activate all menu actions using the mouse.
Language Toggle
When the user clicks the language toggle:
the application language must switch between Portuguese and Spanish;
the change must reflect immediately across the entire application interface and content.
Jogar
When the user clicks Jogar:
a new game must be started;
the user must be taken to the Game screen.
Galeria
When the user clicks Galeria:
the user must be taken to the Gallery screen.
Sobre
When the user clicks Sobre:
the user must be taken to the About screen.
Sair
When the user clicks Sair:
the application must not immediately close;
an exit confirmation modal must be displayed.
The modal must ask:
Tem certeza de que deseja sair?
The user must be given a way to:
confirm exiting;
cancel exiting.
If the user cancels, the modal must close and the Main Menu must remain visible. If the user confirms, the application must execute the application's exit behavior.
5.5 Electron compatibility
The exit behavior must be implemented behind an abstraction or integration point that can later be connected to the Electron application's window/application close command. The UI must not depend directly on an Electron-specific API unless the existing architecture already provides such an integration;
No-op during browser development.
6. FEATURE 1 — Acceptance Criteria
AC-1. Main Menu availability
GIVEN the application is started
WHEN the initial screen is displayed
THEN the Main Menu must be displayed.
AC-2. Required menu actions
GIVEN the Main Menu is displayed
THEN it must contain exactly these four primary action buttons:
Jogar
Galeria
Sobre
Sair
AC-3. Game navigation
GIVEN the user is on the Main Menu
WHEN the user clicks "Jogar"
THEN the Game screen must be displayed.
AC-4. Gallery navigation
GIVEN the user is on the Main Menu
WHEN the user clicks "Galeria"
THEN the Gallery screen must be displayed.
AC-5. About navigation
GIVEN the user is on the Main Menu
WHEN the user clicks "Sobre"
THEN the About screen must be displayed.
AC-6. Exit confirmation
GIVEN the user is on the Main Menu
WHEN the user clicks "Sair"
THEN an exit confirmation modal must be displayed containing:
Tem certeza de que deseja sair?
AC-7. Cancel exit
GIVEN the exit confirmation modal is displayed
WHEN the user cancels the action
THEN the application must remain open and the Main Menu must remain available.
AC-8. Confirm exit
GIVEN the exit confirmation modal is displayed
WHEN the user confirms the action
THEN the application's exit mechanism must be invoked.
7. FEATURE 2 — Game
7.1 Purpose
The Game screen is the primary interactive component of Zootomia.
The player receives an image of an anatomical model belonging to a dog or cat and must identify the anatomical structure represented by the image. The game primarily uses anatomical bone models.
7.2 Game flow
Each question follows this general sequence:
Display an anatomical image.
Allow the player to enter an answer using a text input.
Evaluate the textual answer.
If the textual answer is correct:
award 10 points;
mark the question as correctly answered;
continue to the next question.
If the textual answer is incorrect:
display four answer alternatives;
exactly one alternative must be correct;
allow the player to select one alternative.
If the selected alternative is correct:
award 5 points;
mark the question as correctly answered.
If the selected alternative is incorrect:
award 0 points;
mark the question as incorrectly answered.
Continue until all questions have been answered.
Display the final result.
7.3 Text answer
The player must initially be presented with a text input field. The player may submit one textual answer for each question.
Text-answer attempt limit
The specification defines the first textual response as the initial attempt. After an incorrect textual answer, the player proceeds to the alternative-answer stage. The player must not receive additional textual attempts for the same question unless this specification is changed.
7.4 Text answer evaluation
The system must compare the player's textual answer with the correct answer associated with the question. The following normalization rules apply:
leading and trailing whitespace must not affect the result;
uppercase and lowercase differences must not affect the result.
accents/diacritics must not affect the result.
For example, if the correct answer is Fêmur:
Fêmur → correct;
fêmur → correct;
Femur → correct.
7.5 Alternative answers
After an incorrect textual response, exactly four alternatives must be displayed.
The alternatives must contain:
one correct answer;
three incorrect answers.
The user may select exactly one alternative. After an alternative is selected, the question is considered answered. The alternatives must not allow multiple selections.
Alternative ordering
The order of alternatives must be randomized for each game.
Alternative generation
The three incorrect alternatives (distractors) must be generated dynamically by randomly selecting the names of other anatomical structures mapped in the same image currently being played.
8. Game Scoring
8.1 Initial score
A new game starts with 0 points
8.2 Direct answer
A correct textual answer awards +10 points
8.3 Alternative answer
A correct alternative answer awards +5 points
8.4 Incorrect answer
An incorrect alternative answer awards +0 points
The score must never decrease because of an incorrect answer.
8.5 New game
Starting a new game resets:
score;
number of correct answers;
number of incorrect answers;
current question;
current question state.
No information from the previous game may affect the new game's score or result.
9. Game Interface
The existing layout places the anatomical image on the left side and the answer controls on the right side. This arrangement must be preserved.
9.1 Image area
The anatomical model image must be displayed on the left side of the Game screen.
9.2 Interaction area
The following controls must be displayed on the right side:
text-answer input;
text-answer submission control;
alternatives when applicable.
9.3 Game status
The upper area of the game interface must display:
current question number;
number of questions remaining;
current score.
The implementation may choose the exact visual arrangement as long as all three pieces of information are clearly visible.
9.4 Unnecessary text
The Game screen must not contain explanatory text that is not necessary for the game interaction. The interface should prioritize:
question/game status;
answer controls;
required navigation;
result information.
10. Game State
The game must maintain, at minimum, the following state:
current question;
total number of questions;
number of questions remaining;
current score;
number of correct answers;
number of incorrect answers;
current question state.
A question must have one of the following conceptual states:
AWAITING_TEXT_ANSWER
SHOWING_ALTERNATIVES
ANSWERED
The game itself must have at least these conceptual states:
IN_PROGRESS
FINISHED
11. Game Result
After the last question has been answered, the game must enter the FINISHED state.
The final result must display:
final score;
total number of correct answers;
total number of incorrect answers;
a visual chart representing correct and incorrect answers.
The chart must use:
green for correct answers;
red for incorrect answers.
11.1 Result interpretation
A question is considered correct if the player ultimately identifies the correct anatomical structure.
Therefore:
correct textual answer → correct;
incorrect textual answer followed by correct alternative → correct;
incorrect textual answer followed by incorrect alternative → incorrect.
The initial incorrect textual attempt does not independently count as an incorrect question if the player subsequently selects the correct alternative.
12. Return to Main Menu During a Game
The Game screen must contain a control allowing the player to return to the Main Menu.
12.1 Active game
If the game is in progress, clicking the return control must open a confirmation modal.
The modal must ask:
Tem certeza de que deseja voltar à tela principal? Seu progresso não será salvo.
The modal must provide options to:
cancel;
confirm returning to the Main Menu.
If the player cancels:
the modal must close;
the current game must remain unchanged.
If the player confirms:
the current game must be abandoned;
its progress must not be saved;
the user must be taken to the Main Menu.
12.2 Finished game
If the game has already finished:
clicking the return control must immediately take the player to the Main Menu;
no confirmation modal must be displayed.
13. Game Persistence
Game progress must not be persisted in this version.
When a game is abandoned:
score is discarded;
question progress is discarded;
correct/incorrect counts are discarded.
When the player starts another game, it must begin as a new game.
14. Game Question Data
Each game question must provide, at minimum:
a unique identifier;
an anatomical image;
the correct anatomical answer;
a species association;
sufficient information to generate/display the alternative answers.
The data is centralized in a TypeScript database (`src/data/anatomy.ts`), which exports an array of `AnatomyImage` objects.
Conceptually:
AnatomyImage
├── id
├── titulo
├── especie
├── src
├── fonte
└── markers (Array of Marker)
    ├── name (canonical answer)
    ├── aceita (array of synonyms/alternate spellings)
    ├── x
    └── y
Text answers should be evaluated by checking both the `name` and the `aceita` list.
15. Number and Selection of Questions
The game groups questions by species rather than a single image. The interface must provide a Species Selector allowing the user to select an animal model (e.g. Canis lupus familiaris). The game displays questions for all mapped anatomical structures belonging to the selected species, randomly ordered. Changing the species resets the game progress and score. 
Multi-view support: If the same anatomical structure is mapped across multiple images of the selected species (e.g., dorsal view and lateral view), the game must provide UI controls allowing the player to toggle between the different available viewing angles for that structure to aid identification.
16. Feature 2 — Acceptance Criteria
AC-2.1 Initial question
GIVEN the player starts a new game
THEN the first question must be displayed
AND the score must be 0
AND the correct/incorrect counters must be 0.
AC-2.2 Question image
GIVEN a question is active
THEN its anatomical image must be displayed on the left side of the game interface.
AC-2.3 Text response
GIVEN a question is active
THEN the player must be able to enter an answer using the text field.
AC-2.4 Correct text answer
GIVEN the player submits a correct textual answer
THEN the player's score must increase by 10 points
AND the question must be counted as correct
AND the next question must become active.
AC-2.5 Incorrect text answer
GIVEN the player submits an incorrect textual answer
THEN the system must display four alternatives
AND exactly one alternative must be correct.
AC-2.6 Correct alternative
GIVEN four alternatives are displayed
WHEN the player selects the correct alternative
THEN the player's score must increase by 5 points
AND the question must be counted as correct
AND the next question must become active.
AC-2.7 Incorrect alternative
GIVEN four alternatives are displayed
WHEN the player selects an incorrect alternative
THEN the player's score must not increase
AND the question must be counted as incorrect
AND the next question must become active.
AC-2.8 Game status
GIVEN a game is in progress
THEN the interface must display the current question number, questions remaining, and current score.
AC-2.9 Final result
GIVEN the final question has been answered
THEN the game must display the final score, correct answers, incorrect answers, and a chart representing the results.
AC-2.10 Result colors
GIVEN the final result is displayed
THEN correct answers must be represented using green
AND incorrect answers must be represented using red.
AC-2.11 Return from active game
GIVEN a game is in progress
WHEN the player clicks the return-to-menu control
THEN a confirmation modal must be displayed.
AC-2.12 Cancel return
GIVEN the return confirmation modal is displayed
WHEN the player cancels
THEN the game must remain unchanged.
AC-2.13 Confirm return
GIVEN the return confirmation modal is displayed
WHEN the player confirms
THEN the game must be abandoned
AND its progress must not be saved
AND the Main Menu must be displayed.
AC-2.14 Return after game completion
GIVEN the game has finished
WHEN the player clicks the return-to-menu control
THEN the Main Menu must be displayed without a confirmation modal.
17. FEATURE 3 — Gallery
17.1 Purpose
The Gallery allows the player to study the anatomical models outside of the quiz. The Gallery must display anatomical model images in a grid.
17.2 Gallery grid
The images must be displayed as thumbnails. The intended layout is 3 images per row. The gallery must automatically display all available playable anatomical images directly from the central database (`src/data/anatomy.ts`), rather than relying on hardcoded static placeholders. The implementation must support additional images being added to the database without requiring changes to the grid logic.
17.3 Gallery title
The screen must display the title: Galeria. No unnecessary explanatory text should be added.
17.4 Image selection
When the player clicks a thumbnail:
the selected image must open in an enlarged viewer;
the player must be able to navigate to the previous image;
the player must be able to navigate to the next image;
the player must be able to close the enlarged viewer.
17.5 Enlarged viewer
The enlarged image must:
preserve its original aspect ratio;
fit within the available viewing area;
not be distorted.
The viewer must provide:
previous-image control;
next-image control;
close control.
17.6 Image navigation
The previous control must display the previous image in the gallery sequence.
The next control must display the next image in the gallery sequence. The behavior when the user reaches the first or last image is navigation loops back to the opposite end.
17.7 Return to Main Menu
The Gallery must contain a control allowing the player to return to the Main Menu. Clicking this control must navigate directly to the Main Menu. No confirmation is required because no game progress is being discarded.
18. Feature 3 — Acceptance Criteria
AC-3.1 Gallery access
GIVEN the player is on the Main Menu
WHEN the player clicks "Galeria"
THEN the Gallery screen must be displayed.
AC-3.2 Gallery title
GIVEN the Gallery screen is displayed
THEN the title "Galeria" must be visible.
AC-3.3 Thumbnail grid
GIVEN the Gallery screen is displayed
THEN available gallery images must be displayed as thumbnails
AND the layout must use three images per row.
AC-3.4 Image selection
GIVEN the Gallery grid is displayed
WHEN the player clicks a thumbnail
THEN the selected image must be displayed in an enlarged viewer.
AC-3.5 Next image
GIVEN the enlarged viewer is displayed
WHEN the player activates the next-image control
THEN the next image in the gallery sequence must be displayed.
AC-3.6 Previous image
GIVEN the enlarged viewer is displayed
WHEN the player activates the previous-image control
THEN the previous image in the gallery sequence must be displayed.
AC-3.7 Close viewer
GIVEN the enlarged viewer is displayed
WHEN the player activates the close control
THEN the enlarged viewer must close
AND the Gallery grid must be displayed.
AC-3.8 Return to menu
GIVEN the player is on the Gallery screen
WHEN the player activates the return-to-menu control
THEN the Main Menu must be displayed.
19. FEATURE 4 — About
19.1 Purpose
The About screen provides information about the general operation and purpose of Zootomia.
The screen does not contain game functionality.
19.2 Content
The screen must contain an explanatory text about the general operation of the system that has not been defined yet.
19.3 Navigation
The About screen must contain a control allowing the user to return to the Main Menu. Clicking the control must navigate directly to the Main Menu.
20. Feature 4 — Acceptance Criteria
AC-4.1 About access
GIVEN the player is on the Main Menu
WHEN the player clicks "Sobre"
THEN the About screen must be displayed.
AC-4.2 About content
GIVEN the About screen is displayed
THEN the specified About content must be visible.
AC-4.3 About return
GIVEN the player is on the About screen
WHEN the player activates the return-to-menu control
THEN the Main Menu must be displayed.
21. Assets
The implementation must use the final image assets provided in the project:
Main Menu dog image;
anatomical model images for the Game and Gallery (located in `public/images/bones/`);
The exact asset filenames and locations are defined in `src/data/anatomy.ts`.

21.5 FEATURE 5 — Annotate Tool
21.5.1 Purpose
The application contains an internal development/teacher tool available at `/annotate`. This tool allows users to load anatomical images and visually map the (x, y) coordinates for new structures.
21.5.2 Usage
This feature is intended for internal data generation and does not need to be accessible from the Main Menu.
22. UI and Visual Requirements
22.1 Existing design
The existing visual design is the baseline for the application.
The implementation must preserve:
existing typography where appropriate;
existing color palette;
existing visual hierarchy;
existing image treatment;
existing component styling conventions.
Changes should be made only when required by this specification.
22.2 Unnecessary content
Do not add:
explanatory paragraphs where they are not required;
decorative text;
placeholder labels;
debug information;
technical information intended only for developers.
23. Interaction and Accessibility
The current specification explicitly requires mouse interaction.
24. Error and Edge Cases
24.1 Empty text answer
The player must not be able to submit an empty textual answer. An empty input should be caught before answer evaluation. If the player tries to send an empty answer, a text appears under the input box “É necessário fornecer uma resposta”.
24.2 Missing image
If a question references an image that cannot be loaded, the application must not crash. Where the image should be appearing, appears the text “Falha ao carregar imagem” instead.
24.3 Invalid question data
If a question does not contain sufficient information to display or evaluate the question, the application must not silently produce an invalid question. The behavior for invalid question data should be handled as a development/data integrity error.
24.4 Browser refresh during game
The specification states that game progress is not persisted. Therefore, a browser refresh or application reload during an active game may result in the current game being lost. No persistence mechanism should be introduced solely to preserve the game across refreshes.
25. Persistence
No player account or game-progress persistence is required for the current version.
The system does not require:
user accounts;
authentication;
online synchronization;
saved game progress;
player profiles;
rankings.
26. Out of Scope
The following features are outside the scope of this specification:
user registration;
user login;
social login;
authentication;
online multiplayer;
local multiplayer;
player ranking;
achievements;
saved game progress;
cloud synchronization;
online database integration;
password management;
two-factor authentication;
mobile-specific interface;
final Electron packaging/distribution;
features not explicitly defined in this specification.
Electron compatibility is required where explicitly stated, but the final Electron packaging process is not part of this implementation.
27. Implementation Constraints
The implementation must:
Continue the existing project.
Use the existing Next.js/React application.
Use TypeScript/JavaScript.
Preserve existing design conventions.
Reuse existing assets where applicable.
Avoid unnecessary dependencies.
Avoid unnecessary architectural rewrites.
Avoid implementing unspecified features.
Keep game logic separate from presentation where consistent with the existing architecture.
Keep operating-system-specific behavior abstracted so that Electron integration can be added without redesigning the user-facing feature.
28. Definition of Done
A feature is considered implemented when:
all acceptance criteria for the feature pass;
the specified navigation works;
the required visual elements are present;
no specified functionality is missing;
no specified functionality is contradicted;
the existing application continues to run;
existing unrelated functionality is not broken;
no placeholder implementation remains for a required feature;
no requirement has been satisfied through an undocumented assumption.
For the Game feature specifically:
a complete question can be answered through the text field;
an incorrect text answer transitions to the alternatives;
the alternatives correctly award 5 or 0 points;
score tracking works;
correct/incorrect counts work;
the final result is displayed;
returning to the menu behaves differently depending on whether the game is active or finished.
29. Open Questions / Implementation Blockers
None. All prior blockers (Alternative generation rules and Missing image assets) have been successfully resolved during implementation.

30. Pre-Implementation Requirement
Before implementation begins, the implementer must confirm understanding of:
the global project requirements;
the navigation model;
the Main Menu behavior;
the Game flow;
the scoring rules;
the final result rules;
the Gallery behavior;
the About screen requirements;
the persistence rules;
the Electron compatibility requirements.
If any requirement remains ambiguous after reviewing this specification, implementation must pause and the ambiguity must be reported as an open question. The implementer must not resolve a functional ambiguity by making an undocumented assumption.
