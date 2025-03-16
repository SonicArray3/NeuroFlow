import { ActionOptions } from "gadget-server";

export const params = {
  studyMaterialId: {
    type: "string"
  }
};

export const run: ActionRun = async ({ params, logger, api, session }) => {
  const { studyMaterialId } = params;
  
  if (!studyMaterialId) {
    throw new Error("Study material ID is required");
  }
  
  // Get the current user ID from the session
  const userId = session?.get("user");
  if (!userId) {
    throw new Error("User must be authenticated to generate a mind map");
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
  
  // Verify the user has permission to access this material
  if (studyMaterial.user.id !== userId) {
    throw new Error("You don't have permission to access this study material");
  }
  
  // Extract content from the study material
  const content = studyMaterial.content.markdown;
  const title = studyMaterial.title;
  
  // Analyze the content to extract main concepts, subtopics, and details
  const centralConcept = title;
  
  // Generate structured nodes and connections
  const nodes = generateNodes(content, title);
  const connections = generateConnections(nodes);
  
  // Create a new MindMap record
  const mindMap = await api.mindMap.create({
    title: `Mind Map: ${title}`,
    centralConcept,
    nodes,
    connections,
    lastInteractionDate: new Date().toISOString(),
    studyMaterial: {
      _link: studyMaterialId
    },
    user: {
      _link: userId
    }
  });
  
  return mindMap;
};

/**
 * Generates nodes based on the content of the study material
 */
function generateNodes(content: string, title: string) {
  // Simple algorithm to extract concepts and generate nodes
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  // Create the main/central node
  const nodes = [
    {
      id: "node-0",
      title,
      description: "Central topic",
      level: 0,
      importance: 5,
      color: "#4361EE"
    }
  ];
  
  // Extract headings and important sentences as nodes
  const headingRegex = /^#+\s+(.+)$/gm;
  const headings = [...content.matchAll(headingRegex)];
  
  // Extract all headings as level 1 nodes
  headings.forEach((match, index) => {
    const headingText = match[1];
    nodes.push({
      id: `node-1-${index}`,
      title: headingText,
      description: "Primary subtopic",
      level: 1,
      importance: 4,
      parentId: "node-0",
      color: "#3A0CA3"
    });
  });
  
  // Extract sentences that might represent concepts (simplified approach)
  const sentences = content
    .replace(/\n/g, ' ')
    .split(/\.\s+/)
    .filter(s => 
      s.length > 30 && 
      s.length < 150 && 
      (s.includes("important") || s.includes("key") || s.includes("concept") || s.includes("definition"))
    );
  
  // Add important sentences as level 2 nodes
  sentences.forEach((sentence, index) => {
    // Determine which level 1 node this should connect to
    // This is a simple algorithm - a more sophisticated NLP approach would be better
    const bestParentIndex = index % headings.length;
    const parentId = `node-1-${bestParentIndex}`;
    
    nodes.push({
      id: `node-2-${index}`,
      title: sentence.substring(0, 40) + "...",
      description: sentence,
      level: 2,
      importance: 3,
      parentId,
      color: "#7209B7"
    });
  });
  
  return nodes;
}

/**
 * Generates connections between nodes
 */
function generateConnections(nodes: any[]) {
  const connections = [];
  
  // Create connections based on parent-child relationships
  for (const node of nodes) {
    if (node.parentId) {
      connections.push({
        id: `connection-${node.parentId}-${node.id}`,
        sourceId: node.parentId,
        targetId: node.id,
        type: "hierarchical",
        strength: node.level === 1 ? 5 : 3,
        label: node.level === 1 ? "subtopic" : "detail"
      });
    }
  }
  
  // Add some cross-connections between sibling nodes at level 2
  const level2Nodes = nodes.filter(node => node.level === 2);
  
  // Connect some level 2 nodes that share the same parent
  const parentGroups = {};
  level2Nodes.forEach(node => {
    if (!parentGroups[node.parentId]) {
      parentGroups[node.parentId] = [];
    }
    parentGroups[node.parentId].push(node);
  });
  
  // For each group of siblings, add some connections
  Object.values(parentGroups).forEach((group: any[]) => {
    if (group.length > 1) {
      // Connect some nodes in this group
      for (let i = 0; i < group.length - 1; i++) {
        if (Math.random() > 0.5) { // Only create connections for some nodes
          connections.push({
            id: `connection-${group[i].id}-${group[i+1].id}`,
            sourceId: group[i].id,
            targetId: group[i+1].id,
            type: "related",
            strength: 2,
            label: "related"
          });
        }
      }
    }
  });
  
  return connections;
}

export const options: ActionOptions = {
  returns: "result"
};