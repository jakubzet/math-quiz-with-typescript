// Interfaces declarations
interface nameInputInterface {
  node: HTMLElement;
  action: Function;
}

interface stateType {
  score: number;
  questionNo: number;
  questions: Array<string>;
  playerName: string;
  timePassed: number;
  currentQuestion: string;
  currentTimer: number;
  timeRemaining: number;
  quizActive: boolean;
  nameEntryPossible: boolean;
  [propName: string]: string | number | boolean | Array<string> | undefined;
}

interface configType {
  QUESTION_TIMEOUT?: number;
  NUMBER_OF_ANSWERS?: number;
  NUMBER_OF_QUESTIONS?: number;
  APP_CONTAINER?: HTMLElement;
  NUMBER_OF_BEST_RESULTS?: number;
}

interface highScoresEntryType {
  name: string;
  score: number;
}

interface containersType {
  [propName: string]: HTMLElement;
}

interface controlsType {
  [propName: string]: Function;
}

// Class declaration
class MathQuiz {
  CONFIG: configType = {
    QUESTION_TIMEOUT: null,
    NUMBER_OF_ANSWERS: null,
    NUMBER_OF_QUESTIONS: null,
    APP_CONTAINER: null,
    NUMBER_OF_BEST_RESULTS: null,
  };
  containers: containersType = {};
  controls: controlsType = {};
  nameInput: nameInputInterface = {
    node: null,
    action: null,
  };
  highScores: Array<highScoresEntryType> = [];
  state: stateType = {
    score: null,
    questionNo: null,
    questions: null,
    playerName: null,
    timePassed: null,
    currentQuestion: null,
    currentTimer: null,
    timeRemaining: null,
    quizActive: null,
    nameEntryPossible: null,
  };

  /**
   * Quiz constructor
   * @method constructor
   * @param  quizConfig  configuration settings (optional)
   */
  constructor(quizConfig?: configType) {
    const baseConfig = {
      QUESTION_TIMEOUT: 10,
      NUMBER_OF_ANSWERS: 4,
      NUMBER_OF_QUESTIONS: 5,
      APP_CONTAINER: document.getElementById("quiz"),
      NUMBER_OF_BEST_RESULTS: 15,
    };
    const userConfig = quizConfig || {};
    // App config with constants
    this.CONFIG = Object.freeze({ ...baseConfig, ...userConfig });
  }

  /**
   * Return initial game state
   * @method _getInitialState
   * @return Object of stateType with default state values
   */
  _getInitialState(): stateType {
    return {
      score: 0,
      questionNo: 0,
      questions: [],
      playerName: "Anonymous",
      timePassed: 0,
      currentQuestion: "",
      currentTimer: null,
      timeRemaining: this.CONFIG.QUESTION_TIMEOUT,
      quizActive: false,
      nameEntryPossible: false,
    };
  }

  /**
   * Helper for transforming names into IDs
   * @method _normalizeName
   * @param  str            name of container
   * @return                normalized name string
   */
  _normalizeName(str: string): string {
    return str.toLowerCase().replace(/ /gim, "-");
  }

  /**
   * Makes container for any of the quiz components
   * @method _prepareContainer
   * @param  name                        name of the container - will be needed in every you'll need to get that container
   * @param  hasLabel                    should label be inserted into container
   * @param  content                     child HTMLelement
   * @param  addedCSSClassesForChild     additional CSS classes for container child
   * @param  addedCSSClassesForContainer additional CSS classes for container itself
   * @param  innerHTML                   inner HTML if in string form
   */
  _prepareContainer(
    name: string,
    hasLabel: boolean = true,
    // FIXME
    content: DocumentFragment | HTMLElement,
    addedCSSClassesForChild: string,
    addedCSSClassesForContainer: string,
    innerHTML?: string,
  ): void {
    const normalizedName = this._normalizeName(name);
    const ID = "" + normalizedName;
    const nameClass = "mathQuiz__" + normalizedName;
    const innerClasses = addedCSSClassesForChild ? addedCSSClassesForChild : "";
    const outerClasses = addedCSSClassesForContainer
      ? addedCSSClassesForContainer
      : "";
    const innerHTMLtoAdd = innerHTML ? innerHTML : "";
    const containerLabel = hasLabel ? "<p>" + name + "</p>" : "";
    const containerInner =
      '<div id="' +
      ID +
      '" class="' +
      innerClasses +
      '">' +
      innerHTMLtoAdd +
      "</div>";

    let container = '<div class="' + nameClass + " " + outerClasses + '">';

    container += containerLabel;
    container += containerInner;
    container += "</div>";

    this.CONFIG.APP_CONTAINER.innerHTML += container;
    this.containers[normalizedName] = document.getElementById(ID);

    if (content) {
      if (typeof content === "string") {
        // TODO - unify content and innerHTML params
      } else if (typeof content === "object" && content.nodeType) {
        this.containers[normalizedName].appendChild(content);
      }
    }
  }

