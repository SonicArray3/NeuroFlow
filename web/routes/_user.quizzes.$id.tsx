import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useFindOne, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Types for quiz questions
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

// Main component
export default function QuizView() {
  const { id } = useParams();
  const [{ data: quiz, fetching, error }] = useFindOne(api.quiz, id as string);
  const [{ fetching: updating }, updateQuiz] = useAction(api.quiz.update);
  
  const [quizMode, setQuizMode] = useState<"overview" | "taking" | "results">("overview");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: string[];
    incorrectAnswers: string[];
  } | null>(null);

  // Parse questions from JSON
  const questions: QuizQuestion[] = quiz?.questions ? JSON.parse(JSON.stringify(quiz.questions)) : [];

  // Reset the quiz state when starting
  const startQuiz = () => {
    setQuizMode("taking");
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  // Handle answer selection
  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Calculate and submit quiz results
  const calculateResults = () => {
    if (!quiz) return;
    
    const correctAnswers: string[] = [];
    const incorrectAnswers: string[] = [];
    
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctAnswers.push(q.id);
      } else {
        incorrectAnswers.push(q.id);
      }
    });
    
    const score = (correctAnswers.length / questions.length) * 100;
    
    // Update the quiz in the database
    const now = new Date();
    const totalAttempts = (quiz.totalAttempts || 0) + 1;
    const bestScore = quiz.bestScore ? Math.max(quiz.bestScore, score) : score;
    
    updateQuiz({
      id: quiz.id,
      lastAttempt: now,
      totalAttempts: totalAttempts,
      bestScore: bestScore
    });
    
    setResult({
      score,
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers
    });
    
    setQuizMode("results");
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load quiz: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!quiz) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
        <AlertTitle>Quiz Not Found</AlertTitle>
        <AlertDescription>
          The quiz you're looking for doesn't exist.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-8">
      {quizMode === "overview" && (
        <QuizOverview 
          quiz={quiz} 
          questions={questions} 
          onStart={startQuiz} 
        />
      )}
      
      {quizMode === "taking" && questions.length > 0 && (
        <QuizTaking 
          quiz={quiz}
          questions={questions}
          currentQuestion={currentQuestion}
          answers={answers}
          selectAnswer={selectAnswer}
          nextQuestion={nextQuestion}
          prevQuestion={prevQuestion}
        />
      )}
      
      {quizMode === "results" && result && (
        <QuizResults 
          quiz={quiz} 
          questions={questions}
          result={result} 
          answers={answers}
          onRetry={startQuiz} 
        />
      )}
    </div>
  );
}

// Quiz overview component
function QuizOverview({ quiz, questions, onStart }: { 
  quiz: any, 
  questions: QuizQuestion[], 
  onStart: () => void 
}) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>{quiz.description || "No description provided"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Questions:</p>
            <p>{questions.length}</p>
          </div>
          
          {quiz.bestScore !== null && (
            <div>
              <p className="font-medium">Best Score:</p>
              <p>{quiz.bestScore.toFixed(1)}%</p>
            </div>
          )}
          
          {quiz.totalAttempts !== null && (
            <div>
              <p className="font-medium">Total Attempts:</p>
              <p>{quiz.totalAttempts}</p>
            </div>
          )}
          
          {quiz.lastAttempt && (
            <div>
              <p className="font-medium">Last Attempted:</p>
              <p>{new Date(quiz.lastAttempt).toLocaleDateString()} at {new Date(quiz.lastAttempt).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onStart}>Start Quiz</Button>
      </CardFooter>
    </Card>
  );
}

// Quiz taking component
function QuizTaking({ 
  quiz, 
  questions, 
  currentQuestion, 
  answers, 
  selectAnswer, 
  nextQuestion, 
  prevQuestion 
}: {
  quiz: any,
  questions: QuizQuestion[],
  currentQuestion: number,
  answers: Record<string, string>,
  selectAnswer: (questionId: string, answer: string) => void,
  nextQuestion: () => void,
  prevQuestion: () => void
}) {
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-4">{question.question}</h3>
            
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(value) => selectAnswer(question.id, value)}
              className="space-y-3"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        <Button 
          onClick={nextQuestion}
          disabled={!answers[question.id]}
        >
          {currentQuestion < questions.length - 1 ? "Next" : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Quiz results component
function QuizResults({ 
  quiz, 
  questions,
  result, 
  answers,
  onRetry 
}: {
  quiz: any,
  questions: QuizQuestion[],
  result: {
    score: number;
    totalQuestions: number;
    correctAnswers: string[];
    incorrectAnswers: string[];
  },
  answers: Record<string, string>,
  onRetry: () => void
}) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quiz Results</CardTitle>
        <CardDescription>{quiz.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{result.score.toFixed(1)}%</p>
            <p className="text-muted-foreground">
              You answered {result.correctAnswers.length} out of {result.totalQuestions} questions correctly
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-medium">Question Summary</h3>
            
            {questions.map((q, index) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className="p-4 rounded-lg border">
                  <p className="font-medium">{index + 1}. {q.question}</p>
                  <p className="mt-2">
                    Your answer: <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                      {answers[q.id]}
                    </span>
                  </p>
                  {!isCorrect && (
                    <p className="mt-1 text-green-600">
                      Correct answer: {q.correctAnswer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onRetry} className="mr-2">Try Again</Button>
      </CardFooter>
    </Card>
  );
}