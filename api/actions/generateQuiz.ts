import { ActionOptions } from "gadget-server";

export const params = {
  title: { type: "string" },
  description: { type: "string" },
  studyMaterialId: { type: "string" },
  numberOfQuestions: { type: "number" }
};

export const run: ActionRun = async ({ params, logger, api, session }) => {
  logger.info("Starting quiz generation", { params });
  const { title, description, studyMaterialId, numberOfQuestions = 10 } = params;
  
  // Robust session validation
  if (!session) {
    logger.error("Quiz generation failed: No active session");
    throw new Error("Authentication required: No active session found");
  }
  
  const userId = session.userId;
  if (!userId) {
    logger.error("Quiz generation failed: User ID not found in session");
    throw new Error("Authentication required: User not properly authenticated");
  }
  
  logger.info("User authenticated", { userId });

  // Fetch the study material
  logger.info("Fetching study material", { studyMaterialId });
  
  try {
    const studyMaterial = await api.studyMaterial.findOne(studyMaterialId, {
      select: {
        id: true,
        title: true,
        description: true,
        file: {
          url: true,
          filename: true
        },
        fileType: true,
        user: {
          id: true
        }
      }
    });

    if (!studyMaterial) {
      logger.warn("Study material not found", { studyMaterialId });
      throw new Error(`Study material not found: The requested material (ID: ${studyMaterialId}) does not exist or has been deleted`);
    }

    logger.info("Study material found", { 
      materialId: studyMaterial.id, 
      materialTitle: studyMaterial.title,
      ownerId: studyMaterial.user.id
    });

    // Verify the user has permission to access this material
    if (studyMaterial.user.id !== userId) {
      logger.warn("Permission denied", { 
        userId, 
        ownerId: studyMaterial.user.id, 
        materialId: studyMaterial.id 
      });
      throw new Error("Access denied: You don't have permission to access this study material");
    }
    
    logger.info("User has permission to access study material");

    // Generate placeholder quiz questions (to be enhanced with AI later)
    logger.info("Generating quiz questions", { numberOfQuestions });
    const questions = generatePlaceholderQuestions(numberOfQuestions);

    // Create a new quiz record
    logger.info("Creating quiz record");
    const quiz = await api.quiz.create({
      title: title || `Quiz on ${studyMaterial.title}`,
      description: description || `Generated quiz for ${studyMaterial.title}`,
      questions: questions,
      user: { _link: userId },
      studyMaterial: { _link: studyMaterialId }
    });

    logger.info("Quiz successfully created", { 
      quizId: quiz.id, 
      quizTitle: quiz.title,
      questionCount: questions.length
    });

    return quiz;
  } catch (error) {
    logger.error("Error during quiz generation", { 
      error: error instanceof Error ? error.message : String(error),
      studyMaterialId,
      userId
    });
    throw error;
  }
};

/**
 * Generates placeholder quiz questions
 * This will be replaced with AI-powered generation in the future
 */
function generatePlaceholderQuestions(numberOfQuestions: number) {
  const questions = [];
  
  for (let i = 0; i < numberOfQuestions; i++) {
    const questionType = i % 3 === 0 ? "multiple-choice" : (i % 3 === 1 ? "true-false" : "short-answer");
    
    if (questionType === "multiple-choice") {
      questions.push({
        type: "multiple-choice",
        prompt: `Sample multiple choice question #${i + 1}`,
        correctAnswer: "Option A",
        options: ["Option A", "Option B", "Option C", "Option D"]
      });
    } else if (questionType === "true-false") {
      questions.push({
        type: "true-false",
        prompt: `Sample true/false statement #${i + 1}`,
        correctAnswer: "True",
        options: ["True", "False"]
      });
    } else {
      questions.push({
        type: "short-answer",
        prompt: `Sample short answer question #${i + 1}`,
        correctAnswer: "Sample answer",
        options: []
      });
    }
  }
  
  return questions;
}

export const options: ActionOptions = {
  returnType: true
};