interface nameInputInterface {
  node: HTMLElement;
  action: Function;
}

interface stateInterface {
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

interface configInterface {
  QUESTION_TIMEOUT: number;
  NUMBER_OF_ANSWERS: number;
  NUMBER_OF_QUESTIONS: number;
  APP_CONTAINER: HTMLElement;
  NUMBER_OF_BEST_RESULTS: number;
}

interface highScoresEntryInterface {
  name: string;
  score: number;
}

interface containersInterface {
  [propName: string]: HTMLElement;
}

interface controlsInterface {
  [propName: string]: Function;
}

type stateType = stateInterface;
type configType = configInterface;
type highScoresEntryType = highScoresEntryInterface;
type containersType = containersInterface;
type controlsType = controlsInterface;

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
  constructor(quizConfig?: configType) {
    // App config with constants
    this.CONFIG =
      quizConfig ||
      Object.freeze({
        QUESTION_TIMEOUT: 10,
        NUMBER_OF_ANSWERS: 4,
        NUMBER_OF_QUESTIONS: 5,
        APP_CONTAINER: document.getElementById("quiz"),
        NUMBER_OF_BEST_RESULTS: 15,
      });

    // Containers for HTML updating
    this.containers = {};

    // Controls and actions
    this.controls = {};

    // High score name input
    this.nameInput = {
      node: null,
      action: null,
    };

    // High scores data
    this.highScores = [];

    // Current player state
    this.state = this._getInitialState();
  }

  // Return initial game state
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

  // Helper for transforming names into IDs
  _normalizeName(str: string): string {
    return str.toLowerCase().replace(/ /gim, "-");
  }

  _prepareContainer(
    name: string,
    hasLabel: boolean = true,
    // FIXME
    content: DocumentFragment | HTMLElement,
    addedCSSClasses: string,
    addedCSSClassesForContainer: string,
    innerHTML?: string,
  ) {
    const normalizedName = this._normalizeName(name);
    const ID = "" + normalizedName;
    const nameClass = "mathQuiz__" + normalizedName;
    const innerClasses = addedCSSClasses ? addedCSSClasses : "";
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

  _updateContainerStyle(
    name: string,
    cssName: string,
    cssNewValue: string,
  ): void {
    const targetDomElement: HTMLElement = document.getElementById(name);
    targetDomElement.style.setProperty(cssName, cssNewValue);
  }

  _updateStateAndContainer(
    value: any,
    stateName: string,
    containerName: string,
  ): void {
    this.state[stateName] = value;
    this._updateContainerValue(containerName, value);
  }

  _quitTimer() {
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

  _startTimer() {
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

  // Process answer fro player
  _giveAnswer(pointsToAdd: number, shouldAddTimeBonus: boolean) {
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

  // Helper for generating answers
  _generateRandomAnswer(correct: number, diff: number): number {
    return Math.floor(
      Math.random() * (correct + diff - (correct - diff)) + (correct - diff),
    );
  }

  // Create answer buttons
  _createAnswers(question: string) {
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

  // Show question and possible answers to user
  _setQuestionAndAnswers(questionNumber: number) {
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

  _showHighScores() {
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

  _clearNameInput(): void {
    const nameInput: HTMLInputElement = <HTMLInputElement>document.getElementById(
      this.nameInput.node.id,
    );
    nameInput.value = "";
    nameInput.focus();
  }

  // Update high scores table
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

  // Ending quiz
  _endQuiz() {
    // Resetting timer
    this._quitTimer();

    // Enable restarting quiz
    this.state.quizActive = false;

    // Update high scores table
    this._updateHighScores(this.state.playerName, this.state.score);
  }

  // Switch the currently visible elements
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

  _generateQuestions() {
    const questionsArray = [];
    const generateInt = () => Math.ceil(Math.random() * 10);
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

  // Starting the quiz
  _startQuiz() {
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

  // Create buttons with event handlers
  _createControls(
    name: string,
    functionName: Function,
    additionalClasses: string = "",
  ) {
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

  // Create text input
  _createNameInput(name: string, functionName: Function) {
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

  _changePlayerName(newValue: string) {
    this.state.playerName = newValue;
  }

  // Initializing the app
  init() {
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

//const mathQuiz = new MathQuiz();
//mathQuiz.init();
