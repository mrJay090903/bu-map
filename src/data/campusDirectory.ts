/**
 * Bicol University Polangui Campus Directory
 * Comprehensive catalog of all buildings, floors, rooms, and facilities
 * This data is used by the AI assistant to provide detailed campus information
 */

export type RoomInfo = {
  code: string;
  name: string;
  floor: number;
  aliases?: string[];
};

export type BuildingInfo = {
  code: string;
  name: string;
  fullName?: string;
  rooms: RoomInfo[];
  aliases?: string[];
};

export const CAMPUS_BUILDINGS: BuildingInfo[] = [
  {
    code: "SB",
    name: "Salceda Building",
    fullName: "Center for Computer and Engineering Studies / Salceda Building",
    aliases: ["salceda", "cces", "computer building", "engineering building"],
    rooms: [
      // First Floor
      { code: "SB-1", name: "SB-1", floor: 1 },
      { code: "SB-2", name: "SB-2", floor: 1 },
      { code: "SB-3", name: "SB-3", floor: 1 },
      { code: "SB-4", name: "SB-4", floor: 1 },
      { code: "SB-5", name: "SB-5", floor: 1 },
      { code: "SB-6", name: "SB-6", floor: 1 },
      { code: "CSAC", name: "CSAC Office", floor: 1, aliases: ["csac office"] },
      { code: "DOC-CUST", name: "Document Custodian Office", floor: 1, aliases: ["document custodian"] },
      { code: "QA", name: "Quality Assurance Office", floor: 1, aliases: ["quality assurance", "qa office"] },
      { code: "SR-PS", name: "Stock Room for Physical Science", floor: 1, aliases: ["physical science stock room", "stock room"] },
      { code: "SB-11", name: "General/Analytical Chemistry Laboratory", floor: 1, aliases: ["chem lab", "chemistry lab", "analytical chemistry"] },
      { code: "SB-12", name: "Biochemistry/Organic Chemistry Laboratory", floor: 1, aliases: ["biochem lab", "organic chemistry", "biochemistry lab"] },
      { code: "SB-13", name: "Educational Technology Laboratory", floor: 1, aliases: ["edtech lab", "educational technology", "ed tech"] },
      { code: "TED", name: "Teacher Education Department", floor: 1, aliases: ["ted", "teacher ed", "education department"] },
      { code: "TED-HEAD", name: "Office of the Department Head (TED)", floor: 1 },
      { code: "TED-OFFICE", name: "Office of the Department (TED)", floor: 1 },
      { code: "DEFENSE", name: "Defense Room", floor: 1, aliases: ["thesis defense", "defense room"] },
      { code: "ARCHIVES", name: "Archives", floor: 1 },
      { code: "ICT-LAB", name: "ICT Laboratory", floor: 1, aliases: ["ict lab", "computer lab"] },

      // Second Floor
      { code: "LIB-1", name: "Library - Circulation and Reading Section", floor: 2, aliases: ["library room 1", "reading section", "circulation"] },
      { code: "LIB-2", name: "Library - General Reference Section", floor: 2, aliases: ["library room 2", "reference section", "general reference"] },
      { code: "LIBRARIAN", name: "Office of the Librarian", floor: 2, aliases: ["librarian office"] },
      { code: "TECH-ROOM", name: "Technical Room/Multimedia Room", floor: 2, aliases: ["multimedia room", "tech room"] },
      { code: "SB-17", name: "Digital Language and Speech Lab", floor: 2, aliases: ["language lab", "speech lab", "digital language lab"] },
      { code: "SR-BS", name: "Stock Room for Biological Sciences", floor: 2, aliases: ["bio stock room", "biological sciences stock"] },
      { code: "SB-16", name: "Microbiology Laboratory", floor: 2, aliases: ["micro lab", "microbiology"] },
      { code: "SB-15", name: "Physical Laboratory", floor: 2, aliases: ["physics lab", "physical lab"] },
      { code: "SB-14", name: "SB-14", floor: 2 },
      { code: "WORSHIP", name: "Multi-faith Worship Room", floor: 2, aliases: ["worship room", "prayer room", "chapel"] },
      { code: "SB-21", name: "Music Room", floor: 2, aliases: ["music room"] },
      { code: "SB-22", name: "SB-22", floor: 2 },
      { code: "SB-23", name: "SB-23", floor: 2 },
    ],
  },
  {
    code: "ECB",
    name: "Center for Computer & Engineering Studies",
    fullName: "Center for Computer and Engineering Studies Building",
    aliases: ["cces", "engineering", "computer studies"],
    rooms: [
      // First Floor
      { code: "LOBBY", name: "Lobby", floor: 1 },
      { code: "ENG-FACULTY", name: "Engineering Department Faculty Room", floor: 1, aliases: ["engineering faculty", "faculty room"] },
      { code: "ENG-CHAIR", name: "Office of the Department Chairperson (Engineering)", floor: 1, aliases: ["engineering chairperson", "chair office"] },
      { code: "ECB-14", name: "ECB 14", floor: 1 },
      { code: "ECB-19", name: "Engineering Laboratory 1", floor: 1, aliases: ["eng lab 1", "engineering lab 1"] },
      { code: "ECB-18", name: "Engineering Laboratory 2", floor: 1, aliases: ["eng lab 2", "engineering lab 2"] },
      { code: "ECB-13", name: "ECB 13", floor: 1 },
      { code: "ECB-12", name: "ECB 12", floor: 1 },
      { code: "TECH-DEPT", name: "Technology Department Office", floor: 1, aliases: ["tech department", "technology office"] },
      { code: "ECB-15", name: "ECB 15", floor: 1 },
      { code: "ECB-16", name: "ECB 16", floor: 1 },
      { code: "ECB-17", name: "ECB 17", floor: 1 },

      // Second Floor
      { code: "CS-CHAIR", name: "Computer Studies Department Office of the Department Chairperson", floor: 2, aliases: ["cs chair", "computer studies chair"] },
      { code: "CS-FACULTY", name: "Faculty Room (Computer Studies)", floor: 2, aliases: ["cs faculty", "computer faculty"] },
      { code: "CL1", name: "Computer Laboratory 1", floor: 2, aliases: ["comp lab 1", "cl1"] },
      { code: "CL2", name: "Computer Laboratory 2", floor: 2, aliases: ["comp lab 2", "cl2"] },
      { code: "CL3", name: "Computer Laboratory 3", floor: 2, aliases: ["comp lab 3", "cl3"] },
      { code: "CL4", name: "Computer Laboratory 4", floor: 2, aliases: ["comp lab 4", "cl4"] },
      { code: "CL5", name: "Computer Laboratory 5", floor: 2, aliases: ["comp lab 5", "cl5"] },
      { code: "CL6", name: "Computer Laboratory 6", floor: 2, aliases: ["comp lab 6", "cl6"] },
      { code: "ELEC-ROOM", name: "Electrical Room", floor: 2 },
      { code: "ECB-201", name: "ECB 201", floor: 2 },
      { code: "ECB-202", name: "ECB 202", floor: 2 },
      { code: "ECB-203", name: "ECB 203", floor: 2 },
      { code: "ECB-204", name: "ECB 204", floor: 2 },
    ],
  },
  {
    code: "NURS",
    name: "Nursing Department",
    aliases: ["nursing", "nursing building"],
    rooms: [
      { code: "NURS-CHAIR", name: "Office of the Department Chairperson (Nursing)", floor: 1, aliases: ["nursing chair"] },
      { code: "PT-LOUNGE", name: "Part-time Faculty Lounge", floor: 1, aliases: ["part time lounge", "faculty lounge"] },
      { code: "STUD-LOUNGE", name: "Student Lounge (Nursing)", floor: 1, aliases: ["nursing student lounge"] },
      { code: "NURS-FACULTY", name: "Nursing Faculty Room", floor: 1, aliases: ["nursing faculty"] },
      { code: "SIM-ROOM", name: "Simulation Room", floor: 1, aliases: ["simulation"] },
      { code: "MIDSURG", name: "Medical-Surgical Room", floor: 1, aliases: ["midsurg room", "med-surg"] },
      { code: "MAT-CHILD", name: "Maternal and Child Room", floor: 1, aliases: ["maternal child", "maternity"] },
      { code: "ANAPY", name: "Anatomy and Physiology Room", floor: 1, aliases: ["anapy room", "anatomy", "physiology"] },
      { code: "ORTHO", name: "Orthopedic Room", floor: 1, aliases: ["orthopedic", "ortho room"] },
      { code: "RESEARCH", name: "Research Room (Nursing)", floor: 1, aliases: ["nursing research"] },
      { code: "COORD", name: "Coordinators Office", floor: 1, aliases: ["coordinator", "coord office"] },
      { code: "SKILLS-LAB", name: "Skills Laboratory", floor: 1, aliases: ["skills lab", "nursing lab"] },
      { code: "AV-ROOM", name: "Audio Visual Room", floor: 1, aliases: ["av room", "audio visual"] },
    ],
  },
  {
    code: "ETD",
    name: "Electronic Technology Department",
    aliases: ["electronics", "electronic tech", "etd"],
    rooms: [
      // First Floor
      { code: "STOR-1", name: "Storage Room", floor: 1, aliases: ["storage"] },
      { code: "TECH-LAB1", name: "Tech Lab 1", floor: 1, aliases: ["technology lab 1"] },
      { code: "TECH-LAB2", name: "Tech Lab 2", floor: 1, aliases: ["technology lab 2"] },
      { code: "TCL", name: "TCL (Closed)", floor: 1 },
      { code: "STOR-2", name: "Storage Room", floor: 1, aliases: ["storage"] },

      // Second Floor
      { code: "LEC-1", name: "Lecture Room 1", floor: 2, aliases: ["lecture 1"] },
      { code: "LEC-2", name: "Lecture Room 2", floor: 2, aliases: ["lecture 2"] },
      { code: "LEC-3", name: "Lecture Room 3", floor: 2, aliases: ["lecture 3"] },
    ],
  },
  {
    code: "AB",
    name: "Administration Building",
    aliases: ["admin building", "administration"],
    rooms: [
      // First Floor
      { code: "AB-11", name: "AB 11", floor: 1 },
      { code: "AB-12", name: "AB 12", floor: 1 },
      { code: "AB-13", name: "AB 13", floor: 1 },
      { code: "AB-14", name: "AB 14", floor: 1 },
      { code: "CASHIER", name: "Cashier's Office", floor: 1, aliases: ["cashier", "payment"] },

      // Second Floor
      { code: "ICTMO", name: "Information and Communication Technology Management Office", floor: 2, aliases: ["ictmo", "ict office", "it office"] },
      { code: "ADMIN-OFF", name: "Admin Office", floor: 2, aliases: ["administration office"] },
      { code: "ACCOUNTING", name: "Accounting Office", floor: 2, aliases: ["accounting"] },
      { code: "DEANS", name: "Dean's Office", floor: 2, aliases: ["dean", "deans office"] },
      { code: "ASSOC-DEAN", name: "Associate Dean's Office", floor: 2, aliases: ["associate dean", "assoc dean"] },
    ],
  },
  {
    code: "GYM",
    name: "Gymnasium",
    aliases: ["gym", "gymnasium", "sports center"],
    rooms: [
      // First Floor
      { code: "ALUMNI", name: "Alumni Office", floor: 1, aliases: ["alumni"] },

      // Second Floor
      { code: "PPBO", name: "Physical Plant and Building Office", floor: 2, aliases: ["physical plant", "building office"] },
      { code: "PCO", name: "PCO/DRRM Office", floor: 2, aliases: ["pco", "drrm", "disaster risk"] },
    ],
  },
  {
    code: "CLINIC",
    name: "Medical and Dental Clinic",
    aliases: ["clinic", "medical clinic", "dental", "health services"],
    rooms: [
      { code: "BUHS", name: "Bicol University Health Services", floor: 1, aliases: ["health services", "buhs"] },
    ],
  },
  {
    code: "CANTEEN",
    name: "Canteen",
    aliases: ["cafeteria", "food court", "dining"],
    rooms: [
      { code: "CANTEEN", name: "Campus Canteen", floor: 1, aliases: ["canteen", "cafeteria"] },
    ],
  },
  {
    code: "CSS",
    name: "Center for Student Services",
    aliases: ["student services", "css"],
    rooms: [
      { code: "PUBLICATION", name: "College Publication", floor: 1, aliases: ["publication", "campus paper"] },
      { code: "GUIDANCE", name: "Guidance Office", floor: 1, aliases: ["guidance", "counseling"] },
      { code: "NSTP", name: "NSTP Office", floor: 1, aliases: ["nstp", "national service"] },
      { code: "CSS-OFFICE", name: "Center for Student Services Office", floor: 1, aliases: ["css office"] },
    ],
  },
  {
    code: "DORM",
    name: "Dormstel and Business Center",
    aliases: ["dormitory", "dormstel", "business center"],
    rooms: [
      { code: "DORMSTEL", name: "Dormstel and Business Center", floor: 1, aliases: ["dorm", "dormitory"] },
    ],
  },
  {
    code: "RDEO",
    name: "Research Development and Extension Office",
    aliases: ["research office", "rdeo", "extension office"],
    rooms: [
      { code: "RDEO", name: "Research Development and Extension Office", floor: 1, aliases: ["research", "extension"] },
    ],
  },
  {
    code: "ROTC",
    name: "ROTC Headquarters",
    aliases: ["rotc", "military training"],
    rooms: [
      { code: "ROTC-HQ", name: "Headquarters ROTC Office", floor: 1, aliases: ["rotc hq", "rotc office"] },
    ],
  },
  {
    code: "REGISTRAR",
    name: "Registrar Office",
    aliases: ["registrar", "enrollment"],
    rooms: [
      { code: "REGISTRAR", name: "Registrar Office", floor: 1, aliases: ["registrar", "enrollment", "records"] },
    ],
  },
  {
    code: "SUPPLY",
    name: "Supply Office",
    aliases: ["supply", "procurement"],
    rooms: [
      { code: "SUPPLY", name: "Supply Office", floor: 1, aliases: ["supply", "procurement"] },
    ],
  },
  {
    code: "BAC",
    name: "BAC Office",
    aliases: ["bac", "bids and awards"],
    rooms: [
      { code: "BAC", name: "BAC Office", floor: 1, aliases: ["bac", "bids", "awards"] },
    ],
  },
  {
    code: "FTB",
    name: "Food Technology Building",
    aliases: ["food tech", "food technology"],
    rooms: [
      { code: "FTB-1", name: "Entrepreneurship Department (Sensory Evaluation Room)", floor: 1, aliases: ["entrepreneurship", "sensory evaluation", "ftb-1"] },
      { code: "FP-LAB1", name: "Food Processing Laboratory 1", floor: 1, aliases: ["food processing 1", "food lab 1"] },
      { code: "FP-LAB2", name: "Food Processing Laboratory 2", floor: 1, aliases: ["food processing 2", "food lab 2"] },
    ],
  },
  {
    code: "ATB",
    name: "Automotive Building",
    aliases: ["automotive", "auto shop"],
    rooms: [
      { code: "ATB-1", name: "ATB-1", floor: 1, aliases: ["automotive lab"] },
    ],
  },
];

