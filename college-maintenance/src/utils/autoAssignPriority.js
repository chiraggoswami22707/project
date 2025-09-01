// src/utils/autoAssignPriority.js

// Comprehensive keyword bank for priority detection
const priorityKeywords = {
  high: [
    // Electrical High Priority
    "spark", "sparks", "fire", "flames", "burning", "smoke", "burnt smell", "burning smell",
    "short circuit", "trip", "overload", "fuse blown", "electric shock", "current shock",
    "wire broken", "loose wire", "exposed wire", "naked wire", "transformer blast", "switchboard burning",
    "bijli ka jhatka", "jhatka laga", "current lag gaya", "wire tuta", "khula wire", "nanga wire",
    "chingari", "bijli ka spark", "switchboard jal gaya", "बिजली का झटका", "करंट लगा", "तार टूटा",
    "खुला तार", "नंगा तार", "चिंगारी", "आग", "धुआं", "शॉर्ट सर्किट", "फ्यूज़ उड़ा",
    "major leak", "gushing leak", "spraying leak", "burst flex hose", "main line break", "sewer backup",
    "sewage overflow", "black water", "grey water flood", "backflow", "cross-connection contamination",
    "sump failure", "rising water", "ceiling collapse due to leak", "wet live electricals", "contaminated supply",
    "potable water contamination", "foul sewer gas", "badi leak", "zor se pani nikal raha", "pipe phat gaya",
    "main line toot gayi", "nali ulat rahi", "gutter ubal raha", "sewer wapas aa raha", "ganda pani ghar me",
    "badboo wali gas", "pani se chhat gir rahi", "sump fail", "भारी रिसाव", "तेज़ धार से पानी", "मुख्य पाइप टूटा",
    "सीवर बैकअप", "सीवेज ओवरफ्लो", "दूषित पानी", "पीने का पानी दूषित", "बदबूदार गैस",

    // Plumbing High Priority
    "water leakage", "pipe burst", "waterlogging", "flooding", "seepage", "tank burst", "drain blocked",
    "gutter overflow", "clog", "choke", "contaminated water", "dirty water", "foul smell water",
    "paani leak ho raha hai", "pipe phat gaya", "pipe tuta", "gutter band", "nali block", "paani jama",
    "paani bhara", "ganda paani", "badbu wala paani", "पानी लीक हो रहा है", "पाइप फट गया", "नाली जाम", "गटर बंद",
    "गंदा पानी", "बदबूदार पानी",

    // Cleaning High Priority
    "garbage overflow", "trash pile", "dustbin full", "foul smell", "unhygienic", "dirty washroom",
    "pest infestation", "rats", "cockroaches", "insects", "mosquitoes", "vomit", "blood", "medical waste",
    "biohazard", "kachra jama", "dustbin bhar gaya", "toilet ganda", "bathroom ganda", "badbu aa rahi hai",
    "machhar", "cockroach", "chuha", "keede", "कचरा जमा", "डस्टबिन भरा", "गंदा टॉयलेट", "गंदा बाथरूम",
    "बदबू आ रही है", "मच्छर", "तिलचट्टा", "चूहा", "raw sewage", "biohazard spill", "medical waste",
    "sharps/needle found", "mold bloom", "black mold", "mildew infestation", "maggots", "dead animal",
    "carcass", "decomposing smell", "putrid odor", "pest outbreak", "rat droppings", "rodent infestation",
    "swarming flies", "kachra sar raha", "sewer ka pani", "biohazard", "syringe/needle mila", "fungus/mold phail gaya",
    "kaali phaphundi", "keede padh gaye", "mara hua janwar", "tez badbu", "chuhe ke gober", "chuha upद्रव",
    "कच्चा सीवेज", "बायो-वेस्ट", "सुई/शार्प मिला", "काला फफूंदी", "कीड़े लगना", "सड़ा-गला बदबू", "चूहे का उपद्रव",

    // Security High Priority
    "theft", "robbery", "stolen", "burglary", "fight", "violence", "assault", "harassment", "abuse",
    "suspicious person", "trespass", "intruder", "unknown person", "CCTV not working", "gate broken",
    "lock broken", "emergency exit blocked", "fire alarm not working", "chori ho gayi", "samaan chori",
    "mobile chori", "ladayi", "maar-peet", "jhagra", "chedna", "pareshaan karna", "shaque wala aadmi",
    "ghus gaya", "cctv kharab", "tala tuta", "चोरी हो गई", "सामान चोरी", "लड़ाई", "झगड़ा", "मारपीट",
    "छेड़छाड़", "परेशान करना", "सीसीटीवी खराब", "ताला टूटा", "break-in", "forced entry", "lock tampered",
    "bolt broken", "latch compromised", "trespasser", "intruder sighted", "stalking", "harassment",
    "eve-teasing", "assault attempt", "mugging", "chain snatching", "knife sighted", "weapon sighted",
    "threat call", "bomb threat", "suspicious package", "fire alarm disabled", "emergency exit chained",
    "stampede risk", "crowd crush", "bullying", "ragging incident", "gate unmanned", "CCTV down in critical area",
    "darwaza toda", "tala toda", "ghuspaith", "anjaan aadmi ghus gaya", "chhed-chhaad", "eve teasing",
    "dhamki", "dhamki bhara call", "dhamaka dhamki", "shaque wala packet", "CCTV band", "exit pe tala",
    "bheed-bhaad dhakka-mukki", "ragging hui", "chain snatching", "hathiyar dikhaya", "ज़बरन घुसपैठ",
    "कुंडी/ताला टूटा", "घुसपैठिया", "छेड़छाड़", "धमकी", "संदिग्ध पैकेट", "फायर अलार्म बंद", "आपात द्वार जंजीरबंद",
    "भगदड़ का खतरा", "रैगिंग",

    // Internet High Priority
    "server down", "connection lost", "system crash", "lab computers not working", "printer broken during exam",
    "server band", "network gaya", "system crash ho gaya", "lab computer kharab", "printer band",
    "core switch down", "distribution switch down", "firewall failure", "DHCP down", "DNS outage",
    "authentication server down", "captive portal failure", "exam proctoring down", "LMS outage during exam",
    "critical service unreachable", "data loss", "RAID failed", "UPS failure in server room", "overheating server",
    "smoke in rack", "power cycle loop", "backhaul link down", "core switch band", "firewall fail",
    "server auth down", "exam time pe net gaya", "LMS band", "RAID fail", "server room UPS fail", "rack se dhua",
    "backhaul link toot gaya",

    // Parking High Priority
    "accident in parking", "car hit", "vehicle damaged", "hit and run", "bike theft", "vehicle stolen",
    "parking mein accident", "gaadi lagi", "bike chori", "gaadi chori", "collision", "fender-bender with injury",
    "hit-and-run", "vehicle on fire", "fuel leak", "oil spill large", "brake failure observed", "stuck accelerator",
    "pedestrian hit", "blocked ambulance path", "exit blockade during emergency", "bike theft ring", "serial thefts",
    "takkar ho gayi", "chot lagi", "gaadi bhagi", "gaadi me aag", "fuel leak", "tel gir gaya zyada", "brake fail",
    "aadmi ko takkar", "ambulance ka rasta band", "baar-baar chori",

    // Others/Infra High Priority
    "lift stuck", "elevator emergency", "escalator stuck", "glass broken", "window shattered", "door broken",
    "lift mein atak gaye", "lift bandh ho gayi", "sheesha tuta", "darwaza tuta", "elevator free-fall feel",
    "lift safety brake fault", "door interlock bypass", "escalator step broken", "glass façade crack spreading",
    "ceiling panel collapse", "structural crack widening", "gas cylinder leak", "chemical spill", "radiation sign missing",
    "boiler overpressure", "compressor overheating with smoke", "lift free fall jaisa", "safety brake kharab",
    "interlock bypass", "escalator ki step tooti", "sheesha darar badh rahi", "chhat ka panel gira", "sanrachna me darar",
    "gas cylinder se leak", "chemical gir gaya", "boiler pressure zyada", "compressor se dhua",

    // Additional High Priority
    "urgent", "immediate", "asap", "critical", "emergency", "jaldi", "turant", "abhi abhi", "fast", "bahut zaroori"
  ],

  medium: [
    // Electrical Medium Priority
    "fan not working", "tube light fused", "socket not working", "switch not working", "ac not cooling",
    "pankha kharab", "light fuse", "switch kharab", "ac band",

    // Plumbing Medium Priority
    "tap broken", "flush not working", "water pressure low", "nal kharab", "flush band", "paani kam aa raha hai",
    "low pressure", "sputtering tap", "continuous running flush", "cistern leak", "slow drain", "gurgling drain",
    "trap dry", "dripping mixer", "valve packing leak", "pressure कम", "tap टपक रहा", "flush चलता रहता", "drain धीमा", "gur-gur आवाज़",

    // Cleaning Medium Priority
    "classroom dirty", "floor not mopped", "cobwebs", "dusty benches", "class ganda", "farsh ganda", "jhadoo nahi hua",
    "overflowing bin", "sticky floor", "greasy surface", "restroom unserviced", "sanitary bin full", "stained toilet",
    "clogged urinal", "cobwebs widespread",

    // Security Medium Priority
    "ID card not checked", "security guard absent", "guard nahi aaya", "id check nahi hua", "ID not checked",
    "guard missing at post", "perimeter light out", "gate left open", "CCTV blind spot", "intercom not working",

    // Internet Medium Priority
    "wifi down", "slow internet", "weak signal", "printer not working", "projector not working", "net slow",
    "wifi nahi chal raha", "projector kharab", "printer kharab", "AP down", "SSID not visible", "frequent disconnections",
    "packet loss", "high latency", "jitter", "bandwidth saturated", "speed throttled", "captive redirect loop",
    "printer spooler error", "driver missing", "projector lamp failure", "HDMI handshake issue",

    // Parking Medium Priority
    "vehicle blocked", "wrong parking", "towing issue", "parking full", "no space", "raste mein gaadi atki",
    "parking block ho gayi", "jagah khali nahi", "parking full", "double parking", "lane obstruction", "barricade misplaced",
    "unauthorized parking", "clamped vehicle request", "wrong-way entry", "horn nuisance",

    // Others Medium Priority
    "fan not working", "ac not cooling", "heater not working", "lights fused", "corridor dark", "noise complaint",
    "pankha kharab", "ac band", "heater band", "bulb fuse", "light gayi", "zyada shor", "AC water dripping",
    "condenser noisy", "fan vibrating", "projector mount loose", "door closer broken", "furniture sharp edge",
    "window latch loose", "mosquito mesh torn",

    // Additional Medium Priority
    "important", "needs attention", "moderate"
  ],

  low: [
    // Electrical Low Priority
    "need extension board", "extra plug point",

    // Plumbing Low Priority
    "request for new tap", "RO filter not working", "aerator clean", "replace showerhead", "cosmetic sealant",
    "anti-cockroach trap request",

    // Cleaning Low Priority
    "request regular cleaning", "minor dust", "routine sweeping", "schedule deep clean", "fragrance request",
    "housekeeping cycle",

    // Security Low Priority
    "request for extra guard", "more cameras", "more patrols request", "add cameras", "visitor signage",

    // Internet Low Priority
    "request new wifi router", "speed upgrade", "Wi-Fi coverage request", "router repositioning", "speed upgrade request",
    "extra LAN point",

    // Parking Low Priority
    "request for new parking slots", "paint lines faded", "signboards needed", "shade request", "cycle stand request",

    // Others Low Priority
    "request for extra fans", "new lights", "minor facilities", "extra chairs request", "whiteboard replacement",
    "notice board request", "room freshener",

    // Additional Low Priority
    "minor", "trivial", "not urgent", "please", "plz", "request", "kindly"
  ]
};

// Enhanced priority detection function
const autoAssignPriority = (description) => {
  if (!description || typeof description !== "string") return "Low";

  const desc = description.toLowerCase();

  // Keyword matching logic with better handling of multi-word phrases
  const keywordMatch = (kwList) =>
    kwList.some(kw => {
      const keyword = kw.toLowerCase().trim();
      if (keyword.includes(" ")) {
        // For multi-word phrases, check if all words are present
        const words = keyword.split(" ");
        return words.every(word => desc.includes(word));
      } else {
        // For single words, use word boundary matching
        return new RegExp(`\\b${keyword}\\b`, "i").test(desc) || desc.includes(keyword);
      }
    });

  // Check priorities in order: High > Medium > Low
  if (keywordMatch(priorityKeywords.high)) return "High";
  if (keywordMatch(priorityKeywords.medium)) return "Medium";
  return "Low";
};

// Standalone priority detection function for external use
export const detectPriority = (text) => {
  return autoAssignPriority(text);
};

export default autoAssignPriority;
