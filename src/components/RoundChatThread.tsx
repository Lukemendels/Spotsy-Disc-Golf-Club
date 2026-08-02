import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Message, Round } from "../types";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { MessageSquare, Send, Lock, AlertCircle } from "lucide-react";

interface RoundChatThreadProps {
  round: Round;
}

export const RoundChatThread: React.FC<RoundChatThreadProps> = ({ round }) => {
  const { userProfile, signInDemoUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = userProfile?.uid || "";
  const isAdmin = userProfile?.role === "club_admin";
  const isParticipant = currentUserId ? round.participantIds?.includes(currentUserId) : false;
  const canChat = (isParticipant || isAdmin) && round.status === "open";
  const isReadOnly = round.status === "completed" || round.status === "cancelled";

  useEffect(() => {
    // Listen to live messages subcollection /rounds/{roundId}/messages
    const messagesRef = collection(db, "rounds", round.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Messages snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [round.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let profile = userProfile;
    if (!profile) {
      await signInDemoUser("user");
      profile = {
        uid: "demo-user-uid-202",
        displayName: "Alex River (Club Member)",
        preferredCourse: "loriella-park",
        experienceLevel: "Intermediate",
        role: "user",
        createdAt: new Date().toISOString(),
      };
    }

    const textToSend = inputText.trim();
    setInputText("");

    try {
      await addDoc(collection(db, "rounds", round.id, "messages"), {
        senderId: profile.uid,
        senderName: profile.displayName,
        text: textToSend,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!isParticipant && !isAdmin) {
    return (
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-2 mt-2">
        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Join this casual round to access card chat & tee time updates.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mt-2 text-xs">
      {/* Header */}
      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <MessageSquare className="w-3.5 h-3.5 text-green-600" />
          <span>Card Chat ({messages.length})</span>
        </div>
        {isReadOnly && (
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
            Read-Only ({round.status})
          </span>
        )}
      </div>

      {/* Messages List */}
      <div className="p-3 max-h-40 overflow-y-auto space-y-2">
        {loading ? (
          <p className="text-slate-400 text-[11px] italic text-center">Loading chat...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-400 text-[11px] italic text-center py-1">
            No messages yet. Say hi to your cardmates!
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] text-slate-500 mb-0.5 font-medium">
                  {m.senderName}{" "}
                  <span className="text-[9px] text-slate-400">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words ${
                    isMe
                      ? "bg-green-600 text-white rounded-tr-none font-medium"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-2xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {canChat ? (
        <form
          onSubmit={handleSendMessage}
          className="p-2 border-t border-slate-200 bg-white flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Coordinate parking or tee times..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold px-3 py-1 rounded-md flex items-center justify-center transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : isReadOnly ? (
        <div className="p-2 bg-slate-100 border-t border-slate-200 text-slate-500 text-[11px] text-center italic flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> Chat closed because this round is {round.status}.
        </div>
      ) : null}
    </div>
  );
};

