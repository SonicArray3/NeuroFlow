import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, logger, api, session }) => {
  const { studyMaterialId } = params;
  
  // Get current user ID from session
  const userId = session?.get("user");
  if (!userId) {
    throw new Error("User must be signed in to generate a summary");
  }

  // Fetch the study material
  const studyMaterial = await api.studyMaterial.findOne(studyMaterialId, {
    select: {
      id: true,
      title: true,
      content: { 
        markdown: true 
      },
      user: { 
        id: true 
      }
    }
  });

  if (!studyMaterial) {
    throw new Error(`Study material with id ${studyMaterialId} not found`);
  }

  // Verify the user has permission to access this material
  if (studyMaterial.user.id !== userId) {
    throw new Error("You don't have permission to generate a summary for this study material");
  }

  // Generate a concise summary with key points
  // In a real implementation, this would likely use an AI service like OpenAI
  const content = studyMaterial.content.markdown;
  
  // This is a simplified mock implementation
  // In a real app, you would use an AI service to generate a proper summary
  const summary = `
## TL;DR Summary

This is an AI-generated summary of "${studyMaterial.title}".

The content covers key concepts and information about the topic.

## Key Takeaways
* First important concept from the material
* Second important point that readers should remember
* Third critical takeaway from the content
* Final important conclusion
  `;

  // Generate key points as a JSON array
  const keyPoints = [
    "First important concept from the material",
    "Second important point that readers should remember", 
    "Third critical takeaway from the content",
    "Final important conclusion"
  ];
  
  // Update the study material with the generated summary and key points
  const updatedStudyMaterial = await api.studyMaterial.update(studyMaterialId, {
    aiGeneratedSummary: {
      markdown: summary
    },
    keyPoints: keyPoints
  });

  // Return the updated study material
  return updatedStudyMaterial;
};

export const params = {
  studyMaterialId: {
    type: "string"
  }
};

export const options: ActionOptions = {
  returnType: true
};