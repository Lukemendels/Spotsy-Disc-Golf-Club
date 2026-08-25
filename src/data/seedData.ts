import { Course, Officer, Event, Round } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

// Reference directory for the concept demo. Course facts/layouts were checked against
// current UDisc/PDGA/local course information in August 2026. The live app deliberately
// uses this static list rather than the original Gemini-generated Firestore seed data.
export const INITIAL_COURSES: Course[] = [
  {
    id: "loriella-park",
    name: "Loriella Park",
    location: "10910 Leavells Rd, Fredericksburg, VA 22407",
    layouts: [
      "White Tees → Red Baskets",
      "White Tees → Yellow Baskets",
      "Red Tees → Red Baskets",
      "Red Tees → Yellow Baskets",
    ],
    difficulty: "Intermediate",
    beginnerFriendly: true,
    accessFees: "Free / public county park",
    directionsUrl: "https://maps.google.com/?q=Loriella+Park+Disc+Golf+Course",
    sourceUrl: "https://udisc.com/courses/loriella-park-4MIw",
    notes: "18 holes with two tee sets and red/yellow basket positions. No Gold layout.",
    holes: 18,
    image: "https://images.unsplash.com/photo-1593111774601-dfbce7de160c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cannon-ridge",
    name: "Cannon Ridge",
    location: "Fredericksburg, VA — private course; contact owner before playing",
    layouts: [
      "White Tees → Regular Baskets",
      "White Tees → Short Baskets",
      "White Tees → Long Baskets",
      "Blue Tees → Regular Baskets",
    ],
    difficulty: "Advanced",
    beginnerFriendly: false,
    accessFees: "Private / permission required",
    directionsUrl: "https://maps.google.com/?q=Cannon+Ridge+Disc+Golf+Fredericksburg+VA",
    sourceUrl: "https://udisc.com/courses/cannon-ridge-PTRU",
    notes: "18-hole private course with multiple tee/basket combinations.",
    holes: 18,
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "wilderness-ridge",
    name: "Wilderness Ridge",
    location: "Wilderness Presidential Resort, Chancellorsville, VA",
    layouts: ["Main (18 holes)"],
    difficulty: "Advanced",
    beginnerFriendly: false,
    accessFees: "$10/day; free for Spotsy club members with tag",
    directionsUrl: "https://maps.google.com/?q=38.2993283071001,-77.66514771477672",
    sourceUrl: "https://udisc.com/courses/wilderness-ridge-FxkV",
    notes: "Wooded resort course. Check UDisc/resort information for current access details.",
    holes: 18,
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "hazel-grove-wpr",
    name: "Hazel Grove at WPR",
    location: "Wilderness Presidential Resort, Chancellorsville, VA",
    layouts: ["Yellow Baskets (Short)", "Blue Baskets (Long)", "Main Full Course"],
    difficulty: "Beginner",
    beginnerFriendly: true,
    accessFees: "Resort access / check current WPR details",
    directionsUrl: "https://maps.google.com/?q=Hazel+Grove+Wilderness+Presidential+Resort",
    sourceUrl: "https://udisc.com/courses/hazel-grove-at-wpr-3QAd",
    notes: "9-hole course with short and long basket options; UDisc also maintains a full-course layout.",
    holes: 9,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "curtis-memorial",
    name: "Curtis Memorial Park",
    location: "58 Jesse Curtis Ln, Fredericksburg, VA 22406",
    layouts: [
      "Red Tees → Short Baskets",
      "Red Tees → Long Baskets",
      "White Tees → Short Baskets",
      "White Tees → Long Baskets",
      "Blue Tees → Short Baskets",
      "Blue Tees → Long Baskets",
    ],
    difficulty: "Advanced",
    beginnerFriendly: true,
    accessFees: "Free / public park",
    directionsUrl: "https://maps.google.com/?q=58+Jesse+Curtis+Ln+Fredericksburg+VA+22406",
    sourceUrl: "https://udisc.com/courses/curtis-memorial-park-5Q2t",
    notes: "18 holes; three concrete tee sets and two basket sets per hole provide six physical combinations.",
    holes: 18,
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "pratt-park",
    name: "John Lee Pratt Park DGC",
    location: "120 River Rd, Fredericksburg, VA 22405",
    layouts: ["Main (18 holes)"],
    difficulty: "Intermediate",
    beginnerFriendly: true,
    accessFees: "Free / public park",
    directionsUrl: "https://maps.google.com/?q=120+River+Rd+Fredericksburg+VA+22405",
    sourceUrl: "https://udisc.com/courses/john-lee-pratt-park-dgc-MyoP",
    notes: "UDisc currently cautions that the back nine is in poor/abandoned condition; check before playing.",
    holes: 18,
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "six-bears-goat",
    name: "6 Bears & a Goat Putting Course",
    location: "1140 International Pkwy, Fredericksburg, VA 22406",
    layouts: ["Main (9 holes, par 2)"],
    difficulty: "Beginner",
    beginnerFriendly: true,
    accessFees: "Free to play",
    directionsUrl: "https://maps.google.com/?q=1140+International+Pkwy+Fredericksburg+VA+22406",
    sourceUrl: "https://udisc.com/courses/6-b-and-g-Vfm1",
    notes: "Short 9-hole putting/approach course behind the brewery; maximum throw is about 100 ft.",
    holes: 9,
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "hawk-hollow",
    name: "Hawk Hollow",
    location: "7201 Belmont Rd, Mineral, VA",
    layouts: ["April 2026 (18 holes)"],
    difficulty: "Pro",
    beginnerFriendly: false,
    accessFees: "$10/day; limited/private access — contact owner",
    directionsUrl: "https://maps.google.com/?q=7201+Belmont+Rd+Mineral+VA",
    sourceUrl: "https://udisc.com/courses/hawk-hollow-bj5B",
    notes: "30-hole property; current UDisc scoring layout is the 18-hole April 2026 layout. Check access/status before traveling.",
    holes: 30,
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80",
  },
];

