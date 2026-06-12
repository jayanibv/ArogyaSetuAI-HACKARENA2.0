'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, ArrowRight, ArrowLeft, Shield, CheckCircle, Loader2, User, Lock, MapPin, Eye, EyeOff, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { useAppStore, AshaUser } from '../../lib/store';
import { registerUser, loginUser } from '../../lib/authClient';
import { LANGUAGES } from '../../lib/i18n';

// Comprehensive Indian States and their respective Districts mapping
const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "NTR", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Namsai", "Papum Pare", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Jorhat", "Kamrup Metropolitan", "Kamrup Rural", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "Tinsukia", "Udalguri"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Saraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkote", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Kakching", "Kangpokpi", "Senapati", "Tamenglong", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  "Nagaland": ["Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thiruvallur", "Thiruvanannamalai", "Thiruvarur", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Andaman & Nicobar": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra & Nagar Haveli and Daman & Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu & Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

const REF_TRANSLATIONS: Record<string, any> = {
  en: {
    title: "AarogyaSetu AI",
    loginTitle: "Login",
    loginSubtitle: "Log in to your account.",
    signupTitle: "Sign Up",
    signupSubtitle: "Create a new account.",
    otpTitle: "OTP Verification",
    otpSubtitle: "Enter the 6-digit OTP code sent to your phone.",
    userIdLabel: "USER ID",
    userIdPlaceholder: "Enter your User ID",
    passwordLabel: "PASSWORD",
    passwordPlaceholder: "Enter your password",
    nameLabel: "Full Name",
    namePlaceholder: "Enter your full name",
    ashaIdLabel: "ASHA ID (Optional)",
    ashaIdPlaceholder: "Enter ASHA ID",
    stateLabel: "State",
    districtLabel: "District",
    districtPlaceholder: "Select district",
    selectState: "Select State",
    forgotPassword: "Forgot Password?",
    btnLogin: "Log In",
    btnSignup: "Sign Up",
    btnVerifyOtp: "Verify OTP Code",
    btnGoogle: "Log in with Google",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    slogan: "Empowering rural healthcare, one voice at a time: Your records, your community, your control.",
    selectLang: "Language",
    emergencyContacts: "Emergency Numbers",
    errorPhone: "Enter a valid User ID (minimum 4 characters)",
    errorPassword: "Password must be at least 4 characters long",
    errorRequired: "Please fill out all required fields (*)",
    otpSentMsg: "Password verified. OTP code sent!",
    regSentMsg: "Registration details accepted. OTP code sent!",
    backToInput: "Back to login/onboarding",
    devMode: "Developer Test Mode",
    devOtp: "Test OTP Key",
  },
  hi: {
    title: "आरोग्यसेतु एआई",
    loginTitle: "लॉगिन",
    loginSubtitle: "अपने खाते में लॉग इन करें।",
    signupTitle: "साइन अप",
    signupSubtitle: "एक नया खाता बनाएं।",
    otpTitle: "ओटीपी सत्यापन",
    otpSubtitle: "अपने फोन पर भेजा गया 6-अंकीय ओटीपी कोड दर्ज करें।",
    userIdLabel: "यूज़र आईडी (User ID)",
    userIdPlaceholder: "अपनी यूज़र आईडी दर्ज करें",
    passwordLabel: "पासवर्ड (PASSWORD)",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    nameLabel: "पूरा नाम",
    namePlaceholder: "अपना पूरा नाम दर्ज करें",
    ashaIdLabel: "आशा आईडी (वैकल्पिक)",
    ashaIdPlaceholder: "आशा आईडी दर्ज करें",
    stateLabel: "राज्य",
    districtLabel: "जिला",
    districtPlaceholder: "जिला चुनें",
    selectState: "राज्य चुनें",
    forgotPassword: "पासवर्ड भूल गए?",
    btnLogin: "लॉग इन",
    btnSignup: "साइन अप",
    btnVerifyOtp: "ओटीपी कोड सत्यापित करें",
    btnGoogle: "गूगल के साथ लॉगिन करें",
    noAccount: "क्या आपका खाता नहीं है?",
    haveAccount: "पहले से ही एक खाता है?",
    slogan: "ग्रामीण स्वास्थ्य सेवा को सशक्त बनाना, एक आवाज में: आपका रिकॉर्ड, आपका समुदाय, आपका नियंत्रण।",
    selectLang: "भाषा",
    emergencyContacts: "आपातकालीन नंबर",
    errorPhone: "एक वैध यूज़र आईडी दर्ज करें (कम से कम 4 अक्षर)",
    errorPassword: "पासवर्ड कम से कम 4 अक्षरों का होना चाहिए",
    errorRequired: "कृपया सभी आवश्यक फ़ील्ड (*) भरें",
    otpSentMsg: "पासवर्ड सत्यापित। ओटीपी भेजा गया!",
    regSentMsg: "पंजीकरण विवरण स्वीकृत। ओटीपी भेजा गया!",
    backToInput: "लॉगिन/पंजीकरण पर वापस जाएं",
    devMode: "डेवलपर टेस्ट मोड",
    devOtp: "टेस्ट ओटीपी कुंजी",
  },
  kn: {
    title: "ಆರೋಗ್ಯಸೇತು ಎಐ",
    loginTitle: "ಲಾಗಿನ್",
    loginSubtitle: "ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ.",
    signupTitle: "ನೋಂದಣಿ",
    signupSubtitle: "ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ.",
    otpTitle: "ಒಟಿಪಿ ಪರಿಶೀಲನೆ",
    otpSubtitle: "ನಿಮ್ಮ ಸಾಧನಕ್ಕೆ ಕಳುಹಿಸಲಾದ 6-ಅಂಕಿಯ ಒಟಿಪಿ ನಮೂದಿಸಿ.",
    userIdLabel: "ಬಳಕೆದಾರರ ಐಡಿ (User ID)",
    userIdPlaceholder: "ನಿಮ್ಮ ಬಳಕೆದಾರರ ಐಡಿ ನಮೂದಿಸಿ",
    passwordLabel: "ಪಾಸ್‌ವರ್ಡ್ (PASSWORD)",
    passwordPlaceholder: "ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ನಮೂದಿಸಿ",
    nameLabel: "ಪೂರ್ಣ ಹೆಸರು",
    namePlaceholder: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
    ashaIdLabel: "ಆಶಾ ಐಡಿ (ಐಚ್ಛಿಕ)",
    ashaIdPlaceholder: "ಆಶಾ ಐಡಿ ನಮೂದಿಸಿ",
    stateLabel: "ರಾಜ್ಯ",
    districtLabel: "ಜಿಲ್ಲೆ",
    districtPlaceholder: "ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ",
    selectState: "ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ",
    forgotPassword: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿದ್ದೀರಾ?",
    btnLogin: "ಲಾಗಿನ್",
    btnSignup: "ಸೇರ್ಪಡೆ",
    btnVerifyOtp: "ಒಟಿಪಿ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ",
    btnGoogle: "ಗೂಗಲ್ ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ",
    noAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
    haveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
    slogan: "ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಸೇವೆಯನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು, ಪ್ರತಿ ಧ್ವನಿಯಲ್ಲಿ: ನಿಮ್ಮ ದಾಖಲೆಗಳು, ನಿಮ್ಮ ಸಮುದಾಯ, ನಿಮ್ಮ ನಿಯಂತ್ರಣ.",
    selectLang: "ಭಾಷೆ",
    emergencyContacts: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    errorPhone: "ಮಾನ್ಯವಾದ ಬಳಕೆದಾರರ ಐಡಿ ನಮೂದಿಸಿ (ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳು)",
    errorPassword: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 4 ಅಕ್ಷರಗಳಿರಬೇಕು",
    errorRequired: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕಡ್ಡಾಯ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ",
    otpSentMsg: "ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಒಟಿಪಿ ಕಳುಹಿಸಲಾಗಿದೆ!",
    regSentMsg: "ನೋಂದಣಿ ವಿವರಗಳನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಒಟಿಪಿ ಕಳುಹಿಸಲಾಗಿದೆ!",
    backToInput: "ಹಿಂದಕ್ಕೆ ಲಾಗಿನ್‌ಗೆ ಹೋಗಿ",
    devMode: "ಡೆವಲಪರ್ ಟೆಸ್ಟ್ ಮೋಡ್",
    devOtp: "ಟೆಸ್ಟ್ ಒಟಿಪಿ ಕೀ",
  },
  ta: {
    title: "ஆரோக்யசேது AI",
    loginTitle: "உள்நுழை",
    loginSubtitle: "உங்கள் கணக்கில் உள்நுழையவும்.",
    signupTitle: "பதிவு செய்க",
    signupSubtitle: "புதிய கணக்கை உருவாக்கவும்.",
    otpTitle: "OTP சரிபார்ப்பு",
    otpSubtitle: "உங்கள் சாதனத்திற்கு அனுப்பப்பட்ட 6 இலக்க OTP ஐ உள்ளிடவும்.",
    userIdLabel: "பயனர் ஐடி (User ID)",
    userIdPlaceholder: "உங்கள் பயனர் ஐடியை உள்ளிடவும்",
    passwordLabel: "கடவுச்சொல் (PASSWORD)",
    passwordPlaceholder: "உங்கள் கடவுச்சொல்லை உள்ளிடவும்",
    nameLabel: "முழு பெயர்",
    namePlaceholder: "உங்கள் முழு பெயரை உள்ளிடவும்",
    ashaIdLabel: "ஆஷா ID (விருப்பத்திற்குரியது)",
    ashaIdPlaceholder: "ஆஷா IDயை உள்ளிடவும்",
    stateLabel: "மாநிலம்",
    districtLabel: "மாவட்டம்",
    districtPlaceholder: "மாவட்டத்தை தேர்ந்தெடுக்கவும்",
    selectState: "மாநிலத்தை தேர்ந்தெடுக்கவும்",
    forgotPassword: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
    btnLogin: "உள்நுழை",
    btnSignup: "பதிவு செய்க",
    btnVerifyOtp: "OTP குறியீட்டை சரிபார்க்கவும்",
    btnGoogle: "கூகுள் மூலம் உள்நுழையவும்",
    noAccount: "கணக்கு இல்லையா?",
    haveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    slogan: "கிராமப்புற சுகாதாரத்தை மேம்படுத்துதல், ஒவ்வொரு குரலிலும்: உங்கள் பதிவுகள், உங்கள் சமூகம், உங்கள் கட்டுப்பாடு.",
    selectLang: "மொழி",
    emergencyContacts: "அவசர எண்கள்",
    errorPhone: "சரியான பயனர் ஐடியை உள்ளிடவும் (குறைந்தது 4 எழுத்துக்கள்)",
    errorPassword: "கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்",
    errorRequired: "தேவையான அனைத்து புலங்களையும் நிரப்பவும்",
    otpSentMsg: "கடவுச்சொல் சரிபார்க்கப்பட்டது. OTP அனுப்பப்பட்டது!",
    regSentMsg: "பதிவு விவரங்கள் ஏற்கப்பட்டன. OTP அனுப்பப்பட்டது!",
    backToInput: "உள்நுழைவுக்கு திரும்புக",
    devMode: "டெவலப்பர் டெஸ்ட் பயன்முறை",
    devOtp: "டெஸ்ட் OTP கீ",
  },
  te: {
    title: "ఆరోగ్యసేతు AI",
    loginTitle: "లాగిన్",
    loginSubtitle: "మీ ఖాతాలోకి లాగిన్ అవ్వండి.",
    signupTitle: "సైన్ అప్",
    signupSubtitle: "కొత్త ఖాతాను సృష్టించండి.",
    otpTitle: "OTP ధృవీకరణ",
    otpSubtitle: "మీ పరికరానికి పంపిన 6-అంకెల OTP ని నమోదు చేయండి.",
    userIdLabel: "యూజర్ ఐడీ (User ID)",
    userIdPlaceholder: "మీ యూజర్ ఐడీ నమోదు చేయండి",
    passwordLabel: "పాస్‌వర్డ్ (PASSWORD)",
    passwordPlaceholder: "మీ పాస్‌వర్డ్ నమోదు చేయండి",
    nameLabel: "పూర్తి పేరు",
    namePlaceholder: "మీ పూర్తి పేరు నమోదు చేయండి",
    ashaIdLabel: "ఆశా ఐడీ (అమలులో ఉంది)",
    ashaIdPlaceholder: "ఆశా ఐడీ నమోదు చేయండి",
    stateLabel: "రాష్ట్రం",
    districtLabel: "జిల్లా",
    districtPlaceholder: "జిల్లాను ఎంచుకోండి",
    selectState: "రాష్ట్రాన్ని ఎంచుకోండి",
    forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
    btnLogin: "లాగిన్ చేయి",
    btnSignup: "సైన్ అప్",
    btnVerifyOtp: "OTP కోడ్‌ను ధృవీకరించు",
    btnGoogle: "గూగుల్‌తో లాగిన్ చేయి",
    noAccount: "ఖాతా లేదా?",
    haveAccount: "ఇప్పటికే ఖాతా ఉందా?",
    slogan: "గ్రామీణ ఆరోగ్య సంరక్షణను బలోపేతం చేయడం, ప్రతి స్వరం ద్వారా: మీ రికార్డులు, మీ సమాజం, మీ నియంత్రణ.",
    selectLang: "భాష",
    emergencyContacts: "అత్యవసర సంఖ్యలు",
    errorPhone: "సరైన యూజర్ ఐడీ నమోదు చేయండి (కనీసం 4 అక్షరాలు)",
    errorPassword: "పాస్‌వర్డ్ కనీసం 4 అక్షరాల పొడవు ఉండాలి",
    errorRequired: "దయచేసి అవసరమైన అన్ని ఫీల్డ్‌లను పూరించండి",
    otpSentMsg: "పాస్‌వర్డ్ ధృవీకరించబడింది. OTP పంపబడింది!",
    regSentMsg: "నమోదు వివరాలు స్వీకరించబడ్డాయి. OTP పంపబడింది!",
    backToInput: "మళ్లీ లాగిన్‌కి వెళ్లండి",
    devMode: "డెవలపర్ టెస్ట్ మోడ్",
    devOtp: "టెస్ట్ OTP కీ",
  },
  mr: {
    title: "आरोग्यसेतू एआई",
    loginTitle: "लॉगिन",
    loginSubtitle: "आपल्या खात्यात लॉग इन करा.",
    signupTitle: "साइन अप",
    signupSubtitle: "नवीन खाते तयार करा.",
    otpTitle: "ओटीपी पडताळणी",
    otpSubtitle: "तुमच्या डिव्हाइसवर पाठवलेला ६-अंकी ओटीपी प्रविष्ट करा.",
    userIdLabel: "वापरकर्ता आयडी (User ID)",
    userIdPlaceholder: "तुमचा वापरकर्ता आयडी प्रविष्ट करा",
    passwordLabel: "पासवर्ड (PASSWORD)",
    passwordPlaceholder: "तुमचा पासवर्ड प्रविष्ट करा",
    nameLabel: "पूर्ण नाव",
    namePlaceholder: "तुमचे पूर्ण नाव प्रविष्ट करा",
    ashaIdLabel: "आशा आयडी (पर्यायी)",
    ashaIdPlaceholder: "आशा आयडी प्रविष्ट करा",
    stateLabel: "राज्य",
    districtLabel: "जिल्हा",
    districtPlaceholder: "जिल्हा निवडा",
    selectState: "राज्य निवडा",
    forgotPassword: "पासवर्ड विसरलात?",
    btnLogin: "लॉग इन",
    btnSignup: "साइन अप",
    btnVerifyOtp: "ओटीपी कोड सत्यापित करा",
    btnGoogle: "गुगलने लॉग इन करा",
    noAccount: "खाते नाही का?",
    haveAccount: "आधीच खाते आहे?",
    slogan: "ग्रामीण आरोग्य सेवा सक्षम करणे, प्रत्येक आवाजात: आपले रेकॉर्ड, आपला समुदाय, आपले नियंत्रण.",
    selectLang: "भाषा",
    emergencyContacts: "आणीबाणीचे क्रमांक",
    errorPhone: "कृपया वैध वापरकर्ता आयडी प्रविष्ट करा (किमान ४ अक्षरे)",
    errorPassword: "पासवर्ड किमान ४ अक्षरांचा असावा",
    errorRequired: "कृपया सर्व आवश्यक फील्ड भरा",
    otpSentMsg: "पासवर्ड सत्यापित. ओटीपी पाठविला!",
    regSentMsg: "नोंदणी तपशील स्वीकृत. ओटीपी पाठविला!",
    backToInput: "लॉगिन/नोंदणीकडे मागे जा",
    devMode: "डेव्हलपर चाचणी मोड",
    devOtp: "चाचणी ओटीपी की",
  },
  bn: {
    title: "আরোগ্যসেতু এআই",
    loginTitle: "লগইন",
    loginSubtitle: "আপনার অ্যাকাউন্টে लॉगইন করুন।",
    signupTitle: "সাইন আপ",
    signupSubtitle: "একটি নতুন অ্যাকাউন্ট তৈরি করুন।",
    otpTitle: "ওটিপি যাচাইকরণ",
    otpSubtitle: "আপনার ডিভাইসে পাঠানো ৬-সংখ্যার ওটিপি লিখুন।",
    userIdLabel: "ইউজার আইডি (User ID)",
    userIdPlaceholder: "আপনার ইউজার আইডি লিখুন",
    passwordLabel: "পাসওয়ার্ড (PASSWORD)",
    passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
    nameLabel: "সম্পূর্ণ নাম",
    namePlaceholder: "আপনার সম্পূর্ণ নাম লিখুন",
    ashaIdLabel: "আশা আইডি (ঐচ্ছিক)",
    ashaIdPlaceholder: "আশা আইডি লিখুন",
    stateLabel: "রাজ্য",
    districtLabel: "জেলা",
    districtPlaceholder: "জেলা নির্বাচন করুন",
    selectState: "রাজ্য চয়ন করুন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    btnLogin: "লগইন",
    btnSignup: "সাইন আপ",
    btnVerifyOtp: "ওটিपी কোড যাচাই করুন",
    btnGoogle: "গুগল দিয়ে লগইন করুন",
    noAccount: "অ্যাকাউন্ট নেই?",
    haveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",
    slogan: "গ্রামীণ স্বাস্থ্যসেবাকে শক্তিশালী করা, প্রতিটি কণ্ঠে: আপনার রেকর্ড, আপনার সম্প্রদায়, আপনার নিয়ন্ত্রণ।",
    selectLang: "ভাষা",
    emergencyContacts: "জরুরী নম্বরসমূহ",
    errorPhone: "সঠিক ইউজার আইডি লিখুন (কমপক্ষে ৪ টি অক্ষর)",
    errorPassword: "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে",
    errorRequired: "দয়া করে সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন",
    otpSentMsg: "পাসওয়ার্ড যাচাই করা হয়েছে। ওটিপি পাঠানো হয়েছে!",
    regSentMsg: "নিবন্ধন তথ্য গৃহীত। ওটিপি পাঠানো হয়েছে!",
    backToInput: "লগইন/নিবন্ধনে ফিরে যান",
    devMode: "ডেভেলপার টেস্ট মোড",
    devOtp: "টেস্ট ওটিপি কী",
  },
  gu: {
    title: "આરોગ્યસેતુ AI",
    loginTitle: "લોગિન",
    loginSubtitle: "તમારા ખાતામાં લોગ ઇન કરો.",
    signupTitle: "સાઇન અપ",
    signupSubtitle: "નવું ખાતું બનાવો.",
    otpTitle: "OTP ચકાસણી",
    otpSubtitle: "તમારા ઉપકરણ પર મોકલેલ ૬-અંકનો OTP દાખલ કરો.",
    userIdLabel: "વપરાશકર્તા ID (User ID)",
    userIdPlaceholder: "તમારો વપરાશકર્તા ID દાખલ કરો",
    passwordLabel: "પાસવર્ડ (PASSWORD)",
    passwordPlaceholder: "તમારો પાસવર્ડ દાખલ કરો",
    nameLabel: "પૂરું નામ",
    namePlaceholder: "તમારું પૂરું નામ દાખલ કરો",
    ashaIdLabel: "આશા ID (વૈકલ્પિક)",
    ashaIdPlaceholder: "આશા ID દાખલ કરો",
    stateLabel: "રાજ્ય",
    districtLabel: "જિલ્લો",
    districtPlaceholder: "જિલ્લો પસંદ કરો",
    selectState: "રાજ્ય પસંદ કરો",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા?",
    btnLogin: "લોગ ઇન",
    btnSignup: "સાઇન અપ",
    btnVerifyOtp: "OTP કોડ ચકાસો",
    btnGoogle: "ગૂગલ થી લોગિન કરો",
    noAccount: "ખાતું નથી?",
    haveAccount: "પહેલેથી જ ખાતું છે?",
    slogan: "ગ્રામીણ આરોગ્ય સંભાળને સશક્ત બનાવવી, દરેક અવાજમાં: તમારું સ્વાસ્થ્ય, તમારો રેકોર્ડ, તમારું નિયંત્રણ.",
    selectLang: "ભાષા",
    emergencyContacts: "કટોકટી નંબરો",
    errorPhone: "વપરાશકર્તા ID દાખલ કરો (ઓછામાં ઓછા 4 અક્ષરો)",
    errorPassword: "પાસવર્ડ ઓછામાં ઓછો ૪ અક્ષરનો હોવો જોઈએ",
    errorRequired: "કૃપા કરીને બધી જરૂરી વિગતો ભરો",
    otpSentMsg: "પાસવર્ડ ચકાસાયેલ છે. OTP મોકલ્યો!",
    regSentMsg: "રજીસ્ટ્રેશન વિગતો સ્વીકૃત. OTP મોકલ્યો!",
    backToInput: "લૉગિન/રજીસ્ટ્રેશન પર પાછા જાઓ",
    devMode: "ડેવલપર ટેસ્ટ મોડ",
    devOtp: "ટેસ્ટ OTP કી",
  },
  ml: {
    title: "ആരോഗ്യസേതു AI",
    loginTitle: "ലോഗിൻ",
    loginSubtitle: "നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് ലോഗിൻ ചെയ്യുക.",
    signupTitle: "രജിസ്ട്രേഷൻ",
    signupSubtitle: "ഒരു പുതിയ അക്കൗണ്ട് നിർമ്മിക്കുക.",
    otpTitle: "OTP പരിശോധന",
    otpSubtitle: "നിങ്ങളുടെ ഉപകരണത്തിലേക്ക് അയച്ച 6 അക്ക OTP നൽകുക.",
    userIdLabel: "യൂസർ ഐഡി (User ID)",
    userIdPlaceholder: "യൂസർ ഐഡി നൽകുക",
    passwordLabel: "പാസ്‌വേഡ് (PASSWORD)",
    passwordPlaceholder: "പാസ്‌വേഡ് നൽകുക",
    nameLabel: "പൂർണ്ണമായ പേര്",
    namePlaceholder: "പൂർണ്ണമായ പേര് നൽകുക",
    ashaIdLabel: "ആശ ഐഡി (ഓപ്ഷണൽ)",
    ashaIdPlaceholder: "ആശ ഐഡി നൽകുക",
    stateLabel: "സംസ്ഥാനം",
    districtLabel: "ജില്ല",
    districtPlaceholder: "ജില്ല തിരഞ്ഞെടുക്കുക",
    selectState: "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക",
    forgotPassword: "പാസ്‌വേഡ് മറന്നുപോയോ?",
    btnLogin: "ലോഗിൻ",
    btnSignup: "രജിസ്റ്റർ ചെയ്യുക",
    btnVerifyOtp: "OTP കോഡ് പരിശോധിക്കുക",
    btnGoogle: "ഗൂഗിൾ വഴി ലോഗിൻ ചെയ്യുക",
    noAccount: "അക്കൗണ്ട് ഇല്ലേ?",
    haveAccount: "നേരത്തെ അക്കൗണ്ട് ഉണ്ടോ?",
    slogan: "ഗ്രാമീണ ആരോഗ്യ സംരക്ഷണം ശാക്തീകരിക്കുന്നു, ഓരോ ശബ്ദത്തിലും: നിങ്ങളുടെ ആരോഗ്യ വിവരങ്ങൾ, നിങ്ങളുടെ നിയന്ത്രണം.",
    selectLang: "ഭാഷ",
    emergencyContacts: "അടിയന്തിര നമ്പറുകൾ",
    errorPhone: "യൂസർ ഐഡി നൽകുക (കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ)",
    errorPassword: "പാസ്‌വേഡിന് കുറഞ്ഞത് 4 അക്ഷരങ്ങൾ വേണം",
    errorRequired: "ദയവായി ആവശ്യ വിവരങ്ങൾ പൂരിപ്പിക്കുക",
    otpSentMsg: "പാസ്‌വേഡ് പരിശോധിച്ചു. OTP അയച്ചു!",
    regSentMsg: "രജിസ്ട്രേഷൻ വിവരങ്ങൾ സ്വീകരിച്ചു. OTP അയച്ചു!",
    backToInput: "തിരികെ ലോഗിൻ പേജിലേക്ക് പോവുക",
    devMode: "ഡെവലപ്പർ ടെസ്റ്റ് മോഡ്",
    devOtp: "ടെസ്റ്റ് OTP കീ",
  },
  ur: {
    title: "آروگیہ سیتو اے آئی",
    loginTitle: "لاگ ان",
    loginSubtitle: "اپنے اکاؤنٹ میں لاگ ان کریں۔",
    signupTitle: "سائن اپ",
    signupSubtitle: "ایک نیا اکاؤنٹ بنائیں۔",
    otpTitle: "او ٹی پی کی تصدیق",
    otpSubtitle: "اپنے آلے پر بھیجا گیا 6 ہندسوں کا او ٹی پی درج کریں۔",
    userIdLabel: "صارف کی شناخت (User ID)",
    userIdPlaceholder: "صارف کی شناخت درج کریں",
    passwordLabel: "پاس ورڈ (PASSWORD)",
    passwordPlaceholder: "اپنا پاس ورڈ درج کریں",
    nameLabel: "پورا نام",
    namePlaceholder: "اپنا پورا نام درج کریں",
    ashaIdLabel: "آشا آئی డి (ఆప్షనల్)",
    ashaIdPlaceholder: "آشا آئی ڈی درج کریں",
    stateLabel: "ریاست",
    districtLabel: "ضلع",
    districtPlaceholder: "ضلع منتخب کریں",
    selectState: "ریاست منتخب کریں",
    forgotPassword: "پاس ورڈ بھول گئے؟",
    btnLogin: "لاگ ان",
    btnSignup: "سائن اپ",
    btnVerifyOtp: "او ٹی پی کوڈ کی تصدیق کریں",
    btnGoogle: "گوگل سے لاگ ان کریں",
    noAccount: "اکاؤنٹ نہیں ہے؟",
    haveAccount: "پہلے سے ہی اکاؤنٹ ہے؟",
    slogan: "دیہی صحت کی دیکھ بھال کو بااختیار بنانا، ہر آواز میں: آپ کا ریکارڈ، آپ کا معاشرہ، آپ کا اختیار۔",
    selectLang: "زبان",
    emergencyContacts: "ہنگامی نمبر",
    errorPhone: "صارف کی درست شناخت درج کریں (کم از کم 4 حروف)",
    errorPassword: "پاس ورڈ کم از کم 4 حروف کا ہونا چاہئے",
    errorRequired: "براہ کرم تمام مطلوبہ فیلڈز پُر کریں",
    otpSentMsg: "پاس ورڈ کی تصدیق ہو گئی۔ او ٹی پی بھیج دیا گیا ہے!",
    regSentMsg: "رجسٹریشن کی تفصیلات موصول ہو گئیں۔ او ٹی پی بھیج دیا گیا ہے!",
    backToInput: "لاگ ان پر واپس جائیں",
    devMode: "ڈیولپر ٹیسٹ موڈ",
    devOtp: "ٹیسٹ او ٹی پی کلید",
  },
  or: {
    title: "ଆରୋଗ୍ୟସେତୁ AI",
    loginTitle: "ଲଗଇନ୍",
    loginSubtitle: "ଆପଣଙ୍କ ଆକାଉଣ୍ଟରେ ଲଗଇନ୍ କରନ୍ତု।",
    signupTitle: "ସାଇନ୍ ଅପ୍",
    signupSubtitle: "ଏକ ନୂତନ ଆକାଉଣ୍ଟ୍ ସୃଷ୍ଟି କରନ୍ତု।",
    otpTitle: "OTP ଯାଞ୍ଚ",
    otpSubtitle: "ଆପଣଙ୍କ ଉପକରଣକୁ ପଠାଯାଇଥିବା ୬-ଅଙ୍କ ବିଶିଷ୍ଟ OTP ପ୍ରବେଶ କରନ୍ତು।",
    userIdLabel: "ୟୁଜର୍ ଆଇଡି (User ID)",
    userIdPlaceholder: "ୟୁଜର୍ ଆଇଡି ପ୍ରବେଶ କରନ୍ତୁ",
    passwordLabel: "ପାସୱାର୍ଡ (PASSWORD)",
    passwordPlaceholder: "ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତు",
    nameLabel: "ପୂରା ନାମ",
    namePlaceholder: "ପୂରା ନାମ ପ୍ରବେଶ କରନ୍ତୁ",
    ashaIdLabel: "ଆଶା ଆଇଡି (ବିକଳ୍ପ)",
    ashaIdPlaceholder: "ଆଶା ଆଇଡି ପ୍ରବେଶ କରନ୍ତୁ",
    stateLabel: "ରାଜ୍ୟ",
    districtLabel: "ଜିଲ୍ଲା",
    districtPlaceholder: "ଜିଲ୍ଲା ଚୟନ କରନ୍ତု",
    selectState: "ରାଜ୍ୟ ଚୟନ କରନ୍ତု",
    forgotPassword: "ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?",
    btnLogin: "ଲଗଇନ୍",
    btnSignup: "ସାଇନ୍ ଅପ୍",
    btnVerifyOtp: "OTP କୋଡ୍ ଯାଞ୍ಚ କରନ୍ତୁ",
    btnGoogle: "ଗୁଗଲ୍ ସହିତ ଲଗଇନ୍ କରନ୍ତು",
    noAccount: "ଆକାଉଣ୍ଟ୍ ନାହିଁ କି?",
    haveAccount: "ପୂର୍ବରୁ ଆକାଉଣ୍ଟ୍ ଅଛି କି?",
    slogan: "ଗ୍ରାମୀଣ ସ୍ୱାସ୍ଥ୍ୟ ସେବାକୁ ସଶକ୍ତ କରିବା, ପ୍ରତ୍ୟେକ ସ୍ୱରରେ: ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ్య, ଆପଣଙ୍କ ରେକର୍ଡ, ଆପଣଙ୍କ ନିୟନ୍ତ୍ରଣ।",
    selectLang: "ଭାଷା",
    emergencyContacts: "ଜରୁରୀ ନମ୍ବର",
    errorPhone: "ୟୁଜର୍ ଆଇଡି ପ୍ରବେଶ କରନ୍ତು (ଅତିକମରେ ୪ ଅକ୍ଷର)",
    errorPassword: "ପାସୱାର୍ଡ ଅତିକମରେ ୪ ଅକ୍ଷର ବିଶିଷ୍ଟ ହେବା ଆବଶ୍ୟక",
    errorRequired: "ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକୀୟ ଫିଲ୍ଡ ପୂରଣ କରନ୍ତు",
    otpSentMsg: "ପାସୱାର୍ଡ ଯାଞ୍చ ହେଲା | OTP ପଠାଗଲା!",
    regSentMsg: "ପଞ୍ଜୀକରଣ ସୂଚନା ଗ୍ରହଣ ହେଲା | OTP ପଠାଗଲା!",
    backToInput: "ଲଗଇନ୍ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ",
    devMode: "ଡେଭେଲପର ଟେଷ୍ଟ ମୋଡ୍",
    devOtp: "ଟେଷ୍ଟ OTP କି",
  }
};

const LOCALIZED_ERRORS: Record<string, Record<string, string>> = {
  en: {
    errorOtpLength: "Enter the 6-digit OTP code",
    errorOtpFail: "OTP verification failed",
    errorOtpNetwork: "OTP verification failed due to network error",
    errorAuthServer: "Failed to reach authentication server."
  },
  hi: {
    errorOtpLength: "6-अंकीय ओटीपी कोड दर्ज करें",
    errorOtpFail: "ओटीपी सत्यापन विफल रहा",
    errorOtpNetwork: "नेटवर्क त्रुटि के कारण ओटीपी सत्यापन विफल रहा",
    errorAuthServer: "प्रमाणीकरण सर्वर तक पहुँचने में विफल।"
  },
  kn: {
    errorOtpLength: "6-ಅಂಕಿಯ ಒಟಿಪಿ ನಮೂದಿಸಿ",
    errorOtpFail: "ಒಟಿಪಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ",
    errorOtpNetwork: "ನೆಟ್‌ವರ್ಕ್ ದೋಷದಿಂದಾಗಿ ಒಟಿಪಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ",
    errorAuthServer: "ದೃಢೀಕರಣ ಸರ್ವರ್ ತಲುಪಲು ವಿಫಲವಾಗಿದೆ."
  },
  ta: {
    errorOtpLength: "6 இலக்க OTP ஐ உள்ளிடவும்",
    errorOtpFail: "OTP சரிபார்ப்பு தோல்வியடைந்தது",
    errorOtpNetwork: "நெட்வொர்க் பிழை காரணமாக OTP சரிபார்ப்பு தோல்வியடைந்தது",
    errorAuthServer: "அங்கீகார சேவையகத்தை acessar முடியவில்லை."
  },
  te: {
    errorOtpLength: "6-అంకెల OTP ని నమోదు చేయండి",
    errorOtpFail: "OTP ధృవీకరణ విఫలమైంది",
    errorOtpNetwork: "నెట్‌వర్క్ లోపం వల్ల OTP ధృవీకరణ విఫలమైంది",
    errorAuthServer: "ధృవీకరణ సర్వర్‌ని చేరుకోవడంలో విఫలమైంది."
  },
  mr: {
    errorOtpLength: "६-अंकी ओटीपी प्रविष्ट करा",
    errorOtpFail: "ओटीपी पडताळणी अयशस्वी",
    errorOtpNetwork: "नेटवर्क त्रुटीमुळे ओटीपी पडताळणी अयशस्वी",
    errorAuthServer: "प्रमाणिकरण सर्व्हरशी संपर्क साधण्यात अयशस्वी."
  },
  bn: {
    errorOtpLength: "৬-সংখ্যার ওটিপি লিখুন",
    errorOtpFail: "ওটিপি যাচাইকরণ ব্যর্থ হয়েছে",
    errorOtpNetwork: "नेटওয়ার্ক ত্রুটির কারণে ওটিপি যাচাইকরণ ব্যর্থ হয়েছে",
    errorAuthServer: "প্রমাণীকরণ সার্ভারে পৌঁছাতে ব্যর্থ।"
  },
  gu: {
    errorOtpLength: "૬-અંકનો OTP દાખલ કરો",
    errorOtpFail: "OTP ચકાસણી નિષ્ફળ",
    errorOtpNetwork: "નેટવર્ક ખામીને લીધે OTP ચકાસણી નિષ્ફળ",
    errorAuthServer: "પ્રમાણીકરણ સર્વર સુધી પહોંચવામાં નિષ્ફળ."
  },
  ml: {
    errorOtpLength: "6 അക്ക OTP നൽകുക",
    errorOtpFail: "OTP പരിശോധന പരാജയപ്പെട്ടു",
    errorOtpNetwork: "നെറ്റ്‌വർക്ക് തകരാർ കാരണം OTP പരിശോധന പരാജയപ്പെട്ടു",
    errorAuthServer: "ആധികാരികത സെർവറിൽ ബന്ധപ്പെടാൻ പരാജയപ്പെട്ടു."
  },
  ur: {
    errorOtpLength: "6 ہندسوں کا او ٹی پی درج کریں",
    errorOtpFail: "او ٹی پی کی تصدیق ناکام ہو گئی",
    errorOtpNetwork: "نیٹ ورک کی خرابی کی وجہ से او ٹی پی کی تصدیق ناکام ہو گئی",
    errorAuthServer: "تصدیقی سرور تک پہنچنے میں ناکامی۔"
  },
  or: {
    errorOtpLength: "୬-ଅଙ୍କ ବିଶିଷ୍ଟ OTP ପ୍ରବେଶ କରନ୍ତୁ",
    errorOtpFail: "OTP ଯାଞ୍ಚ ବିଫଳ ହେଲା",
    errorOtpNetwork: "ନେଟୱର୍କ ସମସ୍ୟା ହେତୁ OTP ଯାଞ୍ಚ ବିଫଳ ହେଲା",
    errorAuthServer: "ପ୍ରମାଣୀକରଣ ସର୍ଭରରେ ସଂଯୋଗ ବିଫଳ ହେଲା।"
  }
};

// Colorful medical pill icon matching the reference image exactly
const PillLogo = () => (
  <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform scale-110">
    <rect x="1" y="1" width="46" height="22" rx="11" fill="white" stroke="#1E293B" strokeWidth="2"/>
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22H24V2H12Z" fill="#3A75A4" stroke="#1E293B" strokeWidth="2"/>
    <path d="M24 2H36C41.5228 2 46 6.47715 46 12C46 17.5228 41.5228 22 36 22H24V2Z" fill="#E27A52" />
    <path d="M24 12C30 12 34 6 36 2" stroke="#1E293B" strokeWidth="2"/>
    <path d="M29 22C32 16 40 16 46 12" stroke="#1E293B" strokeWidth="2"/>
    <path d="M24 12H46" stroke="#1E293B" strokeWidth="2"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { setUser, languageCode, setLanguageCode } = useAppStore();
  
  const [isOfflineMode, setIsOfflineMode] = useState(true); // default to true since backend is offline

  useEffect(() => {
    // Ping backend to see if it's online
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms ping timeout
    
    fetch('http://localhost:8000/api/health', { signal: controller.signal })
      .then(res => {
        if (res.ok) {
          setIsOfflineMode(false);
          console.log("AarogyaSetu AI Backend is ONLINE. Running in server-connected mode.");
        }
      })
      .catch(() => {
        setIsOfflineMode(true);
        console.log("AarogyaSetu AI Backend is OFFLINE. Running in instant offline mock mode.");
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
  }, []);
  
  const lt = REF_TRANSLATIONS[languageCode] || REF_TRANSLATIONS['en'];
  const errs = LOCALIZED_ERRORS[languageCode] || LOCALIZED_ERRORS['en'];

  // View state: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [ashaId, setAshaId] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAppStore();
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 4) {
      setError(lt.errorPhone);
      return;
    }
    if (password.length < 4) {
      setError(lt.errorPassword);
      return;
    }

    if (authMode === 'register') {
      if (!name || !state || !district) {
        setError(lt.errorRequired);
        return;
      }
    }

    setLoading(true);
    setError('');

    const formattedPhone = phone.startsWith('+91') ? phone : '+91' + phone;

    if (isOfflineMode) {
      setTimeout(() => {
        const localUser: AshaUser = {
          id: formattedPhone,
          phone: formattedPhone,
          name: name || "ASHA Operator",
          ashaId: ashaId || "ASHA-99201",
          state: state || "Karnataka",
          district: district || "Ramanagara",
          preferredLanguage: languageCode,
          role: 'asha_worker'
        };
        localStorage.setItem('asha-jwt-token', 'offline-jwt-token-' + formattedPhone);
        setUser(localUser);
        router.push('/dashboard');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      if (authMode === 'register') {
        const res = await Promise.race([
          registerUser({
            phone: formattedPhone,
            password: password,
            name,
            state,
            district,
            asha_id: ashaId || undefined,
            preferred_language: languageCode
          }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);

        if (res.success && res.user) {
          if (res.token) {
            localStorage.setItem('asha-jwt-token', res.token);
          }
          
          const localUser: AshaUser = {
            id: res.user.phone || formattedPhone,
            phone: res.user.phone || formattedPhone,
            name: res.user.name || name,
            ashaId: res.user.ashaId || ashaId,
            state: res.user.state || state,
            district: res.user.district || district,
            preferredLanguage: res.user.preferredLanguage || languageCode,
            role: 'asha_worker'
          };
          
          if (res.user.preferredLanguage) {
            setLanguageCode(res.user.preferredLanguage);
          }
          
          setUser(localUser);
          router.push('/dashboard');
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        // Log in flow
        const res = await Promise.race([
          loginUser(formattedPhone, password),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);

        if (res.success && res.user) {
          if (res.token) {
            localStorage.setItem('asha-jwt-token', res.token);
          }
          
          const localUser: AshaUser = {
            id: res.user.phone || formattedPhone,
            phone: res.user.phone || formattedPhone,
            name: res.user.name || 'ASHA Operator',
            ashaId: res.user.ashaId || ashaId,
            state: res.user.state || state || 'Karnataka',
            district: res.user.district || district || 'Ramanagara',
            preferredLanguage: res.user.preferredLanguage || languageCode,
            role: 'asha_worker'
          };
          
          if (res.user.preferredLanguage) {
            setLanguageCode(res.user.preferredLanguage);
          }
          
          setUser(localUser);
          router.push('/dashboard');
        } else {
          setError(res.message || 'Incorrect credentials or user not found');
        }
      }
    } catch (err: any) {
      console.warn("Authentication request failed or timed out. Falling back to offline/mock verification.", err);
      const localUser: AshaUser = {
        id: formattedPhone,
        phone: formattedPhone,
        name: name || "ASHA Operator",
        ashaId: ashaId || "ASHA-99201",
        state: state || "Karnataka",
        district: district || "Ramanagara",
        preferredLanguage: languageCode,
        role: 'asha_worker'
      };
      localStorage.setItem('asha-jwt-token', 'offline-jwt-token-' + formattedPhone);
      setUser(localUser);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex lg:grid lg:grid-cols-2 overflow-x-hidden select-none relative">
      
      {/* LEFT COLUMN: Clinical Photograph with app branding (Same as reference image) */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-end p-16 bg-slate-900">
        
        {/* Full-size doctor photo background */}
        <img
          src="/doctor_stethoscope.png"
          alt="AarogyaSetu Healthcare banner"
          className="absolute inset-0 w-full h-full object-cover grayscale-[10%] object-center pointer-events-none"
        />
        
        {/* Soft blue gradient overlay (matching reference image) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-800/40 to-transparent pointer-events-none" />
        
        {/* Branding block in bottom-left */}
        <div className="relative z-10 space-y-4 max-w-lg">
          <div className="space-y-2">
            {/* Colorful custom pill logo */}
            <PillLogo />
            
            {/* Localized Dynamic App Name */}
            <h1 className="text-3xl font-black text-white uppercase tracking-wider">
              {lt.title || 'AarogyaSetu AI'}
            </h1>
          </div>
          
          {/* Localized custom slogan matching the reference subtitle */}
          <p className="text-slate-200 text-sm font-semibold leading-relaxed tracking-wide text-white-keep">
            {lt.slogan}
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean White Form Area (Same as reference image) */}
      <div className="flex-1 bg-white flex flex-col justify-between items-center p-8 md:p-16 relative">
        
        {/* Quick Language Dropdown at top right corner */}
        <div className="w-full flex justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-500 shadow-sm focus-within:border-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="bg-transparent text-slate-700 border-none outline-none font-bold cursor-pointer text-xs focus:ring-0 pr-1"
            >
              <option value="en" className="bg-white text-slate-800">English</option>
              <option value="hi" className="bg-white text-slate-800">हिन्दी (Hindi)</option>
              <option value="kn" className="bg-white text-slate-800">ಕನ್ನಡ (Kannada)</option>
              <option value="ta" className="bg-white text-slate-800">தமிழ் (Tamil)</option>
              <option value="te" className="bg-white text-slate-800">తెలుగు (Telugu)</option>
              <option value="mr" className="bg-white text-slate-800">मराठी (Marathi)</option>
              <option value="bn" className="bg-white text-slate-800">বাংলা (Bengali)</option>
              <option value="gu" className="bg-white text-slate-800">ગુજરાતી (Gujarati)</option>
              <option value="ml" className="bg-white text-slate-800">മലയാളം (Malayalam)</option>
              <option value="ur" className="bg-white text-slate-800">اردو (Urdu)</option>
              <option value="or" className="bg-white text-slate-800">ଓଡ଼ିଆ (Odia)</option>
            </select>
          </div>
        </div>

        {/* Central Form Box */}
        <div className="w-full max-w-sm my-auto">
          <div className="space-y-6">
            
            {/* Top Logo block */}
            <div className="flex justify-start">
              <PillLogo />
            </div>

            {/* Header Titles */}
            <div className="space-y-1 text-left">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {authMode === 'login' ? lt.loginTitle : lt.signupTitle}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {authMode === 'login' ? lt.loginSubtitle : lt.signupSubtitle}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleAuthentication}
              className="space-y-4 text-left"
            >
              {/* User ID Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {lt.userIdLabel}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-black text-sm font-semibold focus:border-slate-400 focus:outline-none min-h-[46px] shadow-sm placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {lt.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={lt.passwordPlaceholder}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-11 py-2.5 text-black text-sm focus:border-slate-400 focus:outline-none min-h-[46px] shadow-sm placeholder-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Onboarding fields if in signup mode */}
              {authMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-3 border-t border-slate-100"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {lt.nameLabel} *
                    </label>
                    <input
                      type="text"
                      placeholder={lt.namePlaceholder}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-black text-sm focus:border-slate-400 focus:outline-none min-h-[46px] shadow-sm placeholder-slate-400"
                      required={authMode === 'register'}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {lt.ashaIdLabel}
                    </label>
                    <input
                      type="text"
                      placeholder={lt.ashaIdPlaceholder}
                      value={ashaId}
                      onChange={(e) => setAshaId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-black text-sm focus:border-slate-400 focus:outline-none min-h-[46px] shadow-sm placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Dynamic State Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {lt.stateLabel} *
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setDistrict(''); // reset district selection
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-black text-xs focus:border-slate-400 focus:outline-none min-h-[46px] shadow-sm"
                        required={authMode === 'register'}
                      >
                        <option value="">{lt.selectState}</option>
                        {Object.keys(INDIAN_STATES_DISTRICTS).sort().map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic District Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {lt.districtLabel} *
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-black text-xs focus:border-slate-400 focus:outline-none min-h-[46px] shadow-sm"
                        required={authMode === 'register'}
                        disabled={!state}
                      >
                        <option value="">{lt.districtPlaceholder}</option>
                        {state && INDIAN_STATES_DISTRICTS[state]?.sort().map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Forgot Password link */}
              {authMode === 'login' && (
                <div className="text-right">
                  <button type="button" className="text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors">
                    {lt.forgotPassword}
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-semibold leading-relaxed">
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || phone.length < 4 || password.length < 4}
                className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-45"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{authMode === 'login' ? lt.btnLogin : lt.btnSignup}</span>
                )}
              </button>

              {/* Toggle view link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 font-medium">
                  {authMode === 'login' ? lt.noAccount : lt.haveAccount}{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
                    className="text-sky-700 hover:text-sky-800 font-bold hover:underline transition-all"
                  >
                    {authMode === 'login' ? lt.btnSignup : lt.btnLogin}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Emergency contact section at the bottom (clinical requirements) */}
        <div className="w-full max-w-sm pt-6 border-t border-slate-100">
          <p className="text-center text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">
            {lt.emergencyContacts}
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-red-500" />
              <span>112</span>
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold hover:bg-amber-100 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span>108</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
