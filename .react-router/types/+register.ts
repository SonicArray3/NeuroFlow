import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/forgot-password": {};
  "/reset-password": {};
  "/verify-email": {};
  "/sign-in": {};
  "/sign-up": {};
  "/flashcards": {};
  "/flashcards/:id": {
    "id": string;
  };
  "/signed-in": {};
  "/profile": {};
  "/quizzes": {};
  "/quizzes/:id": {
    "id": string;
  };
  "/quizzes/new": {};
};