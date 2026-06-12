export interface Language {
  code: string;
  name: string;
  states: string[];
  rtl: boolean;
  speech_supported: boolean;
  fallback?: string;
}

export const INDIA_LANGUAGES: Language[] = [
  // 12 Full STT/TTS Support (Web Speech API)
  { code: "hi", name: "हिंदी (Hindi)", states: ["Uttar Pradesh", "Bihar", "Madhya Pradesh", "Rajasthan", "Jharkhand", "Uttarakhand", "Chhattisgarh", "Delhi", "Haryana", "Himachal Pradesh"], rtl: false, speech_supported: true },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)", states: ["Karnataka"], rtl: false, speech_supported: true },
  { code: "ta", name: "தமிழ் (Tamil)", states: ["Tamil Nadu", "Puducherry"], rtl: false, speech_supported: true },
  { code: "te", name: "తెలుగు (Telugu)", states: ["Andhra Pradesh", "Telangana"], rtl: false, speech_supported: true },
  { code: "ml", name: "മലയാളം (Malayalam)", states: ["Kerala", "Lakshadweep"], rtl: false, speech_supported: true },
  { code: "mr", name: "मराठी (Marathi)", states: ["Maharashtra", "Goa"], rtl: false, speech_supported: true },
  { code: "bn", name: "বাংলা (Bengali)", states: ["West Bengal", "Tripura"], rtl: false, speech_supported: true },
  { code: "gu", name: "ગુજરાતી (Gujarati)", states: ["Gujarat", "Dadra and Nagar Haveli", "Daman and Diu"], rtl: false, speech_supported: true },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", states: ["Punjab", "Haryana", "Delhi"], rtl: false, speech_supported: true },
  { code: "ur", name: "اردو (Urdu)", states: ["Jammu & Kashmir", "Telangana", "Uttar Pradesh", "Bihar"], rtl: true, speech_supported: true },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)", states: ["Odisha"], rtl: false, speech_supported: true },
  { code: "en", name: "English (India)", states: ["All states"], rtl: false, speech_supported: true },

  // 11 Partial/Fallback support (Eighth Schedule languages)
  { code: "as", name: "অসমীয়া (Assamese)", states: ["Assam"], rtl: false, speech_supported: false, fallback: "bn" },
  { code: "ne", name: "नेपाली (Nepali)", states: ["Sikkim", "West Bengal"], rtl: false, speech_supported: false, fallback: "hi" },
  { code: "sd", name: "سنڌي (Sindhi)", states: ["Gujarat", "Maharashtra"], rtl: true, speech_supported: false, fallback: "hi" },
  { code: "kok", name: "कोंकणी (Konkani)", states: ["Goa", "Maharashtra", "Karnataka"], rtl: false, speech_supported: false, fallback: "mr" },
  { code: "doi", name: "डोगरी (Dogri)", states: ["Jammu & Kashmir", "Himachal Pradesh"], rtl: false, speech_supported: false, fallback: "hi" },
  { code: "ks", name: "कॉशुर (Kashmiri)", states: ["Jammu & Kashmir"], rtl: false, speech_supported: false, fallback: "ur" },
  { code: "mai", name: "मैथिली (Maithili)", states: ["Bihar", "Jharkhand"], rtl: false, speech_supported: false, fallback: "hi" },
  { code: "mni", name: "মৈতৈলোন্ (Manipuri)", states: ["Manipur"], rtl: false, speech_supported: false, fallback: "bn" },
  { code: "brx", name: "बड़ो (Bodo)", states: ["Assam"], rtl: false, speech_supported: false, fallback: "hi" },
  { code: "sat", name: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)", states: ["Jharkhand", "Odisha", "West Bengal"], rtl: false, speech_supported: false, fallback: "hi" },
  { code: "sa", name: "संस्कृत (Sanskrit)", states: ["Uttarakhand"], rtl: false, speech_supported: false, fallback: "hi" }
];
