/**
 * Robust phonetic English-to-Tamil (Tanglish to Tamil) transliterator.
 * Converts phonetic English typing into beautiful Unicode Tamil in real-time.
 */

const DICTIONARY = {
  "amma": "அம்மா",
  "arisi": "அரிசி",
  "ponni": "பொன்னி",
  "samba": "சம்பா",
  "thanjavur": "தஞ்சாவூர்",
  "appa": "அப்பா",
  "thatha": "தாத்தா",
  "patti": "பாட்டி",
  "anna": "அண்ணா",
  "akka": "அக்கா",
  "thambi": "தம்பி",
  "thangachi": "தங்கச்சி",
  "rice": "அரிசி",
  "sugar": "சர்க்கரை",
  "paruppu": "பருப்பு",
  "oil": "எண்ணெய்",
  "ghee": "நெய்",
  "nei": "நெய்",
  "wheat": "கோதுமை",
  "maida": "மைதா",
  "rava": "ரவா",
  "raava": "ரவா",
  "ulundhu": "உளுந்து",
  "kadalai": "கடலை",
  "soap": "சோப்பு",
  "tea": "தேநீர்",
  "coffee": "காபி",
  "milk": "பால்",
  "curd": "தயிர்",
  "vellam": "வெல்லம்",
  "uppu": "உப்பு",
  "salt": "உப்பு",
  "puli": "புளி",
  "milagai": "மிளகாய்",
  "poondu": "பூண்டு",
  "poondhu": "பூண்டு",
  "vengayam": "வெங்காயம்",
  "thakkali": "தக்காளி",
  "bazaar": "பஜார்",
  "street": "தெரு",
  "nagar": "நகர்",
  "road": "சாலை",
  "chennai": "சென்னை",
  "madurai": "மதுரை",
  "coimbatore": "கோயம்புத்தூர்",
  "kovai": "கோவை",
  "trichy": "திருச்சி",
  "salem": "சேலம்",
  "erode": "ஈரோடு",
  "tirupur": "திருப்பூர்",
  "nellai": "நெல்லை",
  "tirunelveli": "திருநெல்வேலி",
  "vellore": "வேலூர்",
  "tanjore": "தஞ்சாவூர்",
  "sri": "ஸ்ரீ",
  "shree": "ஸ்ரீ",
  "mr": "திரு",
  "mrs": "திருமதி",
  "raja": "ராஜா",
  "kumar": "குமார்",
  "ram": "ராம்",
  "ravi": "ரவி",
  "seetha": "சீதா",
  "geetha": "கீதா",
  "selvi": "செல்வி",
  "murugan": "முருகன்",
  "ganesh": "கணேஷ்",
  "karthik": "கார்த்திக்",
  "mani": "மணி",
  "anbu": "அன்பு",
  "vel": "வேல்",
  "amman": "அம்மன்",
  "gst": "ஜிஎஸ்டி",
  "hsn": "எச்எஸ்என்",
  "seeraga": "சீரக",
  "seeragasamba": "சீரக சம்பா",
  "seeraga samba": "சீரக சம்பா",
  "idli": "இட்லி",
  "dosa": "தோசை",
  "raw": "பச்சரிசி",
  "boiled": "புழுங்கல்",
  "steam": "ஸ்டீம்",
  "super": "சூப்பர்",
  "deluxe": "டீலக்ஸ்",
  "brand": "பிராண்ட்",
  "village": "கிராமம்",
  "area": "பகுதி",
  "address": "முகவரி",
  "remarks": "குறிப்புகள்",
  "notes": "குறிப்புகள்"
};

const VOWELS = {
  "aa": "ஆ",
  "ai": "ஐ",
  "au": "ஔ",
  "ee": "ஈ",
  "oo": "ஊ",
  "ae": "ஏ",
  "oa": "ஓ",
  "a": "அ",
  "i": "இ",
  "u": "உ",
  "e": "எ",
  "o": "ஒ"
};

const VOWEL_SIGNS = {
  "aa": "ா",
  "ai": "ை",
  "au": "ௌ",
  "ee": "ீ",
  "oo": "ூ",
  "ae": "ே",
  "oa": "ோ",
  "a": "",
  "i": "ி",
  "u": "ு",
  "e": "ெ",
  "o": "ொ"
};

const CONSONANTS = {
  "sh": "ஷ்",
  "zh": "ழ்",
  "th": "த்",
  "dh": "த்",
  "kh": "க்",
  "gh": "க்",
  "ng": "ங்",
  "nj": "ஞ்",
  "ch": "ச்",
  "ph": "ப்",
  "bh": "ப்",
  "k": "க்",
  "g": "க்",
  "s": "ச்",
  "j": "ஜ்",
  "t": "ட்",
  "d": "ட்",
  "n": "ந்",
  "p": "ப்",
  "b": "ப்",
  "m": "ம்",
  "y": "ய்",
  "r": "ர்",
  "l": "ல்",
  "v": "வ்",
  "w": "வ்",
  "z": "ழ்",
  "h": "ஹ்",
  "L": "ள்",
  "R": "ற்",
  "N": "ண்"
};

// Double consonants mapping for pre-processing
const DOUBLE_CONSONANTS = {
  "mm": "m_m",
  "nn": "n_n",
  "pp": "p_p",
  "tt": "t_t",
  "kk": "k_k",
  "cc": "c_c",
  "ll": "l_l",
  "vv": "v_v",
  "rr": "r_r",
  "tth": "th_th",
  "dd": "d_d",
  "gg": "g_g",
  "ss": "s_s"
};

