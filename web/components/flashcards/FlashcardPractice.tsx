import React, { useState, useEffect, useRef } from "react";
import { useAction } from "@gadgetinc/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "../../api";
import { X, Check, RotateCw, Pause, Play, Save, Clock, ArrowRight } from "lucide-react";

interface FlashcardData {
  id: string;
  question: {
    markdown: string;
    html?: string;
  };
  answer: {
    markdown: string;
    html?: string;
  };
  difficulty: number;
  correctAnswers: number | null;
  incorrectAnswers: number | null;
}

interface FlashcardPracticeProps {
  flashcards: FlashcardData[];
  onComplete?: (stats: PracticeSessionStats) => void;
  onSave?: (stats: PracticeSessionStats) => void;
  onExit?: () => void;
}

interface PracticeSessionStats {
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  remainingCount: number;
  accuracy: number;
  averageTimePerCard: number;
  sessionDuration: number;
}

const FlashcardPractice: React.FC<FlashcardPracticeProps> = ({
  flashcards,
  onComplete,
  onSave,
  onExit,
}) => {
  // State for tracking current card and session progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>({
    totalCards: flashcards.length,
    correctCount: 0,
    incorrectCount: 0,
    remainingCount: flashcards.length,
    accuracy: 0,
    averageTimePerCard: 0,
    sessionDuration: 0,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const [timePerCard, setTimePerCard] = useState<Record<string, number>>({});
  const [adaptiveQueue, setAdaptiveQueue] = useState<number[]>([...Array(flashcards.length).keys()]);

  // Timer references for managing intervals
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Action hook for updating flashcard performance
  const [{ fetching: updating }, updatePerformance] = useAction(api.flashcard.updatePerformance);

  // Initialize session timer
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setSessionStats(prev => ({
          ...prev,
          sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
        }));
      }
    }, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isPaused, sessionStartTime]);

  // Handle session completion
  useEffect(() => {
    if (sessionStats.remainingCount === 0 && flashcards.length > 0) {
      handleEndSession();
    }
  }, [sessionStats.remainingCount]);

  // Calculate adaptive order based on difficulty and performance
  const recalculateAdaptiveQueue = () => {
    // Create weighted queue that shows difficult cards more frequently
    const weightedQueue = [...Array(flashcards.length).keys()].sort((a, b) => {
      const cardA = flashcards[a];
      const cardB = flashcards[b];
      
      // Calculate error rate
      const aTotal = (cardA.correctAnswers || 0) + (cardA.incorrectAnswers || 0);
      const bTotal = (cardB.correctAnswers || 0) + (cardB.incorrectAnswers || 0);
      
      const aErrorRate = aTotal > 0 ? (cardA.incorrectAnswers || 0) / aTotal : 0.5;
      const bErrorRate = bTotal > 0 ? (cardB.incorrectAnswers || 0) / bTotal : 0.5;
      
      // Combine difficulty and error rate
      const aWeight = cardA.difficulty * (1 + aErrorRate);
      const bWeight = cardB.difficulty * (1 + bErrorRate);
      
      // Higher weight (more difficult) cards should come first
      return bWeight - aWeight;
    });
    
    setAdaptiveQueue(weightedQueue);
  };

  // Handle card flipping
  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Calculate time spent on current card
  const calculateCardTime = () => {
    const now = Date.now();
    const timeSpent = now - cardStartTime;
    return timeSpent;
  };

  // Handle marking a card as correct
  const handleCorrect = async () => {
    if (isFlipped) {
      const cardTime = calculateCardTime();
      const currentCard = flashcards[adaptiveQueue[currentIndex]];
      
      // Update local stats
      setTimePerCard(prev => ({
        ...prev,
        [currentCard.id]: (prev[currentCard.id] || 0) + cardTime
      }));
      
      setTotalTimeSpent(prev => prev + cardTime);
      
      setSessionStats(prev => {
        const newCorrectCount = prev.correctCount + 1;
        return {
          ...prev,
          correctCount: newCorrectCount,
          remainingCount: prev.remainingCount - 1,
          accuracy: (newCorrectCount / (newCorrectCount + prev.incorrectCount)) * 100,
          averageTimePerCard: (prev.averageTimePerCard * (prev.totalCards - prev.remainingCount) + cardTime) / 
            (prev.totalCards - prev.remainingCount + 1)
        };
      });
      
      // Update flashcard in backend
      try {
        await updatePerformance({
          id: currentCard.id,
          isCorrect: true,
          responseTimeMs: cardTime,
          // Update difficulty down (easier) since answered correctly
          difficulty: Math.max(1, currentCard.difficulty - 1)
        });
      } catch (error) {
        console.error("Error updating flashcard performance:", error);
      }
      
      nextCard();
    }
  };

  // Handle marking a card as incorrect
  const handleIncorrect = async () => {
    if (isFlipped) {
      const cardTime = calculateCardTime();
      const currentCard = flashcards[adaptiveQueue[currentIndex]];
      
      // Update local stats
      setTimePerCard(prev => ({
        ...prev,
        [currentCard.id]: (prev[currentCard.id] || 0) + cardTime
      }));
      
      setTotalTimeSpent(prev => prev + cardTime);
      
      setSessionStats(prev => {
        const newIncorrectCount = prev.incorrectCount + 1;
        return {
          ...prev,
          incorrectCount: newIncorrectCount,
          remainingCount: prev.remainingCount - 1,
          accuracy: (prev.correctCount / (prev.correctCount + newIncorrectCount)) * 100,
          averageTimePerCard: (prev.averageTimePerCard * (prev.totalCards - prev.remainingCount) + cardTime) / 
            (prev.totalCards - prev.remainingCount + 1)
        };
      });
      
      // Update flashcard in backend
      try {
        await updatePerformance({
          id: currentCard.id,
          isCorrect: false,
          responseTimeMs: cardTime,
          // Update difficulty up (harder) since answered incorrectly
          difficulty: Math.min(5, currentCard.difficulty + 1)
        });
      } catch (error) {
        console.error("Error updating flashcard performance:", error);
      }
      
      // If consistently missed, move to back of queue to see again
      if ((currentCard.incorrectAnswers || 0) > (currentCard.correctAnswers || 0)) {
        setAdaptiveQueue(prev => [...prev, prev[currentIndex]]);
      }
      
      nextCard();
    }
  };

  // Move to the next card
  const nextCard = () => {
    setIsFlipped(false);
    setCardStartTime(Date.now());
    
    if (currentIndex < adaptiveQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // End of queue
      recalculateAdaptiveQueue();
      setCurrentIndex(0);
    }
  };

  // Toggle pause state
  const togglePause = () => {
    setIsPaused(!isPaused);

    if (isPaused) {
      // Resuming - reset the card start time
      setCardStartTime(Date.now());
    }
  };

  // Handle saving progress
  const handleSaveProgress = () => {
    if (onSave) {
      onSave(sessionStats);
    }
  };

  // Handle ending session early
  const handleEndSession = () => {
    setShowEndDialog(true);
    setIsPaused(true);
    
    if (onComplete) {
      onComplete(sessionStats);
    }
  };

  // Handle exiting session
  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Provide hint if needed
  const showHint = () => {
    // Simplified hint - first letter of answer
    const currentCard = flashcards[adaptiveQueue[currentIndex]];
    const answerText = currentCard.answer.markdown;
    return `Hint: First letter is "${answerText.trim()[0]}"`;
  };
  
  // Estimate remaining time
  const estimatedRemainingTime = sessionStats.averageTimePerCard > 0
    ? Math.round((sessionStats.averageTimePerCard * sessionStats.remainingCount) / 1000)
    : 0;

  // Get current flashcard
  const currentCard = flashcards[adaptiveQueue[currentIndex]];
  
  // If no flashcards, show message
  if (flashcards.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No flashcards available</h2>
        <p className="mb-4">There are no flashcards to practice. Please create some first.</p>
        <Button onClick={handleExit}>Back</Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Session Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className="flex items-center gap-1"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveProgress}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            Save Progress
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEndDialog(true)}
          className="text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          End Session
        </Button>
      </div>

      {/* Progress Indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Card {currentIndex + 1} of {adaptiveQueue.length}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {sessionStats.correctCount}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <X className="h-3 w-3 text-red-500" />
              {sessionStats.incorrectCount}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(sessionStats.sessionDuration)}
            </Badge>
          </div>
        </div>
        <Progress value={(1 - sessionStats.remainingCount / sessionStats.totalCards) * 100} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>
            Accuracy: {sessionStats.accuracy.toFixed(1)}%
          </span>
          <span>
            Est. remaining: {formatTime(estimatedRemainingTime)}
          </span>
        </div>
      </div>

      {/* Flashcard Display */}
      <div className="flex-1 flex items-center justify-center min-h-[300px] mb-6">
        <div
          className={`relative w-full max-w-lg perspective-1000 ${isPaused ? 'opacity-50' : ''}`}
          style={{ perspective: "1000px" }}
        >
          <div
            className={`
              relative w-full transform-style-3d transition-transform duration-500 ease-in-out
              ${isFlipped ? "rotate-y-180" : ""}
            `}
            style={{ transformStyle: "preserve-3d", transition: "transform 0.6s" }}
          >
            {/* Question Side */}
            <Card
              className={`
                absolute w-full h-full backface-hidden p-6 flex flex-col items-center justify-center
                ${isFlipped ? "invisible" : ""}
              `}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-sm text-muted-foreground mb-2">Question</div>
              <div className="text-center text-lg font-medium mb-4">
                {currentCard?.question?.markdown || "Loading..."}
              </div>
              <Button disabled={isPaused} onClick={flipCard} className="mt-auto">
                Flip Card
              </Button>
            </Card>

            {/* Answer Side */}
            <Card
              className={`
                absolute w-full h-full backface-hidden p-6 flex flex-col items-center justify-center
                rotate-y-180
                ${!isFlipped ? "invisible" : ""}
              `}
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="text-sm text-muted-foreground mb-2">Answer</div>
              <div className="text-center text-lg font-medium mb-4">
                {currentCard?.answer?.markdown || "Loading..."}
              </div>
              <div className="w-full mt-auto flex justify-center gap-4">
                <Button
                  variant="destructive"
                  disabled={isPaused || updating}
                  onClick={handleIncorrect}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Incorrect
                </Button>
                <Button
                  variant="default"
                  disabled={isPaused || updating}
                  onClick={handleCorrect}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Correct
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Hint & Controls */}
      {isFlipped && (
        <div className="text-center mb-4 text-sm text-muted-foreground">
          {(currentCard?.incorrectAnswers || 0) > (currentCard?.correctAnswers || 0) && showHint()}
        </div>
      )}
      
      <Separator className="mb-4" />

      {/* Session Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold">{sessionStats.correctCount}</div>
          <div className="text-xs text-muted-foreground">Correct</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{sessionStats.incorrectCount}</div>
          <div className="text-xs text-muted-foreground">Incorrect</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{sessionStats.remainingCount}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Practice Session?</DialogTitle>
            <DialogDescription>
              Your current progress will be saved.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h3 className="font-semibold mb-2">Session Summary</h3>
            <div className="grid grid-cols-2 gap-y-2">
              <div>Total Cards:</div>
              <div>{sessionStats.totalCards}</div>
              <div>Correct Answers:</div>
              <div>{sessionStats.correctCount}</div>
              <div>Incorrect Answers:</div>
              <div>{sessionStats.incorrectCount}</div>
              <div>Accuracy:</div>
              <div>{sessionStats.accuracy.toFixed(1)}%</div>
              <div>Session Duration:</div>
              <div>{formatTime(sessionStats.sessionDuration)}</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={sessionStats.remainingCount === 0}
            >
              Continue
            </Button>
            <Button onClick={handleExit}>
              Exit Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashcardPractice;