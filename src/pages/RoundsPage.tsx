import React, { useState } from "react";
import { Course, Round } from "../types";
import { useAuth } from "../context/AuthContext";
import { CreateRoundModal } from "../components/CreateRoundModal";
import { RoundChatThread } from "../components/RoundChatThread";
import { db } from "../lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import {
  Users,
  Plus,
  Clock,
  Sparkles,
  UserCheck,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";

interface RoundsPageProps {
  rounds: Round[];
  courses: Course[];
  onRefresh?: () => void;
}

export const RoundsPage: React.FC<RoundsPageProps> = ({
  rounds,
  courses,
  onRefresh,
}) => {
  const { userProfile, signInDemoUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string>("All");
  const [filterBeginner, setFilterBeginner] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const currentUserId = userProfile?.uid || "";
  const isAdmin = userProfile?.role === "club_admin";

  // Filter rounds
  const filteredRounds = rounds.filter((r) => {
    if (filterCourse !== "All" && r.courseId !== filterCourse) return false;
    if (filterBeginner && !r.isBeginnerFriendly) return false;
    return true;
  });

  // Sort by teeTime ascending
  const sortedRounds = [...filteredRounds].sort(
    (a, b) => new Date(a.teeTime).getTime() - new Date(b.teeTime).getTime()
  );

  const handleJoinRound = async (round: Round) => {
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

    if (round.participantIds?.length >= round.maxCapacity) {
      alert("This casual round card is already full!");
      return;
    }

    setActionLoadingId(round.id);
    try {
      const roundRef = doc(db, "rounds", round.id);
      const isFullNow = (round.participantIds?.length || 0) + 1 >= round.maxCapacity;

      await updateDoc(roundRef, {
        participantIds: arrayUnion(profile.uid),
        [`participantNames.${profile.uid}`]: profile.displayName,
        status: isFullNow ? "full" : "open",
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error joining round:", err);
      alert("Could not join round. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeaveRound = async (round: Round) => {
    if (!currentUserId) return;
    setActionLoadingId(round.id);
    try {
      const roundRef = doc(db, "rounds", round.id);
      await updateDoc(roundRef, {
        participantIds: arrayRemove(currentUserId),
        status: "open",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error leaving round:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (roundId: string, newStatus: "open" | "completed" | "cancelled") => {
    setActionLoadingId(roundId);
    try {
      const roundRef = doc(db, "rounds", roundId);
      await updateDoc(roundRef, { status: newStatus });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating round status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Casual Player Board</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Spotsylvania Casual Rounds
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Post an open card, join local players at Loriella or Pratt, and coordinate tee times in real-time.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Organize a Round</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 card-shadow p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span>Course:</span>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilterBeginner(!filterBeginner)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition ${
              filterBeginner
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-green-600" />
            <span>Beginner Friendly Only</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{sortedRounds.length}</span> casual rounds
        </div>
      </div>

      {/* Rounds List */}
      <div className="space-y-4">
        {sortedRounds.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 rounded-xl text-center space-y-2 card-shadow">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Casual Rounds Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Be the first to post a tee time for local players!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" /> Post a Round
            </button>
          </div>
        ) : (
          sortedRounds.map((round) => {
            const course = courses.find((c) => c.id === round.courseId);
            const isJoined = currentUserId ? round.participantIds?.includes(currentUserId) : false;
            const isOrganizer = currentUserId && round.organizerId === currentUserId;
            const canManage = isOrganizer || isAdmin;
            const currentCount = round.participantIds?.length || 0;
            const isFull = currentCount >= round.maxCapacity;
            const spotsLeft = round.maxCapacity - currentCount;

            const teeTimeDate = new Date(round.teeTime);

            return (
              <div
                key={round.id}
                className="bg-white border border-slate-200 rounded-xl p-5 card-shadow space-y-3 hover:border-slate-300 transition border-l-4 border-l-green-500"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {round.status}
                      </span>
                      {round.isBeginnerFriendly && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Beginner Friendly
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-slate-400" /> Pace: {round.pace}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {course?.name || "Spotsylvania Course"}
                    </h3>
                    <p className="text-xs text-slate-500">Layout: {round.layout}</p>
                  </div>

                  {/* Tee Time & Capacity pill */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-right">
                      <p className="text-xs font-bold text-green-700 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        {teeTimeDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {teeTimeDate.toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-xl border text-center ${
                        isFull
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-green-50 border-green-200 text-green-800"
                      }`}
                    >
                      <p className="text-xs font-extrabold">
                        {currentCount} / {round.maxCapacity}
                      </p>
                      <p className="text-[9px] uppercase font-bold">
                        {isFull ? "Full Card" : `${spotsLeft} Open`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Organizer & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">
                      Organizer:
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-green-600" />
                      {round.organizerName}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Notes:</span>
                    <p className="text-slate-600 italic">{round.notes}</p>
                  </div>
                </div>

                {/* Participant Names Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-semibold text-slate-500">Card Players:</span>
                  {round.participantIds?.map((id) => {
                    const name = round.participantNames?.[id] || (id === currentUserId ? userProfile?.displayName : "Player");
                    return (
                      <span
                        key={id}
                        className={`text-xs px-2.5 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                          id === currentUserId
                            ? "bg-green-100 text-green-800 border-green-300 font-bold"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <UserCheck className="w-3 h-3 text-green-600" />
                        {name} {id === round.organizerId && "(Host)"}
                      </span>
                    );
                  })}
                </div>

                {/* Actions Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {isJoined ? (
                      <button
                        onClick={() => handleLeaveRound(round)}
                        disabled={actionLoadingId === round.id}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-1.5 rounded-lg text-xs border border-rose-200 flex items-center gap-1.5 transition"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Leave Card</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinRound(round)}
                        disabled={isFull || round.status !== "open" || actionLoadingId === round.id}
                        className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isFull ? "Card Full" : "Join Card"}</span>
                      </button>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      {round.status === "open" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(round.id, "completed")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <span>Mark Completed</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(round.id, "cancelled")}
                            className="bg-slate-100 hover:bg-slate-200 text-rose-600 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Round</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Bounded Live Chat Thread */}
                <RoundChatThread round={round} />
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <CreateRoundModal
        courses={courses}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};

