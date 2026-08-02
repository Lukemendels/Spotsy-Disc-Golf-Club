export type CategoryType = "League" | "Tournament" | "Beginner" | "Meeting" | "Workday" | "Closure";

export interface Event {
  id: string;
  title: string;
  category: CategoryType;
  courseId: string;
  startDateTime: string; // ISO string for robust date parsing & display
  description: string;
  isOfficial: boolean;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  layouts: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  beginnerFriendly: boolean;
  accessFees: string;
  directionsUrl: string;
  image?: string;
}

export interface Round {
  id: string;
  courseId: string;
  layout: string;
  teeTime: string; // ISO string
  organizerId: string;
  organizerName: string;
  maxCapacity: number;
  participantIds: string[];
  participantNames?: Record<string, string>;
  pace: "Relaxed" | "Standard" | "Fast";
  isBeginnerFriendly: boolean;
  notes: string;
  status: "open" | "full" | "cancelled" | "completed";
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string; // ISO string
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  preferredCourse: string;
  experienceLevel: "Novice" | "Intermediate" | "Advanced" | "Pro";
  role: "public" | "user" | "moderator" | "club_admin";
  createdAt: string;
}

export interface Officer {
  id: string;
  name: string;
  roleTitle: "President" | "Vice President" | "Treasurer" | "Board Member";
  bio: string;
  contactChannel: string;
  avatar?: string;
}

export interface BeginnerSignup {
  id?: string;
  name: string;
  email: string;
  experience: string;
  interest: string;
  createdAt: string;
}

export interface AnnouncementSubscription {
  id?: string;
  email: string;
  createdAt: string;
}
