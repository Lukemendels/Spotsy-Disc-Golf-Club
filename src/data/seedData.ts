import { Course, Officer, Event, Round } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

export const INITIAL_COURSES: Course[] = [
  {
    id: "loriella-park",
    name: "Loriella Park Disc Golf Course",
    location: "10910 Leavells Rd, Fredericksburg, VA 22407",
    layouts: ["18-Hole Main (Short Tees)", "18-Hole Main (Long Tees)", "18-Hole Gold Layout"],
    difficulty: "Intermediate",
    beginnerFriendly: true,
    accessFees: "Free / Public County Park",
    directionsUrl: "https://maps.google.com/?q=Loriella+Park+Disc+Golf+Course",
    image: "https://images.unsplash.com/photo-1593111774601-dfbce7de160c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "pratt-park",
    name: "John Lee Pratt Memorial Park",
    location: "120 River Rd, Fredericksburg, VA 22405",
    layouts: ["18-Hole Open Layout", "18-Hole Wooded Extension"],
    difficulty: "Beginner",
    beginnerFriendly: true,
    accessFees: "Free / Public County Park",
    directionsUrl: "https://maps.google.com/?q=John+Lee+Pratt+Park+Disc+Golf",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "wilderness-ridge",
    name: "Wilderness Ridge DGC (Club Members)",
    location: "Spotsylvania County, VA (Private Access)",
    layouts: ["18-Hole Championship Layout", "27-Hole Club Special"],
    difficulty: "Advanced",
    beginnerFriendly: false,
    accessFees: "Spotsy Disc Golf Club Badge/Tag Required",
    directionsUrl: "https://maps.google.com/?q=Spotsylvania+VA",
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "hazel-run",
    name: "Hazel Run DGC (Club Members)",
    location: "Fredericksburg / Spotsy Line, VA",
    layouts: ["18-Hole Technical Creek Layout"],
    difficulty: "Intermediate",
    beginnerFriendly: true,
    accessFees: "Spotsy Disc Golf Club Badge/Tag Required",
    directionsUrl: "https://maps.google.com/?q=Fredericksburg+VA",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "hawk-hollow",
    name: "Hawk Hollow DGC",
    location: "Partlow, Spotsylvania County, VA",
    layouts: ["18-Hole Historic Farm Layout"],
    difficulty: "Pro",
    beginnerFriendly: false,
    accessFees: "Private / $5 Day Pass or Club Pass",
    directionsUrl: "https://maps.google.com/?q=Partlow+VA",
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80"
  }
];

export const INITIAL_OFFICERS: Officer[] = [
  {
    id: "bob-cannon",
    name: "Bob Cannon",
    roleTitle: "President",
    bio: "Passionate disc golfer with over 15 years leading course development, tournament directing, and building disc golf community in Spotsylvania.",
    contactChannel: "president@spotsydiscgolf.org / (540) 555-0190"
  },
  {
    id: "pat-mullins",
    name: "Pat Mullins",
    roleTitle: "Vice President",
    bio: "Oversees club operations, casual round scheduling, course maintenance workdays, and member tag matches across local facilities.",
    contactChannel: "vp@spotsydiscgolf.org"
  },
  {
    id: "alexander-beebe",
    name: "Alexander Beebe",
    roleTitle: "Treasurer",
    bio: "Manages club finances, annual bag tag sales, course improvement funds, and official PDGA sanctioning fees.",
    contactChannel: "treasurer@spotsydiscgolf.org"
  },
  {
    id: "jake-mullins",
    name: "Jake Mullins",
    roleTitle: "Board Member",
    bio: "Focuses on course volunteer workdays, tee sign installations, and youth / beginner instructional outreach programs.",
    contactChannel: "board.jake@spotsydiscgolf.org"
  },
  {
    id: "randy-newkirk",
    name: "Randy Newkirk",
    roleTitle: "Board Member",
    bio: "Coordinates club sponsorships, local park department liaisons, and technical layout designs for member-only courses.",
    contactChannel: "board.randy@spotsydiscgolf.org"
  }
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: "event-1",
    title: "Weekly Bag Tag Match - Loriella Park",
    category: "League",
    courseId: "loriella-park",
    startDateTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    description: "Our signature weekly Sunday morning club tag match! Check in at Hole 1 shelter by 9:00 AM. $5 buy-in (optional ace pot). All skill levels welcome.",
    isOfficial: true
  },
  {
    id: "event-2",
    title: "Beginner Friendly Disc Golf Clinic & 9-Hole Walk",
    category: "Beginner",
    courseId: "pratt-park",
    startDateTime: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
    description: "Free instructional session covering grip, backhand form, putting fundamentals, and disc selection. Discs provided for borrowing if needed!",
    isOfficial: true
  },
  {
    id: "event-3",
    title: "Wilderness Ridge Spring Club Open",
    category: "Tournament",
    courseId: "wilderness-ridge",
    startDateTime: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    description: "PDGA C-Tier Sanctioned 2-Round Tournament for Spotsy Club Members. Tag battle + CTP prizes on every hole.",
    isOfficial: true
  },
  {
    id: "event-4",
    title: "Loriella Park Course Clean-Up & Tee Box Trim",
    category: "Workday",
    courseId: "loriella-park",
    startDateTime: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
    description: "Volunteer workday to clear brush around Hole 7 and Hole 14 tee pads. Work gloves and tools provided. Lunch provided by the club!",
    isOfficial: true
  },
  {
    id: "event-5",
    title: "Spotsy Disc Golf Club Monthly Board Meeting",
    category: "Meeting",
    courseId: "loriella-park",
    startDateTime: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
    description: "Open club meeting at Loriella Main Pavilion. We will discuss 2026 Bag Tag distribution, Hawk Hollow pass renewals, and upcoming course improvements.",
    isOfficial: true
  }
];

