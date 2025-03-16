import { useState } from "react";
import { useFindMany, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutoTable } from "@/components/auto";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Flashcards() {
  const [activeTab, setActiveTab] = useState("my-flashcards");
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentFlashcardSet, setCurrentFlashcardSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Fetch user's flashcards
  const [{ data: flashcards, fetching }] = useFindMany(api.flashcard, {
    select: {
      id: true,
      question: { markdown: true },
      answer: { markdown: true },
      difficulty: true,
      lastReviewed: true,
      correctAnswers: true,
      incorrectAnswers: true,
      studyMaterial: { 
        id: true, 
        title: true 
      },
      user: { id: true }
    }
  });

  // Group flashcards by study material
  const flashcardsByMaterial = {};
  if (flashcards) {
    flashcards.forEach(card => {
      const materialId = card.studyMaterial?.id || 'unassigned';
      if (!flashcardsByMaterial[materialId]) {
        flashcardsByMaterial[materialId] = {
          title: card.studyMaterial?.title || 'Unassigned',
          cards: []
        };
      }
      flashcardsByMaterial[materialId].cards.push(card);
    });
  }

  // Create flashcard action
  const [{ fetching: creating }, createFlashcard] = useAction(api.flashcard.create);

  // Update flashcard performance action
  const [{ fetching: updating }, updateFlashcard] = useAction(api.flashcard.update);

  // Handle flashcard creation from text
  const handleCreateFromText = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const content = formData.get('content');
    const difficulty = parseInt(formData.get('difficulty'));
    const studyMaterialId = formData.get('studyMaterial');
    
    // Simple parsing of content to create flashcards
    // Format expected: Question? Answer
    const lines = content.split('\n');
    let currentQuestion = '';
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      if (line.includes('?')) {
        const parts = line.split('?');
        if (parts.length >= 2) {
          const question = parts[0] + '?';
          const answer = parts.slice(1).join('?').trim();
          
          if (question && answer) {
            await createFlashcard({
              question: { markdown: question },
              answer: { markdown: answer },
              difficulty,
              ...(studyMaterialId && { studyMaterial: { _link: studyMaterialId } }),
            });
          }
        } else {
          currentQuestion = line;
        }
      } else if (currentQuestion) {
        // If previous line was a question, this line is the answer
        await createFlashcard({
          question: { markdown: currentQuestion },
          answer: { markdown: line },
          difficulty,
          ...(studyMaterialId && { studyMaterial: { _link: studyMaterialId } }),
        });
        currentQuestion = '';
      }
    }
    
    // Reset form
    e.target.reset();
    setActiveTab("my-flashcards");
  };

  // Start practice mode for a set of flashcards
  const startPractice = (cards) => {
    setCurrentFlashcardSet(cards);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setPracticeMode(true);
  };

  // Handle marking a flashcard as correct or incorrect
  const handleMarkCard = async (isCorrect) => {
    const card = currentFlashcardSet[currentCardIndex];
    
    // Update card statistics
    await updateFlashcard({
      id: card.id,
      correctAnswers: isCorrect ? card.correctAnswers + 1 : card.correctAnswers,
      incorrectAnswers: isCorrect ? card.incorrectAnswers : card.incorrectAnswers + 1,
      lastReviewed: new Date().toISOString(),
      // Adjust difficulty based on performance
      difficulty: isCorrect ? 
        Math.max(1, card.difficulty - 0.5) : 
        Math.min(5, card.difficulty + 0.5),
      // Next review date would typically be calculated based on spaced repetition algorithm
      nextReviewDate: new Date(Date.now() + (isCorrect ? 3 : 1) * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    // Move to next card or end session
    if (currentCardIndex < currentFlashcardSet.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // End of session
      setPracticeMode(false);
      setCurrentFlashcardSet(null);
    }
  };

  // Render practice mode
  if (practiceMode && currentFlashcardSet) {
    const card = currentFlashcardSet[currentCardIndex];
    
    return (
      <div className="container max-w-3xl mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Practice Flashcards</h1>
          <div className="text-sm">
            Card {currentCardIndex + 1} of {currentFlashcardSet.length}
          </div>
        </div>
        
        <Card className="w-full mb-6 min-h-[300px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Flashcard</span>
              <Badge variant={card.difficulty > 3 ? "destructive" : card.difficulty > 1 ? "default" : "success"}>
                Difficulty: {card.difficulty}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="mb-4 flex-grow">
              <h3 className="font-medium mb-2">Question:</h3>
              <div className="p-4 bg-secondary rounded-md" dangerouslySetInnerHTML={{ __html: card.question.markdown }} />
            </div>
            
            {showAnswer && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Answer:</h3>
                <div className="p-4 bg-secondary rounded-md" dangerouslySetInnerHTML={{ __html: card.answer.markdown }} />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} className="w-full">Show Answer</Button>
            ) : (
              <div className="flex space-x-4 w-full">
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleMarkCard(false)}
                  disabled={updating}
                >
                  Incorrect
                </Button>
                <Button 
                  variant="success" 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  onClick={() => handleMarkCard(true)}
                  disabled={updating}
                >
                  Correct
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setPracticeMode(false)}
              className="w-full"
            >
              Exit Practice
            </Button>
          </CardFooter>
        </Card>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${((currentCardIndex + 1) / currentFlashcardSet.length) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Flashcards</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-flashcards">My Flashcards</TabsTrigger>
          <TabsTrigger value="create-flashcards">Create Flashcards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-flashcards" className="space-y-6">
          {fetching ? (
            <div>Loading flashcards...</div>
          ) : flashcards && flashcards.length > 0 ? (
            <div>
              {Object.entries(flashcardsByMaterial).map(([materialId, { title, cards }]) => (
                <div key={materialId} className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <Button onClick={() => startPractice(cards)}>Practice Set</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => (
                      <Card key={card.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md truncate">
                            {card.question.markdown.replace(/<[^>]*>/g, '').substring(0, 50)}
                            {card.question.markdown.length > 50 ? '...' : ''}
                          </CardTitle>
                          <div className="flex justify-between items-center">
                            <Badge variant={card.difficulty > 3 ? "destructive" : card.difficulty > 1 ? "default" : "success"}>
                              Difficulty: {card.difficulty}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {card.correctAnswers}/{card.correctAnswers + card.incorrectAnswers} correct
                            </span>
                          </div>
                        </CardHeader>
                        <CardFooter className="pt-2 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              startPractice([card]);
                            }}
                          >
                            Practice
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No flashcards found</h3>
              <p className="text-muted-foreground">Create some flashcards to get started.</p>
              <Button 
                className="mt-4" 
                onClick={() => setActiveTab("create-flashcards")}
              >
                Create Flashcards
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create-flashcards">
          <Card>
            <CardHeader>
              <CardTitle>Create New Flashcards</CardTitle>
              <CardDescription>
                Enter content to generate flashcards. Format each pair as a question followed by an answer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFromText} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    placeholder="Enter questions and answers here. Format: Question? Answer"
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Each question should end with a question mark, followed by its answer.
                    <br />
                    Example: "What is the capital of France? Paris"
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Initial Difficulty (1-5)</Label>
                    <Select name="difficulty" defaultValue="3">
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Easy</SelectItem>
                        <SelectItem value="2">2 - Easy</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="4">4 - Hard</SelectItem>
                        <SelectItem value="5">5 - Very Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="studyMaterial">Study Material (Optional)</Label>
                    <Input
                      id="studyMaterial"
                      name="studyMaterial"
                      placeholder="Enter Study Material ID"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" disabled={creating} className="w-full">
                    {creating ? "Creating Flashcards..." : "Create Flashcards"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Or Upload a File (Coming Soon)</h3>
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-10 text-center">
                  <p className="text-muted-foreground">File upload functionality will be available soon.</p>
                  <p className="text-muted-foreground text-sm mt-2">Supported formats will include PDF, DOCX, and TXT.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}