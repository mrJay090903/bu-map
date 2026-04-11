import type { PresetDestination } from "../types/navigation";
import type { ConversationMessage } from "../types/conversation";
import { getCampusDirectoryText } from "../data/campusDirectory";

const OPENAI_API_KEY = (import.meta.env.VITE_OPENAI_API_KEY ?? "").trim();
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export function isOpenAIConfigured(): boolean {
  return OPENAI_API_KEY.length > 0;
}

export type ChatGPTResponse = {
  destination: string | null;
  message: string;
  confidence: "high" | "medium" | "low";
};

/**
 * Send voice command to ChatGPT for intelligent processing
 * ChatGPT will understand the user's intent and match it to preset destinations
 */
export async function processVoiceCommandWithChatGPT(
  voiceCommand: string,
  availableDestinations: PresetDestination[],
): Promise<ChatGPTResponse> {
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local",
    );
  }

  // Build a list of available destinations for ChatGPT context
  const destinationList = availableDestinations
    .map((dest) => {
      const keywords = dest.keywords.join(", ");
      return `- ${dest.label} (keywords: ${keywords})`;
    })
    .join("\n");

  // Get complete campus directory for detailed room/building knowledge
  const campusDirectory = getCampusDirectoryText();

  const systemPrompt = `You are an AI navigation assistant for Bicol University Polangui campus. Your role is to help users navigate to campus locations and provide information about specific rooms and buildings.

${campusDirectory}

Main Navigation Destinations (mappable locations):
${destinationList}

When a user provides a voice command:
1. Determine if they want to go to a specific location
2. If they mention a specific room (like "SB-11", "Computer Lab 3", "Library"), acknowledge it and guide them to the appropriate building
3. Match their request to one of the main navigation destinations above
4. Provide helpful information about what's in that building or room
5. If the match is clear, respond with the exact destination label
6. If unclear, ask for clarification or provide helpful suggestions

Your response MUST be a JSON object with this exact structure:
{
  "destination": "exact destination label or null",
  "message": "helpful message to the user",
  "confidence": "high" | "medium" | "low"
}

Examples:
- User: "take me to the gym" → {"destination": "BUP GYM", "message": "Navigating to BUP GYM. The gym has the Alumni Office on the first floor and Physical Plant Office on the second floor.", "confidence": "high"}
- User: "where is computer lab 3" → {"destination": "Center for Computer and Engineering Studies / Salceda Building", "message": "Computer Lab 3 (CL3) is on the second floor of the Center for Computer and Engineering Studies. I'll navigate you there.", "confidence": "high"}
- User: "I need to go to the library" → {"destination": "Center for Computer and Engineering Studies / Salceda Building", "message": "The library is on the second floor of Salceda Building. Room 1 has the Circulation and Reading Section, and Room 2 has the General Reference Section.", "confidence": "high"}
- User: "take me to the nursing department" → {"destination": "Center for Computer and Engineering Studies / Salceda Building", "message": "The Nursing Department has the simulation room, skills laboratory, and various specialized rooms. I'll guide you there.", "confidence": "high"}
- User: "where is SB-11" → {"destination": "Center for Computer and Engineering Studies / Salceda Building", "message": "SB-11 is the General/Analytical Chemistry Laboratory on the first floor of Salceda Building.", "confidence": "high"}`;

  const userMessage = `User voice command: "${voiceCommand}"`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[ChatGPT] API request failed:",
        response.status,
        errorText,
      );
      throw new Error(
        `ChatGPT API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("ChatGPT returned empty response");
    }

    const parsedResponse = JSON.parse(content) as ChatGPTResponse;
    console.log("[ChatGPT] Response:", parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error("[ChatGPT] Error processing voice command:", error);
    throw error;
  }
}

/**
 * Chat with AI in a conversational manner about campus navigation
 * Maintains conversation history and can trigger navigation actions
 */
export async function chatWithAI(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  context: {
    currentLocation?: string;
    destination?: string;
    availableDestinations: PresetDestination[];
    isNavigating: boolean;
    routeInfo?: {
      distance: number;
      duration: number;
      profile: "foot" | "driving";
      steps: Array<{ instruction: string; distance: number }>;
    };
  },
): Promise<{ message: string; action?: { type: "navigate"; destination: string } }> {
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local",
    );
  }

  const destinationList = context.availableDestinations
    .map((dest) => {
      const keywords = dest.keywords.join(", ");
      return `- ${dest.label} (keywords: ${keywords})`;
    })
    .join("\n");

  // Get complete campus directory for detailed room/building knowledge
  const campusDirectory = getCampusDirectoryText();

  // Build route information if available
  let routeDetails = "";
  if (context.routeInfo && context.destination) {
    const distanceKm = (context.routeInfo.distance / 1000).toFixed(2);
    const durationMin = Math.ceil(context.routeInfo.duration / 60);
    const mode = context.routeInfo.profile === "foot" ? "walking" : "driving";
    
    routeDetails = `
Current Route Information:
- From: ${context.currentLocation || "current location"}
- To: ${context.destination}
- Distance: ${distanceKm} km (${context.routeInfo.distance} meters)
- Duration: ${durationMin} minutes
- Mode: ${mode}
- Steps: ${context.routeInfo.steps.length} navigation steps

Navigation Steps:
${context.routeInfo.steps.map((step, i) => `${i + 1}. ${step.instruction} (${step.distance}m)`).join("\n")}
`;
  }

  const systemPrompt = `You are a helpful AI assistant for Bicol University Polangui campus navigation. You help students and visitors navigate the campus and answer questions about campus locations, rooms, and facilities.

${campusDirectory}

Main Navigation Destinations (mappable locations):
${destinationList}

${context.currentLocation ? `Current location: ${context.currentLocation}` : ""}
${context.destination ? `Current destination: ${context.destination}` : ""}
${context.isNavigating ? "User is currently navigating to a destination." : ""}
${routeDetails}

You can:
1. Answer questions about specific rooms, offices, and facilities (e.g., "Where is Computer Lab 3?", "What's in the Nursing Department?")
2. Provide directions and route information to buildings
3. Give detailed information about what's available in each building and floor
4. Help users find specific rooms by name or code (e.g., "SB-11", "ECB-14", "CL3")
5. Provide details about the current route (distance, duration, turn-by-turn directions)
6. Help with navigation questions like "How far is it?", "What's the next turn?", "How long will it take?"
7. Have casual conversation about campus life and facilities

When a user wants to navigate somewhere NEW, respond with JSON that includes an action:
{"message": "I'll navigate you to [destination]. The route is approximately X km and will take about Y minutes. [Additional helpful info about rooms/facilities in that building]", "action": {"type": "navigate", "destination": "exact destination label"}}

When user asks about a SPECIFIC ROOM or OFFICE, provide helpful details and navigate to the building:
{"message": "Computer Lab 3 (CL3) is on the second floor of the Center for Computer and Engineering Studies. I'll navigate you to the building now.", "action": {"type": "navigate", "destination": "Center for Computer and Engineering Studies / Salceda Building"}}

When user asks about the CURRENT route, provide details using the route information above:
{"message": "You're heading to [destination]. It's X km away and will take about Y minutes. Your next turn is: [instruction]"}

For general questions about facilities, rooms, or campus layout, respond normally with:
{"message": "your helpful and detailed response"}

Be friendly, helpful, and conversational. When mentioning rooms or buildings, include helpful context like floor numbers and what the room is used for. Keep responses concise but informative.`;

  // Convert conversation history to OpenAI format
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[ChatGPT] Conversation API request failed:",
        response.status,
        errorText,
      );
      throw new Error(
        `ChatGPT API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("ChatGPT returned empty response");
    }

    const parsedResponse = JSON.parse(content) as {
      message: string;
      action?: { type: "navigate"; destination: string };
    };

    console.log("[ChatGPT] Conversation response:", parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error("[ChatGPT] Error in conversation:", error);
    throw error;
  }
}

/**
 * Ask ChatGPT a general question about campus navigation
 */
export async function askChatGPTQuestion(
  question: string,
  context: {
    currentLocation?: string;
    destination?: string;
    availableDestinations: PresetDestination[];
  },
): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local",
    );
  }

  const destinationList = context.availableDestinations
    .map((dest) => `- ${dest.label}: ${dest.summary}`)
    .join("\n");

  const systemPrompt = `You are a helpful AI assistant for Bicol University campus navigation. 
You help students and visitors navigate the campus and answer questions about campus locations.

Available campus locations:
${destinationList}

${context.currentLocation ? `Current location: ${context.currentLocation}` : ""}
${context.destination ? `Current destination: ${context.destination}` : ""}

Provide concise, helpful responses. Keep answers brief (2-3 sentences max) unless detailed information is specifically requested.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`ChatGPT API request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content ?? "I couldn't process that question.";
  } catch (error) {
    console.error("[ChatGPT] Error asking question:", error);
    throw error;
  }
}