  /**
   * Updates container child element
   * @method _updateContainerValue
   * @param  name                  name of the container which should be updated
   * @param  newValue              nev child or innerHTML of the container
   */
  _updateContainerValue(name: string, newValue: any): void {
    const targetDomElement = document.getElementById(name);
    targetDomElement.innerHTML = "";
    // FIXME
    if (typeof newValue === "object") {
      targetDomElement.appendChild(newValue);
    } else {
      targetDomElement.innerHTML = newValue;
    }
  }

  /**
   * Update style of the container element
   * @method _updateContainerStyle
   * @param  name                  name of the selected container
   * @param  cssName               CSS property name
   * @param  cssNewValue           CSS property value
   */
  _updateContainerStyle(
    name: string,
    cssName: string,
    cssNewValue: string,
  ): void {
    const targetDomElement: HTMLElement = document.getElementById(name);
    targetDomElement.style.setProperty(cssName, cssNewValue);
  }

  /**
   * [_updateStateAndContainer description]
   * @method _updateStateAndContainer
   * @param  value                    [description]
   * @param  stateName                [description]
   * @param  containerName            [description]
   */
  _updateStateAndContainer(
    value: any,
    stateName: string,
    containerName: string,
  ): void {
    this.state[stateName] = value;
    this._updateContainerValue(containerName, value);
  }

  /**
   * Clears question timer and hides graphical time progress bar
   * @method _quitTimer
   */
  _quitTimer(): void {
    if (this.state.currentTimer) {
      this.state.timePassed = 0;
      this.state.timeRemaining = this.CONFIG.QUESTION_TIMEOUT;
      // Reset timer and add remaining time as a bonus score
      this._updateContainerStyle(
        "time-counter",
        "transform",
        "translate3d(-100%, 0, 0)",
      );
      clearInterval(this.state.currentTimer);
    }
  }

  /**
   * Starts question timer and shows time progress bar if needed
   * @method _startTimer
   */
  _startTimer(): void {
    const timeLimit = this.CONFIG.QUESTION_TIMEOUT;
    this._updateContainerValue("time", timeLimit);
    this._quitTimer();
    this.state.currentTimer = setInterval(() => {
      this._updateContainerStyle(
        "time-counter",
        "transform",
        "translate3d(-" +
          (timeLimit - this.state.timePassed - 1) * 10 +
          "%, 0, 0)",
      );
      this.state.timePassed += 1;
      this.state.timeRemaining -= 1;
      this._updateContainerValue("time", timeLimit - this.state.timePassed);
      if (this.state.timePassed === timeLimit + 1) {
        clearInterval(this.state.currentTimer);
        this.state.timeRemaining = 0;
        this.state.timePassed = 0;
        console.log("TIME PASSED!");
        this._giveAnswer(0, false);
      }
    }, 1000);
  }

  /**
   * Process answer from player
   * @method _giveAnswer
   * @param  pointsToAdd        calculated value of points to be added
   * @param  shouldAddTimeBonus bool stating if time bonus points should be added
   */
  _giveAnswer(pointsToAdd: number, shouldAddTimeBonus: boolean): void {
    // Summary of points gained for current question
    const timeBonus: number = shouldAddTimeBonus ? this.state.timeRemaining : 0;

    // Alter scores
    this._updateStateAndContainer(
      this.state.score + pointsToAdd + timeBonus,
      "score",
      "score",
    );

    // End quiz or move to next question
    if (this.state.questionNo === this.CONFIG.NUMBER_OF_QUESTIONS) {
      this._endQuiz();
    } else {
      this._setQuestionAndAnswers(this.state.questionNo);
      this._startTimer();
    }
  }

