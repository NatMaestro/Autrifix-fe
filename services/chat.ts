import { api } from "@/lib/api";

export async function listChatRooms() {
  const { data } = await api.get("/chat/");
  return data;
}

export async function getChatRoom(jobId: string) {
  const { data } = await api.get(`/chat/jobs/${jobId}/`);
  return data;
}

export async function postChatMessage(jobId: string, body: { body: string }) {
  const { data } = await api.post(`/chat/jobs/${jobId}/messages/`, body);
  return data;
}
