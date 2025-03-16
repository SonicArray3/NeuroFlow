import { useState } from "react";
import { useNavigate } from "react-router";
import { useFindMany, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, PlusCircle, Trash2, CheckCircle2, Edit, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface QuizQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export default function NewQuiz() {
  const navigate = useNavigate();
  const [{ data: studyMaterials, fetching: fetchingMaterials, error: materialsError }] = useFindMany(api.studyMaterial);
  const [{ data: quizResult, fetching: creatingQuiz, error: quizError }, createQuiz] = useAction(api.quiz.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [formError, setFormError] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { text: "", options: ["", ""], correctOptionIndex: 0 }
  ]);
  const [activeTab, setActiveTab] = useState("edit");
  const [currentEditingQuestion, setCurrentEditingQuestion] = useState(0);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", ""], correctOptionIndex: 0 }]);
    setCurrentEditingQuestion(questions.length);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      setFormError("Quiz must have at least one question");
      return;
    }
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    
    if (currentEditingQuestion >= newQuestions.length) {
      setCurrentEditingQuestion(newQuestions.length - 1);
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: string | number) => {
    const newQuestions = [...questions];
    // @ts-expect-error - we know the field types match
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    if (questions[questionIndex].options.length >= 6) {
      return; // Maximum 6 options per question
    }
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push("");
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    if (questions[questionIndex].options.length <= 2) {
      return; // Minimum 2 options required
    }
    
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    
    // Adjust correctOptionIndex if needed
    if (newQuestions[questionIndex].correctOptionIndex >= newQuestions[questionIndex].options.length) {
      newQuestions[questionIndex].correctOptionIndex = 0;
    }
    
    setQuestions(newQuestions);
  };

  const validateQuestions = (): boolean => {
    // Check if all questions have text
    const emptyQuestionIndex = questions.findIndex(q => !q.text.trim());
    if (emptyQuestionIndex !== -1) {
      setFormError(`Question ${emptyQuestionIndex + 1} is missing text`);
      setCurrentEditingQuestion(emptyQuestionIndex);
      setActiveTab("edit");
      return false;
    }

    // Check if all options have text
    for (let i = 0; i < questions.length; i++) {
      const emptyOptionIndex = questions[i].options.findIndex(o => !o.trim());
      if (emptyOptionIndex !== -1) {
        setFormError(`Question ${i + 1} has an empty option (option ${emptyOptionIndex + 1})`);
        setCurrentEditingQuestion(i);
        setActiveTab("edit");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }

    if (!selectedMaterial) {
      setFormError("Please select a study material");
      return;
    }

    if (!validateQuestions()) {
      return;
    }

    try {
      const result = await createQuiz({
        title,
        description,
        questions: questions,
        studyMaterial: {
          _link: selectedMaterial
        }
      });

      if (result?.id) {
        navigate(`/quizzes/${result.id}`);
      }
    } catch (error) {
      setFormError("Failed to create quiz: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Create New Quiz</CardTitle>
                <CardDescription>Build a custom multiple-choice quiz</CardDescription>
              </div>
              {questions.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {questions.length} {questions.length === 1 ? "Question" : "Questions"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {materialsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>Error loading study materials: {materialsError.message}</AlertDescription>
              </Alert>
            )}

            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {quizError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>Error creating quiz: {quizError.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quiz title"
                    disabled={creatingQuiz}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyMaterial">Study Material</Label>
                  <Select
                    value={selectedMaterial}
                    onValueChange={setSelectedMaterial}
                    disabled={fetchingMaterials || creatingQuiz}
                  >
                    <SelectTrigger id="studyMaterial">
                      <SelectValue placeholder="Select a study material" />
                    </SelectTrigger>
                    <SelectContent>
                      {fetchingMaterials ? (
                        <SelectItem value="loading" disabled>
                          Loading study materials...
                        </SelectItem>
                      ) : studyMaterials && studyMaterials.length > 0 ? (
                        studyMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No study materials available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter quiz description"
                  disabled={creatingQuiz}
                />
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddQuestion}
                  disabled={creatingQuiz}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Question
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="edit" className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="space-y-6">
                  <div className="flex gap-2 mb-4 overflow-x-auto py-2">
                    {questions.map((_, index) => (
                      <Button
                        key={index}
                        variant={currentEditingQuestion === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentEditingQuestion(index)}
                        className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Question {currentEditingQuestion + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(currentEditingQuestion)}
                          disabled={questions.length <= 1}
                          className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="questionText">Question Text</Label>
                          <Textarea
                            id="questionText"
                            value={questions[currentEditingQuestion].text}
                            onChange={(e) => handleQuestionChange(currentEditingQuestion, 'text', e.target.value)}
                            placeholder="Enter your question"
                            disabled={creatingQuiz}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Answer Options</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddOption(currentEditingQuestion)}
                              disabled={questions[currentEditingQuestion].options.length >= 6}
                              className="h-7 px-2 text-xs"
                            >
                              Add Option
                            </Button>
                          </div>

                          <RadioGroup
                            value={questions[currentEditingQuestion].correctOptionIndex.toString()}
                            onValueChange={(value) => handleQuestionChange(currentEditingQuestion, 'correctOptionIndex', parseInt(value))}
                            className="space-y-3"
                          >
                            {questions[currentEditingQuestion].options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <RadioGroupItem
                                  value={optionIndex.toString()}
                                  id={`option-${currentEditingQuestion}-${optionIndex}`}
                                  disabled={creatingQuiz}
                                />
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionChange(currentEditingQuestion, optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1"
                                  disabled={creatingQuiz}
                                />
                                {questions[currentEditingQuestion].options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveOption(currentEditingQuestion, optionIndex)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                    disabled={creatingQuiz}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preview" className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-md">
                    <h2 className="text-2xl font-bold mb-2">{title || "Untitled Quiz"}</h2>
                    {description && <p className="text-gray-600 mb-6">{description}</p>}

                    {questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="mb-8 bg-white p-4 rounded-md shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="flex items-center justify-center bg-primary text-primary-foreground w-6 h-6 rounded-full text-sm font-medium">
                            {questionIndex + 1}
                          </span>
                          <h3 className="text-lg font-medium">{question.text || "Question text..."}</h3>
                        </div>

                        <div className="space-y-2 ml-8">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`flex items-center p-3 rounded-md border ${
                                optionIndex === question.correctOptionIndex
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200"
                              }`}
                            >
                              {optionIndex === question.correctOptionIndex && (
                                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                              )}
                              <span>{option || `Option ${optionIndex + 1}...`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/quizzes")}
                  disabled={creatingQuiz}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={fetchingMaterials || creatingQuiz}>
                  {creatingQuiz ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Quiz...
                    </>
                  ) : (
                    "Create Quiz"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}