import { useNavigate } from "react-router";
import { useFindMany } from "@gadgetinc/react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, BookOpenIcon, TimerIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizzesPage() {
  const navigate = useNavigate();
  const [{ data: quizzes, fetching, error }] = useFindMany(api.quiz, {
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      title: true,
      description: true,
      bestScore: true,
      totalAttempts: true,
      lastAttempt: true,
      studyMaterial: {
        id: true,
        title: true
      }
    }
  });

  const handleCreateQuiz = () => {
    navigate("/quizzes/new");
  };

  const handleViewQuiz = (id: string) => {
    navigate(`/quizzes/${id}`);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Create and take quizzes to test your knowledge
          </p>
        </div>
        <Button onClick={handleCreateQuiz} className="gap-1">
          <PlusIcon className="h-4 w-4" />
          Create Quiz
        </Button>
      </div>
      
      <Separator className="my-6" />

      {fetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </div>
          <h3 className="font-semibold text-xl">Failed to load quizzes</h3>
          <p className="text-muted-foreground mt-1">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : quizzes?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary mb-4">
            <BookOpenIcon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-xl">No quizzes yet</h3>
          <p className="text-muted-foreground mt-1">Create your first quiz to start testing your knowledge</p>
          <Button className="mt-4" onClick={handleCreateQuiz}>
            Create Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes?.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl truncate">{quiz.title}</CardTitle>
                {quiz.studyMaterial && (
                  <CardDescription className="text-xs">
                    Based on: {quiz.studyMaterial.title}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {quiz.description || "No description provided"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quiz.bestScore !== null && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 12v7"></path>
                        <path d="M14 12v7"></path>
                        <path d="M8 22h8"></path>
                        <path d="M18 9a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V3h12Z"></path>
                      </svg>
                      Best: {quiz.bestScore}%
                    </Badge>
                  )}
                  {quiz.totalAttempts !== null && Number(quiz.totalAttempts) > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat">
                        <path d="m17 2 4 4-4 4"></path>
                        <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
                        <path d="m7 22-4-4 4-4"></path>
                        <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
                      </svg>
                      {quiz.totalAttempts} attempt{Number(quiz.totalAttempts) !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {quiz.lastAttempt && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <TimerIcon className="h-3 w-3" />
                      {formatDistanceToNow(new Date(quiz.lastAttempt), { addSuffix: true })}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3">
                <Button 
                  onClick={() => handleViewQuiz(quiz.id)} 
                  variant="default" 
                  className="w-full"
                >
                  {Number(quiz.totalAttempts) > 0 ? "Take Again" : "Start Quiz"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}