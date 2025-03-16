import { ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, session, logger, api }) => {
  const { topic, objective, studyMaterialId } = params;
  
  // Get current user ID from session
  const userId = session?.get("user");
  if (!userId) {
    throw new Error("User must be signed in to generate brainstorm ideas");
  }
  
  // If studyMaterialId is provided, fetch study material for context
  let studyMaterialContext = "";
  if (studyMaterialId) {
    const studyMaterial = await api.studyMaterial.findOne(studyMaterialId, {
      select: {
        id: true,
        title: true,
        content: {
          markdown: true
        }
      }
    });
    
    if (studyMaterial) {
      studyMaterialContext = `Based on the study material titled "${studyMaterial.title}" with content: ${studyMaterial.content.markdown.substring(0, 500)}...`;
    }
  }
  
  // Generate ideas based on objective type
  const ideas = generateIdeasForObjective(topic, objective, studyMaterialContext);
  
  // Create a new brainstorm record
  const brainstorm = await api.brainstorm.create({
    topic,
    objective,
    ideas,
    user: { _link: userId },
    ...(studyMaterialId ? { studyMaterial: { _link: studyMaterialId } } : {})
  });
  
  return brainstorm;
};

/**
 * Generate structured ideas based on the objective type
 */
function generateIdeasForObjective(topic: string, objective: string, context: string = ""): any {
  // Base ideas structure with common fields
  const baseIdeas = {
    mainIdeas: [],
    supportingPoints: [],
    perspectives: [],
    createdAt: new Date().toISOString()
  };
  
  // Generate specific idea structure based on the objective
  switch (objective) {
    case "Essay":
      return {
        ...baseIdeas,
        thesisStatements: [
          `${topic} is important because it fundamentally changes our understanding of the subject.`,
          `The evolution of ${topic} reveals significant insights about broader societal trends.`,
          `Contrary to popular belief, ${topic} demonstrates several unexpected patterns worth exploring.`
        ],
        mainIdeas: [
          `Historical context of ${topic}`,
          `Major theoretical frameworks for understanding ${topic}`,
          `Contemporary challenges related to ${topic}`,
          `Future implications of ${topic}`
        ],
        supportingPoints: [
          `Statistical evidence showing trends in ${topic}`,
          `Expert opinions validating the significance of ${topic}`,
          `Case studies demonstrating real-world applications of ${topic}`
        ],
        counterarguments: [
          `Some scholars argue that ${topic} is overemphasized in current discourse`,
          `Alternative explanations that challenge conventional views on ${topic}`,
          `Limitations in current methodologies used to study ${topic}`
        ]
      };
      
    case "Project":
      return {
        ...baseIdeas,
        approaches: [
          `Analytical approach: Breaking down ${topic} into component parts for detailed study`,
          `Comparative approach: Examining ${topic} across different contexts or time periods`,
          `Experimental approach: Testing hypotheses about ${topic} through structured experiments`
        ],
        methodologies: [
          `Qualitative research methods to explore nuances of ${topic}`,
          `Quantitative analysis to measure key aspects of ${topic}`,
          `Mixed methods approach combining multiple perspectives on ${topic}`
        ],
        potentialOutcomes: [
          `Development of new theoretical framework for understanding ${topic}`,
          `Creation of practical tools or resources related to ${topic}`,
          `Publication of findings that challenge existing assumptions about ${topic}`
        ],
        resources: [
          `Key academic journals focusing on ${topic}`,
          `Notable experts in the field of ${topic}`,
          `Databases or archives containing information about ${topic}`
        ]
      };
      
    case "Problem-Solving":
      return {
        ...baseIdeas,
        problemDefinitions: [
          `Core challenges presented by ${topic}`,
          `Underlying causes contributing to issues with ${topic}`,
          `Stakeholders affected by problems related to ${topic}`
        ],
        solutions: [
          `Immediate tactical approaches to address ${topic}`,
          `Strategic long-term solutions for ${topic}`,
          `Innovative or unconventional approaches to ${topic}`,
          `Technological interventions that could transform ${topic}`
        ],
        evaluationCriteria: [
          `Effectiveness: How well the solution addresses core issues of ${topic}`,
          `Feasibility: Practical considerations for implementing solutions to ${topic}`,
          `Sustainability: Long-term viability of proposed solutions to ${topic}`,
          `Scalability: Potential to expand solutions to broader contexts related to ${topic}`
        ],
        implementationSteps: [
          `Initial pilot testing of solutions for ${topic}`,
          `Gathering feedback and refining approaches to ${topic}`,
          `Scaling successful interventions related to ${topic}`,
          `Measuring and reporting outcomes of solutions for ${topic}`
        ]
      };
      
    case "General":
    default:
      return {
        ...baseIdeas,
        mainIdeas: [
          `Key concept 1 related to ${topic}`,
          `Key concept 2 related to ${topic}`,
          `Key concept 3 related to ${topic}`,
          `Key concept 4 related to ${topic}`
        ],
        connections: [
          `How ${topic} relates to other fields or disciplines`,
          `Historical evolution of thinking about ${topic}`,
          `Contemporary relevance of ${topic}`
        ],
        applications: [
          `Practical uses of knowledge about ${topic}`,
          `Ways to implement insights from ${topic}`,
          `Educational approaches to teaching about ${topic}`
        ],
        questions: [
          `What are the fundamental principles underlying ${topic}?`,
          `How has understanding of ${topic} evolved over time?`,
          `What are common misconceptions about ${topic}?`,
          `Where is the field of ${topic} likely to go in the future?`
        ]
      };
  }
}

// Define custom parameters
export const params = {
  topic: { 
    type: "string"
  },
  objective: { 
    type: "string",
    enum: ["Essay", "Project", "Problem-Solving", "General"] 
  },
  studyMaterialId: { 
    type: "string" 
  }
};

export const options: ActionOptions = {
  returnType: true
};