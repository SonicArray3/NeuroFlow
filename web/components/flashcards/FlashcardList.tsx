import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { useFindMany, useAction } from "@gadgetinc/react";
import { format } from "date-fns";
import { api } from "../../api";
import type { FlashcardFilter, FlashcardSort, GadgetRecord } from "@gadget-client/neuroflows";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { ArrowUp, ArrowDown, MoreVertical, PlayCircle, Pencil, Trash2, FilterX, Search } from "lucide-react";

interface FlashcardSet {
  id: string;
  title: string;
  studyMaterial?: {
    id: string;
    title: string;
  } | null;
  cards: GadgetRecord<any>[];
  cardsCount: number;
  createdAt: Date;
  lastPracticed: Date | null;
  masteryLevel: number;
}

interface FlashcardListProps {
  onPractice?: (setId: string, cards: GadgetRecord<any>[]) => void;
  onEdit?: (setId: string) => void;
}

export const FlashcardList: React.FC<FlashcardListProps> = ({ onPractice, onEdit }) => {
  // State for sorting and filtering
  const [sortField, setSortField] = useState<string>("lastPracticed");
  const [sortOrder, setSortOrder] = useState<"Ascending" | "Descending">("Descending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showingSearch, setShowingSearch] = useState<boolean>(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  
  // Define the sort configuration
  const sortConfig: FlashcardSort = useMemo(() => {
    if (sortField === "difficulty") {
      return { difficulty: sortOrder };
    } else if (sortField === "lastPracticed") {
      return { lastReviewed: sortOrder };
    } else if (sortField === "createdAt") {
      return { createdAt: sortOrder };
    }
    
    // Default sorting by last reviewed date
    return { lastReviewed: sortOrder };
  }, [sortField, sortOrder]);
  
  // Define filter configuration
  const filterConfig: FlashcardFilter = useMemo(() => {
    const filter: FlashcardFilter = {};
    const conditions: FlashcardFilter[] = [];
    
    if (filterDifficulty) {
      const difficulty = parseInt(filterDifficulty, 10);
      if (!isNaN(difficulty)) {
        conditions.push({ difficulty: { equals: difficulty } });
      }
    }
    
    if (searchTerm.trim()) {
      conditions.push({
        OR: [
          { question: { contains: searchTerm } },
          { answer: { contains: searchTerm } }
        ]
      });
    }
    
    if (conditions.length > 0) {
      filter.AND = conditions;
    }
    
    return filter;
  }, [searchTerm, filterDifficulty]);
  
  // Fetch flashcards using the Gadget hook
  const [{ data: flashcards, fetching, error }] = useFindMany(api.flashcard, {
    select: {
      id: true,
      question: { markdown: true },
      answer: { markdown: true },
      difficulty: true,
      createdAt: true,
      lastReviewed: true,
      nextReviewDate: true,
      correctAnswers: true,
      incorrectAnswers: true,
      studyMaterial: { 
        id: true, 
        title: true 
      }
    },
    filter: filterConfig,
    sort: sortConfig,
    first: 250 // Max allowed by Gadget
  });
  
  // Set up delete action
  const [{ fetching: deleting }, runDelete] = useAction(api.flashcard.delete);
  
  // Function to calculate mastery level based on correct/incorrect answers
  const calculateMastery = (correct: number, incorrect: number): number => {
    if (correct === 0 && incorrect === 0) return 0;
    const total = correct + incorrect;
    const ratio = correct / total;
    return Math.min(Math.round(ratio * 5), 5);
  };
  
  // Group flashcards by study material
  const groupedFlashcards = useMemo(() => {
    if (!flashcards) return [];
    
    const groupedByStudyMaterial: Record<string, GadgetRecord<any>[]> = {};
    
    // Group cards by study material ID or "standalone" if no study material
    flashcards.forEach(card => {
      const key = card.studyMaterial?.id || "standalone";
      if (!groupedByStudyMaterial[key]) {
        groupedByStudyMaterial[key] = [];
      }
      groupedByStudyMaterial[key].push(card);
    });
    
    // Convert groups to FlashcardSet objects
    return Object.entries(groupedByStudyMaterial).map(([key, cards]) => {
      const firstCard = cards[0];
      const totalCorrect = cards.reduce((sum, card) => sum + (card.correctAnswers || 0), 0);
      const totalIncorrect = cards.reduce((sum, card) => sum + (card.incorrectAnswers || 0), 0);
      
      // Find the most recent practice date among all cards
      const lastPracticed = cards.reduce((latest, card) => {
        if (!card.lastReviewed) return latest;
        if (!latest) return new Date(card.lastReviewed);
        return new Date(card.lastReviewed) > latest ? new Date(card.lastReviewed) : latest;
      }, null as Date | null);
      
      return {
        id: key,
        title: key === "standalone" 
          ? "Standalone Flashcards" 
          : firstCard.studyMaterial?.title || "Untitled Set",
        studyMaterial: key === "standalone" ? null : firstCard.studyMaterial,
        cards,
        cardsCount: cards.length,
        createdAt: new Date(firstCard.createdAt),
        lastPracticed,
        masteryLevel: calculateMastery(totalCorrect, totalIncorrect)
      } as FlashcardSet;
    });
  }, [flashcards]);
  
  const handleDeleteSet = async (setId: string, cards: GadgetRecord<any>[]) => {
    // Delete each card in the set
    try {
      await Promise.all(
        cards.map(card => runDelete({ id: card.id }))
      );
    } catch (err) {
      console.error("Error deleting flashcard set:", err);
    }
  };
  
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "Ascending" ? "Descending" : "Ascending");
    } else {
      setSortField(field);
      setSortOrder("Descending");
    }
  };
  
  const resetFilters = () => {
    setSearchTerm("");
    setFilterDifficulty(null);
    setShowingSearch(false);
  };
  
  // Render mastery level as stars or progress component
  const renderMasteryLevel = (level: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full ${i < level ? 'bg-green-500' : 'bg-gray-200'}`} 
          />
        ))}
        <span className="ml-2 text-sm text-gray-500">{level}/5</span>
      </div>
    );
  };

  // Loading state
  if (fetching && !flashcards) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and sorting controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Your Flashcards</h2>
          <Badge>{groupedFlashcards.length} Sets</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {showingSearch ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search flashcards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button size="icon" variant="ghost" onClick={() => setShowingSearch(false)}>
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="icon" onClick={() => setShowingSearch(true)}>
              <Search className="h-4 w-4" />
            </Button>
          )}
          
          <Select value={filterDifficulty || ""} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Difficulties</SelectItem>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
              <SelectItem value="5">Level 5</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastPracticed">Last Practiced</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="difficulty">Difficulty</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "Ascending" ? "Descending" : "Ascending")}
          >
            {sortOrder === "Ascending" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
          
          {(searchTerm || filterDifficulty) && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <FilterX className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
      
      {/* Empty state */}
      {groupedFlashcards.length === 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Flashcards Found</CardTitle>
            <CardDescription>
              {searchTerm || filterDifficulty 
                ? "Try changing your search or filter criteria." 
                : "Create your first flashcard set to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            {!searchTerm && !filterDifficulty && (
              <Button asChild>
                <Link to="/flashcards/create">Create Flashcards</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Flashcard Set List */}
      <div className="space-y-4">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {groupedFlashcards.map((set) => (
            <Card key={set.id} className="mb-4 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{set.title}</CardTitle>
                    <CardDescription>
                      {set.cardsCount} card{set.cardsCount !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPractice?.(set.id, set.cards)}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Practice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(set.id)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this flashcard set and all {set.cardsCount} cards in it.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteSet(set.id, set.cards)}
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p>{format(set.createdAt, "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Practiced</p>
                    <p>{set.lastPracticed ? format(set.lastPracticed, "MMM d, yyyy") : "Never"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mastery Level</p>
                    {renderMasteryLevel(set.masteryLevel)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-end">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit?.(set.id)}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPractice?.(set.id, set.cards)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" /> Practice
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

export default FlashcardList;