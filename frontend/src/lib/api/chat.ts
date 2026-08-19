import { ChatMessage, FileAttachment } from "@/types/chat";

const API_BASE = "http://localhost:8000/api/v1/chat";

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
async function fetchChatStream(content: string, escalate: boolean): Promise<ChatMessage> {
  const url = new URL(`${API_BASE}/stream`);
  url.searchParams.append("message", content);
  url.searchParams.append("patient_id", "mock-patient-id");
  if (escalate) {
    url.searchParams.append("escalate", "true");
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": "Bearer MOCK_TOKEN",
      "Accept": "text/event-stream"
    }
  });

  if (!res.body) {
    throw new Error("No readable stream");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let finalContent = "";
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.event === "chat_chunk") {
              finalContent += data.content;
            }
          } catch (e) {
            // ignore JSON parse errors on partial chunks
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

export async function sendChatMessage(content: string): Promise<ChatMessage> {
  return fetchChatStream(content, false);
}

export async function sendChatMessageWithEscalation(content: string): Promise<ChatMessage> {
  return fetchChatStream(content, true);
}
