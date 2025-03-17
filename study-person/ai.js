const geminiApiKey = "AIzaSyADbBKHj245k7M9LKAacJSUSSG-eK7OvoE"; // Ensure this key is correct

const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyADbBKHj245k7M9LKAacJSUSSG-eK7OvoE"; // Check if this is the correct URL


async function testGeminiAPI(explainedText) {
    try {
        const response = await fetch("https://api.your-gemini-endpoint.com", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${geminiApiKey}`, // Add your API key if required
            },
            body: JSON.stringify({
                model: "gemini-2.0-flash",
                prompt: `You are learning a new topic. Based on this explanation: "${explainedText}", generate 3-5 questions that test understanding.`,
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        const data = await response.json();
        console.log("Gemini API Response:", data);
    } catch (error) {
        console.error("Error with Gemini API:", error);
    }
}

testGeminiAPI("This is an example explanation.");


async function getTranscription() {
    try {
        console.log("Fetching transcription...");
        const response = await fetch("http://localhost:5001/record");
        const data = await response.json();
        
        console.log("Server Response:", data); // ✅ Debug

        if (data.transcription) {
            console.log("✅ Transcribed Speech:", data.transcription);
            return data.transcription;
        } else {
            console.error("❌ No transcription received:", data.error);
            return null;
        }
    } catch (error) {
        console.error("❌ Error fetching transcription:", error);
        return null;
    }
}


async function analyzeAndGenerateQuestions(explainedText) {
    console.log("📡 Sending to Gemini API:", explainedText); // ✅ Debug log

    try {
        const geminiResponse = await env.AI.textGeneration({
            model: "gemini-2.0-flash",
            prompt: `You are learning a new topic. Based on this explanation: "${explainedText}", generate 3-5 questions that test understanding.`,
            temperature: 0.7,
            max_tokens: 500,
        });

        console.log("📡 Gemini API response:", geminiResponse); // ✅ Debug log

        if (!geminiResponse || !geminiResponse.response) {
            console.error("❌ No response from Gemini API.");
            return [];
        }

        return geminiResponse.response;
    } catch (error) {
        console.error("❌ Error calling Gemini API:", error);
        return [];
    }
}


async function askQuestionsAndAnalyzeResponse() {
    const explainedText = await getTranscription();
    if (!explainedText) {
        console.error("No transcription available.");
        return;
    }

    const questions = await analyzeAndGenerateQuestions(explainedText);

    // Simulate asking the user the generated questions
    const userAnswers = await getUserAnswers(questions); // Implement in UI

    // Get feedback on both explanation and answers
    const feedback = await generateFeedback(explainedText, userAnswers);
    console.log("Final Feedback:", feedback);
}

async function generateFeedback(explainedText, userAnswers) {
    const feedbackResponse = await env.AI.textGeneration({
        model: "gemini-2.0-flash",
        prompt: `Explanation: "${explainedText}"\nUser Answers: ${JSON.stringify(userAnswers)}\n\nProvide feedback on understanding, highlighting unclear points and suggesting improvements.`,
        temperature: 0.7,
        max_tokens: 1000,
    });

    return feedbackResponse.response;
}