export const INITIAL_ROUNDS: Round[] = [
  {
    id: "round-1",
    courseId: "loriella-park",
    layout: "18-Hole Main (Short Tees)",
    teeTime: new Date(Date.now() + 3600000 * 18).toISOString(), // 18 hours from now
    organizerId: "bob-cannon-uid",
    organizerName: "Bob Cannon",
    maxCapacity: 4,
    participantIds: ["bob-cannon-uid", "pat-mullins-uid"],
    participantNames: {
      "bob-cannon-uid": "Bob Cannon",
      "pat-mullins-uid": "Pat Mullins"
    },
    pace: "Standard",
    isBeginnerFriendly: true,
    notes: "Casual 18 holes before the heat kicks in. Playing short tees to long baskets.",
    status: "open"
  },
  {
    id: "round-2",
    courseId: "pratt-park",
    layout: "18-Hole Open Layout",
    teeTime: new Date(Date.now() + 3600000 * 30).toISOString(), // 30 hours from now
    organizerId: "alexander-beebe-uid",
    organizerName: "Alexander Beebe",
    maxCapacity: 4,
    participantIds: ["alexander-beebe-uid"],
    participantNames: {
      "alexander-beebe-uid": "Alexander Beebe"
    },
    pace: "Relaxed",
    isBeginnerFriendly: true,
    notes: "Easy paced afternoon round at Pratt. Great for novices testing out midranges and putters.",
    status: "open"
  },
  {
    id: "round-3",
    courseId: "wilderness-ridge",
    layout: "18-Hole Championship Layout",
    teeTime: new Date(Date.now() + 3600000 * 48).toISOString(), // 48 hours from now
    organizerId: "randy-newkirk-uid",
    organizerName: "Randy Newkirk",
    maxCapacity: 4,
    participantIds: ["randy-newkirk-uid", "jake-mullins-uid", "pat-mullins-uid"],
    participantNames: {
      "randy-newkirk-uid": "Randy Newkirk",
      "jake-mullins-uid": "Jake Mullins",
      "pat-mullins-uid": "Pat Mullins"
    },
    pace: "Fast",
    isBeginnerFriendly: false,
    notes: "High intensity tag match practice on Wilderness Championship layout. Club tag required.",
    status: "open"
  }
];

export async function seedFirestoreIfEmpty() {
  try {
    // Check Courses
    const coursesSnap = await getDocs(collection(db, "courses"));
    if (coursesSnap.empty) {
      console.log("Seeding courses into Firestore...");
      for (const course of INITIAL_COURSES) {
        await setDoc(doc(db, "courses", course.id), course);
      }
    }

    // Check Officers
    const officersSnap = await getDocs(collection(db, "officers"));
    if (officersSnap.empty) {
      console.log("Seeding officers into Firestore...");
      for (const officer of INITIAL_OFFICERS) {
        await setDoc(doc(db, "officers", officer.id), officer);
      }
    }

    // Check Events
    const eventsSnap = await getDocs(collection(db, "events"));
    if (eventsSnap.empty) {
      console.log("Seeding events into Firestore...");
      for (const event of INITIAL_EVENTS) {
        await setDoc(doc(db, "events", event.id), event);
      }
    }

    // Check Rounds
    const roundsSnap = await getDocs(collection(db, "rounds"));
    if (roundsSnap.empty) {
      console.log("Seeding rounds into Firestore...");
      for (const round of INITIAL_ROUNDS) {
        await setDoc(doc(db, "rounds", round.id), round);
      }
    }
  } catch (err) {
    console.error("Error seeding initial data to Firestore:", err);
  }
}
