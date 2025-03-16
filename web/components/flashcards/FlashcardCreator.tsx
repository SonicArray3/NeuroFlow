import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useActionForm, useFindMany } from "@gadgetinc/react";
import { api } from "../../api";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Check, UploadCloud, BookOpen, FileText } from "lucide-react";

const FlashcardCreator: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("text");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState(3);
  const [topics, setTopics] = useState("");
  const [selectedStudyMaterial, setSelectedStudyMaterial] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch study materials for the dropdown
  const [{ data: studyMaterials, fetching: fetchingMaterials }] = useFindMany(api.studyMaterial, {
    select: {
      id: true,
      title: true,
    },
  });

  // Handle form submission using the API
  const [{ fetching: generating, error }, generateFlashcards] = useActionForm(api.flashcard.create);

  const handleGenerate = async () => {
    let contentToUse = "";

    if (activeTab === "text") {
      contentToUse = content;
    } else if (activeTab === "file" && file) {
      // For simplicity, we'll assume the API can handle the file content directly
      // In a real implementation, you might need to read the file and extract text
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const fileContent = e.target.result.toString();
          await submitGeneration(fileContent);
        }
      };
      reader.readAsText(file);
      return;
    } else if (activeTab === "material" && selectedStudyMaterial) {
      // We'll pass the study material ID to the backend
      contentToUse = selectedStudyMaterial;
    } else {
      return; // No content to generate from
    }

    await submitGeneration(contentToUse);
  };

  const submitGeneration = async (contentToUse: string) => {
    try {
      const result = await generateFlashcards({
        question: "Generated from content", // These will be replaced by the backend
        answer: "Generated from content",   // These will be replaced by the backend
        difficulty: difficulty,
        // Pass additional data as needed by your backend
        // This assumes your backend can handle the content and parse it into flashcards
        content: contentToUse,
        numCards: numCards,
        topics: topics.split(",").map(topic => topic.trim()),
        studyMaterialId: activeTab === "material" ? selectedStudyMaterial : undefined,
      });

      if (result) {
        setSuccessMessage("Flashcards generated successfully!");
        // Optionally navigate to view the flashcards
        setTimeout(() => {
          navigate("/flashcards");
        }, 2000);
      }
    } catch (err) {
      console.error("Error generating flashcards:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Flashcards</CardTitle>
        <CardDescription>
          Create flashcards from your study materials or text content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage ? (
          <Alert className="mb-4 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-2" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="file">
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="material">
              <BookOpen className="h-4 w-4 mr-2" />
              Study Material
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <div className="space-y-4">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Paste the content you want to create flashcards from..."
                className="min-h-32"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="file">
            <div className="space-y-4">
              <Label htmlFor="file">Upload File (PDF, DOCX, TXT)</Label>
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PDF, DOCX, and TXT files
                    </p>
                    <Input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => document.getElementById("file")?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="material">
            <div className="space-y-4">
              <Label htmlFor="studyMaterial">Select Study Material</Label>
              <Select
                value={selectedStudyMaterial}
                onValueChange={setSelectedStudyMaterial}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a study material" />
                </SelectTrigger>
                <SelectContent>
                  {fetchingMaterials ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    studyMaterials?.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numCards">Number of Cards ({numCards})</Label>
              <Slider
                id="numCards"
                min={5}
                max={50}
                step={5}
                value={[numCards]}
                onValueChange={(value) => setNumCards(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level ({difficulty})</Label>
              <Slider
                id="difficulty"
                min={1}
                max={5}
                step={1}
                value={[difficulty]}
                onValueChange={(value) => setDifficulty(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Focus Areas/Topics (comma-separated)</Label>
              <Input
                id="topics"
                placeholder="e.g. Key concepts, Definitions, Formulas"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
              />
            </div>
          </div>
        </Tabs>

        {error && (
          <Alert className="mt-4 bg-red-50">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message || "Failed to generate flashcards"}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={generating || 
            (activeTab === "text" && !content) || 
            (activeTab === "file" && !file) || 
            (activeTab === "material" && !selectedStudyMaterial)}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Flashcards...
            </>
          ) : (
            "Generate Flashcards"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FlashcardCreator;