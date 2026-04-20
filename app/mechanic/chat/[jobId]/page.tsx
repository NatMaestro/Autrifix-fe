"use client";

import { ArrowLeft, Camera, FileText, ImagePlus, MessageCircle, Phone, Plus, Send, Smile } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeStore } from "@/store/realtime-store";
import { listJobs } from "@/services/jobs";
import {
  connectJobChat,
  getChatRoom,
  listChatRooms,
  postChatMessage,
  type ChatMessageDto,
} from "@/services/chat";

export default function MechanicChatPage() {
  const params = useParams();
  const router = useRouter();
  const jobIdParam =
    typeof params?.jobId === "string"
      ? params.jobId
      : Array.isArray(params?.jobId)
        ? params.jobId[0]
        : undefined;
  const user = useAuthStore((s) => s.user);
  const { resolvedTheme } = useTheme();
  const pushEvent = useRealtimeStore((s) => s.pushEvent);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountingRef = useRef(false);
  const [wsReady, setWsReady] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const [messages, setMessages] = useState<Array<{ id: string; from: "me" | "them"; text: string; time: string }>>(
    [],
  );
  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const cameraPickerRef = useRef<HTMLInputElement | null>(null);
  const documentPickerRef = useRef<HTMLInputElement | null>(null);
  const roomListQ = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: listChatRooms,
    staleTime: 10_000,
  });
  const jobsQ = useQuery({
    queryKey: ["jobs", "mechanic-chat", jobIdParam],
    queryFn: listJobs,
    enabled: Boolean(jobIdParam),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!jobIdParam) {
      router.replace("/mechanic/messages");
    }
  }, [jobIdParam, router]);

  if (!jobIdParam) {
    return null;
  }

  const jobId = jobIdParam;

  function mapMessage(msg: ChatMessageDto) {
    const from: "me" | "them" = String(msg.sender) === String(user?.id) ? "me" : "them";
    return {
      id: msg.id,
      from,
      text: msg.body,
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  const roomQ = useQuery({
    queryKey: ["chat-room", jobId],
    queryFn: () => getChatRoom(jobId),
    enabled: Boolean(jobId),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!roomQ.data) return;
    const rows = (roomQ.data.messages ?? []).map(mapMessage);
    setMessages(rows);
  }, [roomQ.data, user?.id]);

  const sendMut = useMutation({
    mutationFn: (body: { body: string }) => postChatMessage(jobId, body),
    onError: () => toast.error("Could not send message."),
  });

  useEffect(() => {
    isUnmountingRef.current = false;
    const connect = () => {
      const ws = connectJobChat(jobId);
      if (!ws) return;
      wsRef.current = ws;
      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setWsReady(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as
            | { kind?: string; data?: ChatMessageDto; sender?: string; is_typing?: boolean }
            | ChatMessageDto;
          if ("kind" in parsed && parsed.kind === "typing") {
            const fromMe = String(parsed.sender) === String(user?.id);
            if (!fromMe) {
              setIsPeerTyping(Boolean(parsed.is_typing));
              if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
              typingTimerRef.current = window.setTimeout(() => setIsPeerTyping(false), 1800);
            }
            return;
          }
          const payload = "data" in parsed && parsed.data ? parsed.data : (parsed as ChatMessageDto);
          if (!payload?.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            const mapped = mapMessage(payload);
            const withoutTemp = prev.filter((m) => !(m.id.startsWith("tmp-") && m.text === mapped.text));
            return [...withoutTemp, mapped];
          });
        } catch {
          // Ignore malformed frames.
        }
      };
      ws.onerror = () => {
        setWsReady(false);
      };
      ws.onclose = () => {
        setWsReady(false);
        if (isUnmountingRef.current) return;
        const backoffMs = Math.min(4000, 500 * Math.max(1, reconnectAttemptsRef.current + 1));
        reconnectAttemptsRef.current += 1;
        if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(connect, backoffMs);
      };
    };
    connect();

    return () => {
      isUnmountingRef.current = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setWsReady(false);
    };
  }, [jobId, user?.id]);

  async function waitForWsOpen(timeoutMs = 1200) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (wsRef.current?.readyState === WebSocket.OPEN) return true;
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    return false;
  }

  async function send() {
    if (!draft.trim()) return;
    const text = draft.trim();
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      from: "me" as const,
      text,
      time: "now",
    };
    setMessages((prev) => [...prev, optimistic]);
    const canUseWs = wsRef.current && (wsReady || wsRef.current.readyState === WebSocket.OPEN || (await waitForWsOpen()));
    if (canUseWs && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ body: text }));
    } else {
      try {
        await sendMut.mutateAsync({ body: text });
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return;
      }
    }
    pushEvent("chat:send");
    setDraft("");
    if (draftRef.current) {
      draftRef.current.style.height = "44px";
      draftRef.current.style.overflowY = "hidden";
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ kind: "typing", is_typing: false }));
    }
  }

  function resizeDraftArea(nextValue: string) {
    const el = draftRef.current;
    if (!el) return;
    if (!nextValue) {
      el.style.height = "44px";
      el.style.overflowY = "hidden";
      return;
    }
    const maxHeightPx = 176; // ~8 lines at text-sm
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeightPx)}px`;
    el.style.overflowY = el.scrollHeight > maxHeightPx ? "auto" : "hidden";
  }

  const sending = useMemo(() => sendMut.isPending, [sendMut.isPending]);
  const contacts = Array.isArray(roomListQ.data) ? roomListQ.data : [];
  const hasConnectedDrivers = contacts.length > 0;
  const currentContact =
    contacts.find((room) => room.job === jobId) ??
    (jobId
      ? {
          id: `active-${jobId}`,
          job: jobId,
          contact_name:
            (jobsQ.data ?? []).find((j) => j.id === jobId)?.driver_name ||
            null,
          last_message: null,
        }
      : null);
  const canChatInCurrentThread = Boolean(jobId);
  const threadDriverName = currentContact?.contact_name || "Driver";
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = messagesViewportRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isPeerTyping]);

  function onMessagesScroll() {
    const el = messagesViewportRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 48;
  }

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) setAttachMenuOpen(false);
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(target)) setEmojiOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function onAttachmentSelected(file?: File) {
    if (!file) return;
    toast.success(`${file.name} attached`);
  }

  function appendEmoji(emoji: string) {
    setDraft((prev) => {
      const next = `${prev}${emoji}`;
      queueMicrotask(() => resizeDraftArea(next));
      return next;
    });
    draftRef.current?.focus();
  }

  return (
    <div className="box-border h-full overflow-hidden bg-slate-50 px-4 pb-4 pt-4 overscroll-none dark:bg-transparent">
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[280px_1fr]">
        <GlassCard className="hidden h-full min-h-0 flex-col border-slate-300/70 bg-white/95 p-3 lg:flex dark:border-white/10 dark:bg-[#1a2437]/90">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">Chats</p>
          {hasConnectedDrivers ? (
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {contacts.map((room) => {
                const isActive = room.job === jobId;
                return (
                  <Link
                    key={room.id}
                    href={`/mechanic/chat/${room.job}`}
                    className={
                      isActive
                        ? "block rounded-xl border border-[#00E676]/35 bg-emerald-50 px-3 py-2 dark:bg-[#163b34]/60"
                        : "block rounded-xl border border-slate-300/70 bg-white px-3 py-2 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    }
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{room.contact_name || "Driver"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-white/60">
                      {room.last_message || "No messages yet"}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300/70 bg-slate-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
              <MessageCircle className="mx-auto h-5 w-5 text-slate-500 dark:text-white/45" />
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-white/85">No connected drivers</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-white/55">
                You currently have no active chats.
              </p>
            </div>
          )}
        </GlassCard>

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 dark:border-transparent dark:bg-transparent">
          <GlassCard className="mb-3 border-slate-300/70 bg-white/95 dark:border-white/10 dark:bg-[#253247]/90">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sora text-3xl text-slate-900 dark:text-white">{threadDriverName}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-600 dark:text-[#8ef7bb]">Active thread</p>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/mechanic/messages" className="lg:hidden">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" /> Chats
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
          <div
            ref={messagesViewportRef}
            onScroll={onMessagesScroll}
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-transparent dark:bg-transparent dark:p-0"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={msg.from === "me" ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}>
                <div
                  className={
                    msg.from === "me"
                      ? "rounded-2xl rounded-br-sm bg-slate-300 px-3 py-2 text-sm text-white [color:#fff] dark:bg-[#173153]"
                      : "rounded-2xl rounded-bl-sm border border-slate-300/70 bg-slate-100 px-3 py-2 text-sm text-slate-900 [color:#0f172a] dark:border-white/10 dark:bg-[#253247]/90 dark:text-white/90"
                  }
                >
                  {msg.text}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-white/40">{msg.time}</p>
              </div>
            ))}
            {isPeerTyping ? (
              <p className="mr-auto rounded-xl border border-slate-300/70 bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                Typing...
              </p>
            ) : null}
          </div>
          <div className="mt-3 flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-transparent dark:bg-transparent dark:p-0">
            <input
              ref={pickerRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => onAttachmentSelected(e.target.files?.[0])}
            />
            <input
              ref={cameraPickerRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onAttachmentSelected(e.target.files?.[0])}
            />
            <input
              ref={documentPickerRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              className="hidden"
              onChange={(e) => onAttachmentSelected(e.target.files?.[0])}
            />
            <div ref={attachMenuRef} className="relative">
              <button
                type="button"
                className="rounded-xl border border-slate-300/70 bg-slate-50 p-3 text-slate-700 dark:border-white/10 dark:bg-[#1c2b3d] dark:text-white/60"
                aria-label="Open attachment menu"
                onClick={() => setAttachMenuOpen((v) => !v)}
                disabled={!canChatInCurrentThread}
              >
                <Plus className="h-5 w-5" />
              </button>
              {attachMenuOpen ? (
                <div className="absolute bottom-full left-0 z-20 mb-2 w-52 rounded-xl border border-slate-300/70 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#1a2437]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-white/90 dark:hover:bg-white/10"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      pickerRef.current?.click();
                    }}
                  >
                    <ImagePlus className="h-4 w-4" /> Photos & videos
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-white/90 dark:hover:bg-white/10"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      cameraPickerRef.current?.click();
                    }}
                  >
                    <Camera className="h-4 w-4" /> Camera
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-white/90 dark:hover:bg-white/10"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      documentPickerRef.current?.click();
                    }}
                  >
                    <FileText className="h-4 w-4" /> Document
                  </button>
                </div>
              ) : null}
            </div>
            <div ref={emojiMenuRef} className="relative">
              <button
                type="button"
                className="rounded-xl border border-slate-300/70 bg-slate-50 p-3 text-slate-700 dark:border-white/10 dark:bg-[#1c2b3d] dark:text-white/60"
                aria-label="Open emoji picker"
                onClick={() => setEmojiOpen((v) => !v)}
                disabled={!canChatInCurrentThread}
              >
                <Smile className="h-5 w-5" />
              </button>
              {emojiOpen ? (
                <div className="absolute bottom-full left-0 z-20 mb-2 overflow-hidden rounded-xl border border-slate-300/70 shadow-lg dark:border-white/10">
                  <EmojiPicker
                    theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                    width={280}
                    height={340}
                    searchPlaceholder="Search emojis"
                    lazyLoadEmojis
                    onEmojiClick={(emojiData) => appendEmoji(emojiData.emoji)}
                  />
                </div>
              ) : null}
            </div>
            <textarea
              ref={draftRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                resizeDraftArea(e.target.value);
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ kind: "typing", is_typing: e.target.value.length > 0 }));
                }
              }}
              rows={1}
              placeholder={canChatInCurrentThread ? "Type your message..." : "No active chat yet"}
              className="min-h-[44px] flex-1 resize-none overflow-y-hidden rounded-xl border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-[#00E676]/40 dark:border-white/10 dark:bg-[#0e1626] dark:text-white dark:placeholder:text-white/45"
              disabled={!canChatInCurrentThread}
            />
            <Button type="button" onClick={send} disabled={sending || !canChatInCurrentThread}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
