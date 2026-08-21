import { ChatMessage, FileAttachment } from "@/types/chat";

const API_BASE = "https://travelling-klein-bargains-obituaries.trycloudflare.com/api/v1/chat";

export function getWelcomeMessages(): ChatMessage[] {
  return [
    {
      id: "welcome-1",
      role: "assistant",
      content: "Hello! I am your Materna AI Assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ];
}

export async function uploadFileForOCR(file: File): Promise<{ ocrResult: any }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer MOCK_TOKEN" // Assuming standard auth header
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload file");
  }

  const data = await res.json();
  return { ocrResult: data.ocrResult };
}

// Internal helper to read the SSE stream and return the final message
async function fetchChatStream(
  content: string, 
  escalate: boolean, 
  chatHistory: {role: string, content: string}[] = [],
  labResults: any = null
): Promise<ChatMessage> {
  const url = `${API_BASE}/stream`;
  
  const body = {
    message: content,
    patient_id: "mock-patient-id",
    escalate,
    chat_history: chatHistory,
    lab_results: labResults
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Bearer MOCK_TOKEN",
      "Accept": "text/event-stream",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.body) {
    throw new Error("No readable stream");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let finalContent = "";
  let done = false;
  let buffer = "";

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || ""; // Keep the last incomplete chunk in the buffer

      for (const part of parts) {
        if (part.startsWith("data: ")) {
          try {
            const data = JSON.parse(part.slice(6));
            if (data.event === "chat_chunk") {
              finalContent += data.content;
            } else if (data.event === "agent_thought" && data.agent === "System") {
              finalContent += "\n\n**System Notice:** " + data.content + "\n\n";
            }
          } catch (e) {
            console.error("Failed to parse SSE chunk:", part, e);
          }
        }
      }
    }
  }

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: finalContent.trim() || "Simulation finished.",
    timestamp: new Date().toISOString(),
  };
}

export async function sendChatMessage(
  content: string, 
  chatHistory: {role: string, content: string}[] = [],
  labResults: any = null
): Promise<ChatMessage> {
  return fetchChatStream(content, false, chatHistory, labResults);
}

export async function sendChatMessageWithEscalation(
  content: string,
  chatHistory: {role: string, content: string}[] = [],
  labResults: any = null
): Promise<ChatMessage> {
  return fetchChatStream(content, true, chatHistory, labResults);
}
