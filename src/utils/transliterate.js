// Phonetic English to Tamil Transliteration Engine
// Designed for Sri Amman Traders Rice Shop Billing Software

const startVowels = {
  "aa": "ஆ", "ee": "ஈ", "oo": "ஊ", "ae": "ஏ", "ai": "ஐ", "au": "ஔ",
  "a": "அ", "i": "இ", "u": "உ", "e": "எ", "o": "ஒ"
};

const translitRules = [
  // Core Words & Rice Shop terms
  ["arisi", "அரிசி"],
  ["ponni", "பொன்னி"],
  ["amma", "அம்மா"],
  ["appa", "அப்பா"],
  ["kurunai", "குருணை"],
  ["thari", "தரி"],
  ["puzhungal", "புழுங்கல்"],
  ["pachari", "பச்சரி"],
  ["seeraga", "சீரக"],
  ["samba", "சம்பா"],
  ["nellu", "நெல்லு"],
  ["karnal", "கர்னல்"],
  ["basmati", "பாஸ்மதி"],

  // Special multi-character blends
  ["ndra", "ன்ற"], ["ndri", "ன்றி"], ["ndru", "ன்று"], ["thra", "த்ர"],
  ["shree", "ஸ்ரீ"], ["sree", "ஸ்ரீ"], ["shri", "ஸ்ரீ"], ["sri", "ஸ்ரீ"],

  // Consonants with long vowels (aa, ee, oo, ae, ai, au, oe)
  ["zhaa", "ழா"], ["zhee", "ழீ"], ["zhoo", "ழூ"], ["zhei", "ழே"], ["zhai", "ழை"], ["zhoe", "ழோ"], ["zhau", "ழௌ"],
  ["chaa", "சா"], ["chee", "சீ"], ["choo", "சூ"], ["chei", "சே"], ["chai", "சை"], ["choe", "சோ"], ["chau", "சௌ"],
  ["thaa", "தா"], ["thee", "தீ"], ["thoo", "தூ"], ["thei", "தே"], ["thai", "தை"], ["thoe", "தோ"], ["thau", "தௌ"],
  ["shaa", "ஷா"], ["shee", "ஷீ"], ["shoo", "ஷூ"], ["shei", "ஷே"], ["shai", "ஷை"], ["shoe", "ஷோ"], ["shau", "ஷௌ"],
  ["kaa", "கா"], ["kee", "கீ"], ["koo", "கூ"], ["kei", "கே"], ["kai", "கை"], ["koe", "கோ"], ["kau", "கௌ"],
  ["gaa", "கா"], ["gee", "கீ"], ["goo", "கூ"], ["gei", "கே"], ["gai", "கை"], ["goe", "கோ"], ["gau", "கௌ"],
  ["taa", "டா"], ["tee", "டீ"], ["too", "டூ"], ["tei", "டே"], ["tai", "டை"], ["toe", "டோ"], ["tau", "டௌ"],
  ["daa", "டா"], ["dee", "டீ"], ["doo", "டூ"], ["dei", "டே"], ["dai", "டை"], ["doe", "டோ"], ["dau", "டௌ"],
  ["naa", "நா"], ["nee", "நீ"], ["noo", "நூ"], ["nei", "நே"], ["nai", "நை"], ["noe", "நோ"], ["nau", "நௌ"],
  ["paa", "பா"], ["pee", "பீ"], ["poo", "பூ"], ["pei", "பே"], ["pai", "பை"], ["poe", "போ"], ["pau", "பௌ"],
  ["baa", "பா"], ["bee", "பீ"], ["boo", "பூ"], ["bei", "பே"], ["bai", "பை"], ["boe", "போ"], ["bau", "பௌ"],
  ["maa", "மா"], ["mee", "மீ"], ["moo", "மூ"], ["mei", "மே"], ["mai", "மை"], ["moe", "மோ"], ["mau", "மௌ"],
  ["yaa", "யா"], ["yee", "யீ"], ["yoo", "யூ"], ["yei", "யே"], ["yai", "யை"], ["yoe", "யோ"], ["yau", "யௌ"],
  ["raa", "ரா"], ["ree", "ரீ"], ["roo", "ரூ"], ["rei", "ரே"], ["rai", "ரை"], ["roe", "ரோ"], ["rau", "ரௌ"],
  ["laa", "லா"], ["lee", "லீ"], ["loo", "லூ"], ["lei", "லே"], ["lai", "லை"], ["loe", "லோ"], ["lau", "ளௌ"],
  ["vaa", "வா"], ["vee", "வீ"], ["voo", "வூ"], ["vei", "வே"], ["vai", "வை"], ["voe", "வோ"], ["vau", "வௌ"],
  ["waa", "வா"], ["wee", "வீ"], ["woo", "வூ"], ["wei", "வே"], ["wai", "வை"], ["woe", "வோ"], ["wau", "வௌ"],
  ["Laa", "ளா"], ["Lee", "ளீ"], ["Loo", "ளூ"], ["Lei", "ளே"], ["Lai", "ளை"], ["Loe", "ளோ"], ["Lau", "ளௌ"],
  ["Raa", "றா"], ["Ree", "றீ"], ["Roo", "றூ"], ["Rei", "றே"], ["Rai", "றை"], ["Roe", "றோ"], ["Rau", "றௌ"],
  ["Naa", "ணா"], ["Nee", "ணீ"], ["Noo", "ணூ"], ["Nei", "ணே"], ["Nai", "ணை"], ["Noe", "ணோ"], ["Nau", "ணௌ"],
  ["saa", "ஸா"], ["see", "ஸீ"], ["soo", "ஸூ"], ["sei", "ஸே"], ["sai", "ஸை"], ["soe", "ஸோ"], ["sau", "ஸௌ"],
  ["haa", "ஹா"], ["hee", "ஹீ"], ["hoo", "ஹூ"], ["hei", "ஹே"], ["hai", "ஹை"], ["hoe", "ஹோ"], ["hau", "ஹௌ"],
  ["jaa", "ஜா"], ["jee", "ஜீ"], ["joo", "ஜூ"], ["jei", "ஜே"], ["jai", "ஜை"], ["joe", "ஜோ"], ["jau", "ஜௌ"],

  // Consonants with short vowels (a, i, u, e, o)
  ["zha", "ழ"], ["zhi", "ழி"], ["zhu", "ழு"], ["zhe", "ழெ"], ["zho", "ழொ"],
  ["cha", "ச"], ["chi", "சி"], ["chu", "சு"], ["che", "செ"], ["cho", "சொ"],
  ["tha", "த"], ["thi", "தி"], ["thu", "து"], ["the", "தெ"], ["tho", "தொ"],
  ["sha", "ஷ"], ["shi", "ஷி"], ["shu", "ஷு"], ["she", "ஷெ"], ["sho", "ஷொ"],
  ["ka", "க"], ["ki", "கி"], ["ku", "கு"], ["ke", "கெ"], ["ko", "கொ"],
  ["ga", "க"], ["gi", "கி"], ["gu", "கு"], ["ge", "கெ"], ["go", "கொ"],
  ["ta", "ட"], ["ti", "டி"], ["tu", "டு"], ["te", "டெ"], ["to", "டொ"],
  ["da", "ட"], ["di", "டி"], ["du", "டு"], ["de", "டெ"], ["do", "டொ"],
  ["na", "ந"], ["ni", "நி"], ["nu", "நு"], ["ne", "நெ"], ["no", "நொ"],
  ["pa", "ப"], ["pi", "பி"], ["pu", "பு"], ["pe", "பெ"], ["po", "பொ"],
  ["ba", "ப"], ["bi", "பி"], ["bu", "பு"], ["be", "பெ"], ["bo", "பொ"],
  ["ma", "ம"], ["mi", "மி"], ["mu", "மு"], ["me", "மெ"], ["mo", "மொ"],
  ["ya", "ய"], ["yi", "யி"], ["yu", "யு"], ["ye", "யெ"], ["yo", "யொ"],
  ["ra", "ர"], ["ri", "ரி"], ["ru", "ரு"], ["re", "ரெ"], ["ro", "ரொ"],
  ["la", "ல"], ["li", "லி"], ["lu", "லு"], ["le", "லெ"], ["lo", "பொ"],
  ["lo", "லொ"],
  ["va", "வ"], ["vi", "வி"], ["vu", "வு"], ["ve", "வெ"], ["vo", "வொ"],
  ["wa", "வ"], ["wi", "வி"], ["wu", "வு"], ["we", "வெ"], ["wo", "வொ"],
  ["La", "ள"], ["Li", "ளி"], ["Lu", "ளு"], ["Le", "ளெ"], ["Lo", "ளொ"],
  ["Ra", "ற"], ["Ri", "றி"], ["Ru", "று"], ["Re", "றெ"], ["Ro", "றொ"],
  ["Na", "ண"], ["Ni", "ணி"], ["Nu", "ணு"], ["Ne", "ணெ"], ["No", "ணொ"],
  ["sa", "ஸ"], ["si", "ஸி"], ["su", "ஸு"], ["se", "ஸெ"], ["so", "ஸொ"],
  ["ha", "ஹ"], ["hi", "ஹி"], ["hu", "ஹு"], ["he", "ஹெ"], ["ho", "ஹொ"],
  ["ja", "ஜ"], ["ji", "ஜி"], ["ju", "ஜு"], ["je", "ஜெ"], ["jo", "ஜொ"],

  // Pure Consonants
  ["zh", "ழ்"], ["ch", "ச்"], ["th", "த்"], ["sh", "ஷ்"], ["kh", "க்"], ["gh", "க்"],
  ["ng", "ங்"], ["nj", "ஞ்"], ["nd", "ண்ட்"], ["nt", "ன்ற்"],
  ["k", "க்"], ["g", "க்"], ["t", "ட்"], ["d", "ட்"], ["n", "ன்"], ["p", "ப்"],
  ["b", "ப்"], ["m", "ம்"], ["y", "ய்"], ["r", "ர்"], ["l", "ல்"], ["v", "வ்"],
  ["w", "வ்"], ["L", "ள்"], ["R", "ற்"], ["N", "ண்"], ["s", "ஸ்"], ["h", "ஹ்"],
  ["j", "ஜ்"]
];

export function transliterateEnglishToTamil(text) {
  if (!text) return "";
  
  // Split input into words, preserve spaces
  const parts = text.split(/(\s+)/);
  
  return parts.map(part => {
    if (/^\s+$/.test(part)) return part;
    
    let word = part.toLowerCase();
    
    // Check start vowel rules
    for (const [key, val] of Object.entries(startVowels)) {
      if (word.startsWith(key)) {
        word = val + word.substring(key.length);
        break;
      }
    }
    
    let result = "";
    let i = 0;
    while (i < word.length) {
      // Check if current position has a Tamil character already
      const code = word.charCodeAt(i);
      if (code >= 0x0B80 && code <= 0x0BFF) {
        result += word[i];
        i++;
        continue;
      }
      
      let matched = false;
      for (const [eng, tam] of translitRules) {
        if (word.substring(i).startsWith(eng)) {
          result += tam;
          i += eng.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += word[i];
        i++;
      }
    }
    
    return result;
  }).join("");
}