/**
 * Get a formatted list of all campus buildings and rooms for AI context
 */
export function getCampusDirectoryText(): string {
  let output = "BICOL UNIVERSITY POLANGUI CAMPUS - COMPLETE BUILDING DIRECTORY\n\n";

  for (const building of CAMPUS_BUILDINGS) {
    output += `${building.name.toUpperCase()}`;
    if (building.fullName && building.fullName !== building.name) {
      output += ` (${building.fullName})`;
    }
    output += "\n";

    // Group rooms by floor
    const floors = new Map<number, RoomInfo[]>();
    for (const room of building.rooms) {
      if (!floors.has(room.floor)) {
        floors.set(room.floor, []);
      }
      floors.get(room.floor)!.push(room);
    }

    // Sort floors
    const sortedFloors = Array.from(floors.keys()).sort((a, b) => a - b);

    for (const floor of sortedFloors) {
      const floorRooms = floors.get(floor)!;
      const floorLabel = floor === 1 ? "FIRST FLOOR" : floor === 2 ? "SECOND FLOOR" : `FLOOR ${floor}`;
      output += `  ${floorLabel}:\n`;

      for (const room of floorRooms) {
        output += `    - ${room.name}`;
        if (room.code !== room.name) {
          output += ` (${room.code})`;
        }
        if (room.aliases && room.aliases.length > 0) {
          output += ` [Also called: ${room.aliases.join(", ")}]`;
        }
        output += "\n";
      }
    }

    output += "\n";
  }

  return output;
}

/**
 * Search for a room by name, code, or alias
 */
export function findRoom(
  query: string,
): Array<{ building: BuildingInfo; room: RoomInfo }> {
  const normalizedQuery = query.toLowerCase().trim();
  const results: Array<{ building: BuildingInfo; room: RoomInfo }> = [];

  for (const building of CAMPUS_BUILDINGS) {
    for (const room of building.rooms) {
      // Check room code
      if (room.code.toLowerCase() === normalizedQuery) {
        results.push({ building, room });
        continue;
      }

      // Check room name
      if (room.name.toLowerCase().includes(normalizedQuery)) {
        results.push({ building, room });
        continue;
      }

      // Check room aliases
      if (room.aliases) {
        for (const alias of room.aliases) {
          if (alias.toLowerCase().includes(normalizedQuery)) {
            results.push({ building, room });
            break;
          }
        }
      }
    }
  }

  return results;
}

/**
 * Get all rooms in a specific building
 */
export function getRoomsByBuilding(buildingCode: string): RoomInfo[] {
  const building = CAMPUS_BUILDINGS.find(
    (b) => b.code.toLowerCase() === buildingCode.toLowerCase()
  );
  return building ? building.rooms : [];
}
