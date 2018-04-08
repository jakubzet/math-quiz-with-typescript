import "./styles/index.scss";
import MathQuiz from "./MathQuiz";
// Base config can be extended by providing full or partial object
const mathQuiz = new MathQuiz({
  NUMBER_OF_ANSWERS: 3,
});
mathQuiz.init();