export function transliterateWord(word) {
  if (!word) return "";
  
  const lowerWord = word.toLowerCase();
  
  // 1. Direct dictionary match
  if (DICTIONARY[lowerWord]) {
    return DICTIONARY[lowerWord];
  }

  // 2. Trailing "a" heuristic (e.g. "amma" -> "அம்மா", "samba" -> "சம்பா")
  let processedWord = lowerWord;
  if (processedWord.length > 2 && processedWord.endsWith("a") && !processedWord.endsWith("aa")) {
    // If the word ends with a single "a", in Tanglish typing it is almost always pronounced as long "aa" (ா)
    processedWord = processedWord.substring(0, processedWord.length - 1) + "aa";
  }

  // 3. Pre-process double consonants
  for (const [doubleCons, replacement] of Object.entries(DOUBLE_CONSONANTS)) {
    processedWord = processedWord.replace(new RegExp(doubleCons, "g"), replacement);
  }

  let result = "";
  let i = 0;
  const len = processedWord.length;

  while (i < len) {
    // Check if current char is "_" (marker for double consonants), just skip it
    if (processedWord[i] === "_") {
      i++;
      continue;
    }

    // Determine if we have a vowel
    let isVowel = false;
    let vowelLen = 0;
    let vowelTamil = "";

    // Check 2-char vowels
    if (i + 2 <= len) {
      const pair = processedWord.substring(i, i + 2);
      if (VOWELS[pair]) {
        vowelTamil = VOWELS[pair];
        vowelLen = 2;
        isVowel = true;
      }
    }
    // Check 1-char vowel
    if (!isVowel && VOWELS[processedWord[i]]) {
      vowelTamil = VOWELS[processedWord[i]];
      vowelLen = 1;
      isVowel = true;
    }

    // Independent vowel at start of word
    if (isVowel && (i === 0 || processedWord[i - 1] === " " || processedWord[i - 1] === "-")) {
      result += vowelTamil;
      i += vowelLen;
      continue;
    }

    // Determine if we have a consonant
    let isConsonant = false;
    let consLen = 0;
    let consTamilPure = "";

    // Check 2-char consonants (e.g., "th", "zh", "nj", "ng", "sh")
    if (i + 2 <= len) {
      const pair = processedWord.substring(i, i + 2);
      if (CONSONANTS[pair]) {
        consTamilPure = CONSONANTS[pair];
        consLen = 2;
        isConsonant = true;
      }
    }
    // Check 1-char consonant
    if (!isConsonant && CONSONANTS[processedWord[i]]) {
      consTamilPure = CONSONANTS[processedWord[i]];
      consLen = 1;
      isConsonant = true;
    }

    if (isConsonant) {
      // Look ahead to see if a vowel follows
      let nextIsVowel = false;
      let nextVowelLen = 0;
      let nextVowelKey = "";

      const nextIdx = i + consLen;
      if (nextIdx < len) {
        // Check 2-char vowel sign
        if (nextIdx + 2 <= len) {
          const pair = processedWord.substring(nextIdx, nextIdx + 2);
          if (VOWEL_SIGNS[pair]) {
            nextVowelKey = pair;
            nextVowelLen = 2;
            nextIsVowel = true;
          }
        }
        // Check 1-char vowel sign
        if (!nextIsVowel && VOWEL_SIGNS[processedWord[nextIdx]]) {
          nextVowelKey = processedWord[nextIdx];
          nextVowelLen = 1;
          nextIsVowel = true;
        }
      }

      // Special contextual consonant mapping:
      // An 'n' at the very end of the word should be 'ன்' (not 'ந்')
      // e.g. "murugan" -> "முருகன்"
      let currentConsPure = consTamilPure;
      if (processedWord[i] === "n" && consLen === 1) {
        const remaining = processedWord.substring(i + 1);
        const hasNoMoreVowels = !/[aeiou]/.test(remaining);
        if (hasNoMoreVowels) {
          currentConsPure = "ன்";
        }
      }

      if (nextIsVowel) {
        // Combine Consonant + Vowel sign
        // e.g., க் + ா -> கா
        const baseConsonant = currentConsPure.substring(0, currentConsPure.length - 1); // remove pulli (dot)
        const sign = VOWEL_SIGNS[nextVowelKey];
        result += baseConsonant + sign;
        i += consLen + nextVowelLen;
      } else {
        // Pure half-consonant with dot (pulli)
        result += currentConsPure;
        i += consLen;
      }
    } else {
      // Non-tamil / raw character (numbers, punctuation, symbols, spaces)
      result += processedWord[i];
      i++;
    }
  }

  // Preserve the original casing style if it's identical, or return result
  return result;
}

export function transliterateSentence(text) {
  if (!text) return "";
  let cleanText = text.trim();
  if (DICTIONARY[cleanText.toLowerCase()]) {
    return DICTIONARY[cleanText.toLowerCase()];
  }
  // Replaces English sequences followed by space, punctuation or end-of-string with Tamil translation
  return text.replace(/([a-zA-Z]+)([\s,.:;?!\-]|$)/g, (match, word, punctuation) => {
    return transliterateWord(word) + (punctuation || "");
  });
}
