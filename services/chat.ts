import { api } from "@/lib/api";
import { API_BASE } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

export type ChatMessageDto = {
  id: string;
  sender: string;
  body: string;
  image?: string | null;
  created_at: string;
};

export type ChatRoomListItemDto = {
  id: string;
  job: string;
  service_request_id?: string;
  contact_name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  created_at: string;
};

export function toWsBase() {
  const raw = API_BASE.replace(/\/api\/v1\/?$/, "");
  if (raw.startsWith("https://")) return `wss://${raw.slice("https://".length)}`;
  if (raw.startsWith("http://")) return `ws://${raw.slice("http://".length)}`;
  return raw;
}

export async function listChatRooms() {
  const { data } = await api.get<ChatRoomListItemDto[] | { results?: ChatRoomListItemDto[] | null }>("/chat/");
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function getChatRoom(jobId: string) {
  const { data } = await api.get<{ id: string; job: string; messages: ChatMessageDto[]; created_at: string }>(
    `/chat/jobs/${jobId}/`,
  );
  return data;
}

export async function postChatMessage(jobId: string, body: { body: string }) {
  const { data } = await api.post<ChatMessageDto>(`/chat/jobs/${jobId}/messages/`, body);
  return data;
}

export function connectJobChat(jobId: string): WebSocket | null {
  const token = useAuthStore.getState().access;
  if (!token) return null;
  const wsUrl = `${toWsBase()}/ws/jobs/${jobId}/chat/?token=${encodeURIComponent(token)}`;
  return new WebSocket(wsUrl);
}