export const INITIAL_OFFICERS: Officer[] = [
  {
    id: "bob-cannon",
    name: "Bob Cannon",
    roleTitle: "President",
    bio: "Longtime Spotsy Disc Golf Club president, tournament director, and Virginia disc golf organizer.",
    contactChannel: "Club contact details to be confirmed before implementation",
  },
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: "demo-thursday-league",
    title: "Thursday Night League — Demo Event",
    category: "League",
    courseId: "loriella-park",
    layout: "White Tees → Red Baskets",
    startDateTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    description: "Example club event showing how league information could appear in the platform. Exact weekly details remain authoritative in the club's current systems.",
    isOfficial: false,
    isDemo: true,
  },
];

export const INITIAL_ROUNDS: Round[] = [
  {
    id: "round-1",
    courseId: "loriella-park",
    layout: "White Tees → Red Baskets",
    teeTime: new Date(Date.now() + 3600000 * 18).toISOString(),
    organizerId: "demo-organizer",
    organizerName: "Demo Organizer",
    maxCapacity: 4,
    participantIds: ["demo-player-1", "demo-player-2"],
    participantNames: { "demo-player-1": "Player 01", "demo-player-2": "Player 02" },
    pace: "Standard",
    isBeginnerFriendly: true,
    notes: "Example casual round for the concept demo.",
    status: "open",
  },
];

export async function seedFirestoreIfEmpty() {
  try {
    const coursesSnap = await getDocs(collection(db, "courses"));
    if (coursesSnap.empty) {
      for (const course of INITIAL_COURSES) await setDoc(doc(db, "courses", course.id), course);
    }

    const officersSnap = await getDocs(collection(db, "officers"));
    if (officersSnap.empty) {
      for (const officer of INITIAL_OFFICERS) await setDoc(doc(db, "officers", officer.id), officer);
    }

    const eventsSnap = await getDocs(collection(db, "events"));
    if (eventsSnap.empty) {
      for (const event of INITIAL_EVENTS) await setDoc(doc(db, "events", event.id), event);
    }

    const roundsSnap = await getDocs(collection(db, "rounds"));
    if (roundsSnap.empty) {
      for (const round of INITIAL_ROUNDS) await setDoc(doc(db, "rounds", round.id), round);
    }
  } catch (err) {
    console.error("Error seeding initial data to Firestore:", err);
  }
}