  /**
   * Helper for generating answers
   * @method _generateRandomAnswer
   * @param  correct               correct value
   * @param  diff                  margin for generating other answers
   * @return                       answer as number
   */
  _generateRandomAnswer(correct: number, diff: number): number {
    return Math.floor(
      Math.random() * (correct + diff - (correct - diff)) + (correct - diff),
    );
  }

  /**
   * Create answer buttons
   * @method _createAnswers
   * @param  question       math equation in string form which will become a question
   * @return                document fragment containing answer buttons
   */
  _createAnswers(question: string): DocumentFragment {
    // Creating container and answers values
    const answersContainer = document.createDocumentFragment();

    // TODO
    // Replace eval
    const correctAnswer = eval(question);
    const answerDifference = 20;

    let allAnswers = [correctAnswer];
    let i = 0;
    let answerButton;
    let answerProposition;
    let correctAnswerIndex;

    // Create other answers values
    while (i < this.CONFIG.NUMBER_OF_ANSWERS - 1) {
      answerProposition = this._generateRandomAnswer(
        correctAnswer,
        answerDifference,
      );
      if (allAnswers.indexOf(answerProposition) === -1) {
        allAnswers.push(answerProposition);
        i = i + 1;
      }
    }

    // Shuffle answers
    allAnswers = allAnswers.sort(() => 0.5 - Math.random());

    // Get index of correct answer
    correctAnswerIndex = allAnswers.indexOf(correctAnswer);

    // Adding answers to container
    for (let j = 0; j < this.CONFIG.NUMBER_OF_ANSWERS; j++) {
      answerButton = document.createElement("button");
      answerButton.className = "button is-large";
      answerButton.textContent = allAnswers[j].toString();

      // Attach event to good and bad answer
      if (j === correctAnswerIndex) {
        answerButton.addEventListener(
          "click",
          this._giveAnswer.bind(this, 10, true),
        );
      } else {
        answerButton.addEventListener(
          "click",
          this._giveAnswer.bind(this, 0, false),
        );
      }

      // Add answers buttons
      answersContainer.appendChild(answerButton);
    }

    // Returning container
    return answersContainer;
  }

  /**
   * Show question and possible answers to user
   * @method _setQuestionAndAnswers
   * @param  questionNumber         index of question from list to show
   */
  _setQuestionAndAnswers(questionNumber: number): void {
    // Show new question
    this._updateStateAndContainer(
      this.state.questions[questionNumber].toString(),
      "currentQuestion",
      "question",
    );

    // Display answers
    this._updateContainerValue(
      "answers",
      this._createAnswers(this.state.questions[questionNumber]),
    );

    // Show question number
    this._updateStateAndContainer(
      this.state.questionNo + 1,
      "questionNo",
      "question-number",
    );
  }

  /**
   * Prepares high score tables and shows screen
   * @method _showHighScores
   */
  _showHighScores(): void {
    if (!this.state.nameEntryPossible) {
      return;
    }

    const playerName = this.state.playerName.trim() || "Anonymous";
    const results = this.state.score;

    // Add result to quiz database
    this.highScores.push({
      name: playerName,
      score: results,
    });

    // Re-sort the highscores data
    this.highScores = this.highScores.sort((p, n) => {
      return n.score - p.score;
    });

    // Create needed DOM nodes for list
    const listContainer = document.createDocumentFragment();
    const list = document.createElement("ul");
    list.classList.add("resultsTable");

    // Make list
    this.highScores.forEach(i => {
      let listEntry = document.createElement("li");

      // Add results
      let resultsNode = document.createElement("span");
      resultsNode.classList.add("score");
      resultsNode.textContent = i.score + " points";

      // Add player
      let nameNode = document.createElement("span");
      nameNode.classList.add("name");
      nameNode.textContent = i.name;

      // Add name and results to list item
      listEntry.appendChild(resultsNode);
      listEntry.appendChild(nameNode);
      list.appendChild(listEntry);
    });

    // Update high scores container
    this._updateContainerValue("top-results", list);

    // Show high scores screen
    this._switchScreen(3);

    // Disable name input
    this.state.nameEntryPossible = false;
  }

