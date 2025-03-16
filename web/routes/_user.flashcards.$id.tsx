import { useState } from "react";
import { useParams } from "react-router";
import { useFindOne, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { AutoForm, AutoInput } from "@/components/auto";
import { Badge } from "@/components/ui/badge";

export default function FlashcardDetailView() {
  const { id } = useParams();
  const [{ data: flashcard, fetching, error }] = useFindOne(api.flashcard, id as string, {
    select: {
      id: true,
      question: { markdown: true },
      answer: { markdown: true },
      difficulty: true,
      correctAnswers: true,
      incorrectAnswers: true,
      lastReviewed: true,
      nextReviewDate: true,
      studyMaterial: {
        id: true,
        title: true,
      },
      user: {
        id: true,
        firstName: true,
        lastName: true,
      },
      createdAt: true,
      updatedAt: true,
    },
  });
  
  const [practiceMode, setPracticeMode] = useState("standard");
  const [sessionDuration, setSessionDuration] = useState(15); // minutes
  const [cardLimit, setCardLimit] = useState(20);
  const [editing, setEditing] = useState(false);
  
  // Calculate mastery percentage
  const totalAttempts = (flashcard?.correctAnswers || 0) + (flashcard?.incorrectAnswers || 0);
  const masteryPercentage = totalAttempts > 0 
    ? Math.round((flashcard?.correctAnswers || 0) / totalAttempts * 100) 
    : 0;
  
  // For updating flashcard
  const [{ fetching: updating }, updateFlashcard] = useAction(api.flashcard.update);
  
  // For deleting flashcard
  const [{ fetching: deleting }, deleteFlashcard] = useAction(api.flashcard.delete);
  
  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-lg">Loading flashcard details...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }
  
  if (!flashcard) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">No flashcard found with ID: {id}</div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this flashcard?")) {
      await deleteFlashcard({ id: flashcard.id });
      // Navigate back after deletion
      window.history.back();
    }
  };
  
  const getDifficultyLabel = (difficulty) => {
    if (difficulty <= 1) return "Very Easy";
    if (difficulty <= 2) return "Easy";
    if (difficulty <= 3) return "Medium";
    if (difficulty <= 4) return "Hard";
    return "Very Hard";
  };
  
  const getLastReviewedText = () => {
    if (!flashcard.lastReviewed) return "Never reviewed";
    
    const lastReviewed = new Date(flashcard.lastReviewed);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastReviewed.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Reviewed today";
    if (diffDays === 1) return "Reviewed yesterday";
    return `Reviewed ${diffDays} days ago`;
  };
  
  const getNextReviewText = () => {
    if (!flashcard.nextReviewDate) return "Not scheduled";
    
    const nextReview = new Date(flashcard.nextReviewDate);
    const now = new Date();
    const diffTime = Math.abs(nextReview.getTime() - now.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (nextReview < now) return "Due for review";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };
  
  const renderEditForm = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Edit Flashcard</CardTitle>
        <CardDescription>Update the question and answer for this flashcard</CardDescription>
      </CardHeader>
      <CardContent>
        <AutoForm 
          action={api.flashcard.update}
          record={flashcard}
          onSuccess={() => setEditing(false)}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question</Label>
              <Textarea 
                id="question" 
                defaultValue={flashcard.question?.markdown || ""} 
                name="question"
                className="min-h-32"
                placeholder="Enter the flashcard question here..."
              />
            </div>
            
            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea 
                id="answer" 
                defaultValue={flashcard.answer?.markdown || ""} 
                name="answer"
                className="min-h-32"
                placeholder="Enter the flashcard answer here..."
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty">Difficulty (1-5)</Label>
              <div className="pt-2">
                <Slider
                  defaultValue={[flashcard.difficulty]}
                  min={1}
                  max={5}
                  step={1}
                  name="difficulty"
                />
                <div className="flex justify-between text-xs pt-1">
                  <span>Very Easy</span>
                  <span>Easy</span>
                  <span>Medium</span>
                  <span>Hard</span>
                  <span>Very Hard</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </AutoForm>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="container p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {flashcard.question?.markdown?.substring(0, 40)}
            {(flashcard.question?.markdown?.length || 0) > 40 ? "..." : ""}
          </h1>
          {flashcard.studyMaterial && (
            <div className="text-sm text-gray-500">
              From study material: <span className="font-medium">{flashcard.studyMaterial.title}</span>
            </div>
          )}
          <div className="text-sm text-gray-500 mt-1">
            Created {new Date(flashcard.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={editing ? "secondary" : "outline"} 
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel Edit" : "Edit"}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Edit form (conditionally shown) */}
      {editing && renderEditForm()}
      
      {/* Statistics section */}
      <Card>
        <CardHeader>
          <CardTitle>Flashcard Statistics</CardTitle>
          <CardDescription>Performance and study metrics for this flashcard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Mastery</Label>
                  <span className="text-sm font-medium">{masteryPercentage}%</span>
                </div>
                <Progress value={masteryPercentage} className="h-2" />
                <div className="flex justify-between text-xs mt-1">
                  <span>Beginner</span>
                  <span>Mastered</span>
                </div>
              </div>
              
              <div>
                <Label className="mb-1 inline-block">Performance</Label>
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 text-green-800 rounded-full py-1 px-3 text-sm">
                    Correct: {flashcard.correctAnswers || 0}
                  </div>
                  <div className="bg-red-100 text-red-800 rounded-full py-1 px-3 text-sm">
                    Incorrect: {flashcard.incorrectAnswers || 0}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="mb-1 inline-block">Difficulty</Label>
                <div className="bg-blue-100 text-blue-800 rounded-full py-1 px-3 text-sm inline-block">
                  {getDifficultyLabel(flashcard.difficulty)} ({flashcard.difficulty}/5)
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-1 inline-block">Review Schedule</Label>
                <div className="space-y-2">
                  <div className="text-sm">
                    {getLastReviewedText()}
                  </div>
                  <div className="text-sm">
                    {getNextReviewText()}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="mb-1 inline-block">Strengths & Weaknesses</Label>
                <div className="space-y-2">
                  {flashcard.difficulty > 3 ? (
                    <Badge variant="destructive">Challenging Topic</Badge>
                  ) : (
                    <Badge variant="outline">Standard Difficulty</Badge>
                  )}
                  
                  {(flashcard.correctAnswers || 0) > (flashcard.incorrectAnswers || 0) ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">Strong Performance</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 ml-2">Needs Practice</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Practice modes */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Modes</CardTitle>
          <CardDescription>Choose how you want to study this flashcard</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            defaultValue={practiceMode} 
            onValueChange={setPracticeMode}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-slate-50">
              <RadioGroupItem value="standard" id="standard" />
              <div>
                <Label htmlFor="standard" className="font-medium cursor-pointer">Standard Mode</Label>
                <p className="text-sm text-gray-500">All cards in regular order</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-slate-50">
              <RadioGroupItem value="difficult" id="difficult" />
              <div>
                <Label htmlFor="difficult" className="font-medium cursor-pointer">Difficult Cards Only</Label>
                <p className="text-sm text-gray-500">Focus on cards with high difficulty rating</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-slate-50">
              <RadioGroupItem value="new" id="new" />
              <div>
                <Label htmlFor="new" className="font-medium cursor-pointer">New Cards Only</Label>
                <p className="text-sm text-gray-500">Recently added or less practiced</p>  
              </div>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-slate-50">
              <RadioGroupItem value="mixed" id="mixed" />
              <div>
                <Label htmlFor="mixed" className="font-medium cursor-pointer">Mixed Mode</Label>
                <p className="text-sm text-gray-500">Balanced approach of all card types</p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      {/* Study session controls */}
      <Card>
        <CardHeader>
          <CardTitle>Study Session Controls</CardTitle>
          <CardDescription>Configure your practice session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="duration">Session Duration (minutes)</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Slider
                  id="duration"
                  value={[sessionDuration]}
                  min={5}
                  max={60}
                  step={5}
                  onValueChange={(value) => setSessionDuration(value[0])}
                />
                <span className="w-12 text-center">{sessionDuration}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="limit">Card Limit</Label>
              <div className="flex items-center space-x-4 mt-2">
                <Slider
                  id="limit"
                  value={[cardLimit]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(value) => setCardLimit(value[0])}
                />
                <span className="w-12 text-center">{cardLimit}</span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="flex justify-end">
                <Button className="w-full md:w-auto">
                  Start Practice Session
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* View actual flashcard content */}
      <Card>
        <CardHeader>
          <CardTitle>Flashcard Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="question">
            <TabsContent value="question">
              <div className="border p-4 rounded-md mb-2 min-h-32">
                <div className="font-medium mb-2">Question:</div>
                <div>{flashcard.question?.markdown || "No question content"}</div>
              </div>
            </TabsContent>
            <TabsContent value="answer">
              <div className="border p-4 rounded-md mb-2 min-h-32">
                <div className="font-medium mb-2">Answer:</div>
                <div>{flashcard.answer?.markdown || "No answer content"}</div>
              </div>
            </TabsContent>
            
            <TabsContent value="both">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-md min-h-32">
                  <div className="font-medium mb-2">Question:</div>
                  <div>{flashcard.question?.markdown || "No question content"}</div>
                </div>
                <div className="border p-4 rounded-md min-h-32">
                  <div className="font-medium mb-2">Answer:</div>
                  <div>{flashcard.answer?.markdown || "No answer content"}</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsList className="mt-4">
              <TabsTrigger value="question">Question Only</TabsTrigger>
              <TabsTrigger value="answer">Answer Only</TabsTrigger>
              <TabsTrigger value="both">Both</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Flashcards
            </Button>
            {!editing && (
              <Button onClick={() => setEditing(true)}>
                Edit Flashcard
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}