  /**
   * Clears input with name entry
   * @method _clearNameInput
   */
  _clearNameInput(): void {
    const nameInput: HTMLInputElement = <HTMLInputElement>document.getElementById(
      this.nameInput.node.id,
    );
    nameInput.value = "";
    nameInput.focus();
  }

  /**
   * Update high scores table
   * @method _updateHighScores
   * @param  name              [description]
   * @param  results           [description]
   */
  _updateHighScores(name: string, results: number): void {
    // High score omitting requirements
    const noResultsOrPlayerName = results <= 0 || name.length < 3;
    const notEnoughPoints =
      this.highScores.length > 0 &&
      this.highScores.reverse()[0].score >= results;
    const listIsFull =
      this.highScores.length >= this.CONFIG.NUMBER_OF_BEST_RESULTS;

    if (noResultsOrPlayerName || notEnoughPoints || listIsFull) {
      // Show intro screen
      this._switchScreen(0);
      return;
    }

    // Enable name input
    this.state.nameEntryPossible = true;

    // Show name entry screen
    this._switchScreen(2);

    // Clear name input
    this._clearNameInput();
  }

  /**
   * Ending quiz
   * @method _endQuiz
   * @return [description]
   */
  _endQuiz(): void {
    // Resetting timer
    this._quitTimer();

    // Enable restarting quiz
    this.state.quizActive = false;

    // Update high scores table
    this._updateHighScores(this.state.playerName, this.state.score);
  }

  /**
   * Switch the currently visible screens
   * @method _switchScreen
   * @param  screenNumber  index number of screen to be shown
   */
  _switchScreen(screenNumber: number): void {
    // Get current classes of container
    const currentScreenClasses = this.CONFIG.APP_CONTAINER.className;

    // Alter current classes to demanded ones
    const nextScreenClasses = currentScreenClasses.replace(
      /screen[0-9]/,
      "screen" + screenNumber,
    );

    // Replace classes
    this.CONFIG.APP_CONTAINER.className = nextScreenClasses;
  }

  /**
   * Generating array of random questions
   * @method _generateQuestions
   * @return array of strings containing question
   */
  _generateQuestions(): string[] {
    const questionsArray: string[] = [];
    const generateInt = (): number => Math.ceil(Math.random() * 10);
    // FIXME add enum
    const operations = ["+", "-", "/", "*"];
    const getRandomOperation = (opArr: Array<string>): string =>
      opArr[Math.floor(Math.random() * opArr.length)];

    for (let i = 0; i < this.CONFIG.NUMBER_OF_QUESTIONS; i++) {
      const question =
        "" +
        generateInt() +
        getRandomOperation(operations) +
        generateInt() +
        "";
      questionsArray.push(question);
    }

    return questionsArray;
  }

  /**
   * Starting the quiz
   * @method _startQuiz
   */
  _startQuiz(): void {
    if (this.state.quizActive) {
      return;
    }

    // Resetting state
    this.state = this._getInitialState();

    // Show app
    this._switchScreen(1);

    // Questions list
    this.state.questions = this._generateQuestions();

    // Display question
    this._setQuestionAndAnswers(this.state.questionNo);

    // Set score
    this._updateContainerValue("score", this.state.score);

    // Start timer
    this._startTimer();

    // Block restarting
    this.state.quizActive = true;
  }

  /**
   * Create buttons with event handlers
   * @method _createControls
   * @param  name              name of the control component
   * @param  functionName      function to be called after component interaction
   * @param  additionalClasses CSS classes to be added to the control component
   * @return                   document fragment with app controls
   */
  _createControls(
    name: string,
    functionName: Function,
    additionalClasses: string = "",
  ): DocumentFragment {
    // Creating container and button
    const controlName = this._normalizeName(name);
    const classNames = "button " + additionalClasses;
    const controlsContainer = document.createDocumentFragment();
    const button = document.createElement("button");

    // Add ID, classes and text
    button.id = controlName;
    button.className = classNames;
    button.textContent = name.toUpperCase();

    // Give into about controls to app
    this.controls[controlName] = () => {
      functionName.call(this);
    };

    // Adding buttons to container
    controlsContainer.appendChild(button);

    // Returning container
    return controlsContainer;
  }

  /**
   * Create text input
   * @method _createNameInput
   * @param  name             name of the input
   * @param  functionName     action to be called on input submit
   * @return                  HTML input element
   */
  _createNameInput(name: string, functionName: Function): HTMLInputElement {
    const inputName = this._normalizeName(name);
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter your name";
    input.id = inputName;

    // Store name input
    this.nameInput.node = input;

    // Give into about controls to app
    this.nameInput.action = (inputValue: string): void => {
      functionName.call(this, inputValue);
    };

    return input;
  }

  /**
   * Altering quiz state's player name
   * @method _changePlayerName
   * @param  newValue          new name of the player
   */
  _changePlayerName(newValue: string): void {
    this.state.playerName = newValue;
  }

  /**
   * Initialize the quiz
   * @method init
   */
  init(): void {
    // Initialize game
    console.log("Initializing app");

    // Set up containers

    // Time progress
    this._prepareContainer(
      "Time Counter",
      false,
      null,
      "",
      "show-on-screen0 show-on-screen1 show-on-screen2 show-on-screen3",
    );

    // Header
    this._prepareContainer(
      "Header",
      false,
      null,
      "container",
      "mathQuiz__header column is-full show-on-screen0 show-on-screen1 show-on-screen2 show-on-screen3",
      "<h1>MathQuiz<br/><small>train your brain!</small></h1>",
    );

    // Game rules
    this._prepareContainer(
      "Rules",
      true,
      null,
      "container",
      "column is-full show-on-screen0",
      "<p>You have 10 seconds to answer each question.<br/>Do it faster and receive bonus points. Answer wrong - get nothing!</p>",
    );

    // Question number
    this._prepareContainer(
      "Question Number",
      true,
      null,
      "",
      "column is-one-third indicator__wrapper show-on-screen1",
    );

    // Time indicator
    this._prepareContainer(
      "Time",
      true,
      null,
      "indicator",
      "column is-one-third indicator__wrapper show-on-screen1",
    );

    // Score indicator
    this._prepareContainer(
      "Score",
      true,
      null,
      "indicator",
      "column is-one-third indicator__wrapper show-on-screen1",
    );

    // Question
    this._prepareContainer(
      "Question",
      false,
      null,
      "question container",
      "column is-full show-on-screen1",
    );

    // Answers
    this._prepareContainer(
      "Answers",
      false,
      null,
      "buttons",
      "column is-full show-on-screen1",
    );

    // Top results table
    this._prepareContainer(
      "Top results",
      true,
      null,
      "container",
      "column is-full show-on-screen3",
      "<p>No results yet. Be first to score!</p>",
    );

    // Start button
    this._prepareContainer(
      "Start",
      false,
      this._createControls(
        "start",
        this._startQuiz.bind(this),
        "is-primary is-large",
      ),
      "",
      "column is-full show-on-screen0",
    );

    // Show high scores button
    this._prepareContainer(
      "Show High Scores",
      false,
      this._createControls(
        "show high scores",
        this._switchScreen.bind(this, 3),
      ),
      "",
      "column is-full show-on-screen0",
    );

    // Back to home button
    this._prepareContainer(
      "Back to Home",
      false,
      this._createControls("back to home", this._switchScreen.bind(this, 0)),
      "",
      "column is-full show-on-screen3",
    );

    // Name entry header
    this._prepareContainer(
      "High Scores Header",
      false,
      null,
      "container",
      "column is-full show-on-screen2",
      "<h2>Congratulations!</h2><p>You made it into the list of best results!</p>",
    );

    // Name entry input
    this._prepareContainer(
      "Name entry",
      false,
      this._createNameInput("Player name", this._changePlayerName.bind(this)),
      "container",
      "column is-full show-on-screen2",
    );

    // Name entry save
    this._prepareContainer(
      "Save result",
      false,
      this._createControls(
        "Join the Hall of Fame",
        this._showHighScores.bind(this),
        "is-primary is-large",
      ),
      "",
      "column is-full show-on-screen2",
    );

    // Activating controls event listeners
    document.addEventListener("click", (e: Event): void => {
      const target: HTMLElement = <HTMLElement>e.target;
      if (this.controls[target.id]) {
        this.controls[target.id].call(this);
      }
    });
    document.addEventListener("keyup", (e: Event): void => {
      const target: HTMLInputElement = <HTMLInputElement>e.target;
      if (this.nameInput.node.id === target.id) {
        this.nameInput.action.call(this, target.value);
      }
    });
  }
}

export default MathQuiz;
