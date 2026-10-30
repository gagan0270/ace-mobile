import { useState, useEffect, createContext, useContext } from "react";

export const translations = {
  en: {
    // Navigation
    academics: "Academics",
    attendance: "Attendance",
    ranking: "Ranking",
    finances: "Finances",
    notices: "Notices",
    
    // Dashboard Headers
    welcome: "Welcome",
    parentPortal: "Parent Portal",
    appSettings: "App Settings",
    preferredLanguage: "Preferred Language",
    clearAppCache: "Clear App Cache",
    refreshCacheDesc: "Refresh stored notices, fee details, and app state.",
    cacheClearedSuccess: "Cache cleared successfully! Application data refreshed.",
    
    // Onboarding Wizard
    selectLanguagePrompt: "Select Your Preferred Language",
    selectLanguageDesc: "Choose your language for portal navigation and labels",
    welcomeTitle: "Welcome to ACE Portal!",
    welcomeSubtitle: "Let's take a quick moment to set up your parent profile for",
    parentMobileContact: "Parent Mobile Contact",
    studentDob: "Student Date of Birth",
    profilePhotoUpload: "Profile Photo Upload",
    getStarted: "Get Started",
    personalDetails: "Personal Details",
    personalDetailsDesc: "Provide emergency contact and birth details",
    parentMobileNumber: "Parent Mobile Number",
    continueToPhoto: "Continue to Photo",
    uploadProfilePhoto: "Upload Profile Photo",
    choosePhotoDesc: "Select a clean photo of yourself or your child",
    choosePhoto: "Choose Photo",
    saveAndComplete: "Save & Complete",
    allSet: "All Set!",
    profileSyncedDesc: "Your parent profile has been successfully set up and synced.",
    goToDashboard: "Go to Dashboard",
    back: "Back",
    
    // Profile Drawer
    personalAndAcademic: "Personal & Academic",
    transportAndBase: "Transport & Base Info",
    activeSession: "Active Session",
    signedInThisDevice: "Signed in · this device",
    logOut: "Log out",
    busRoute: "Bus Route",
    roomBase: "Room Base",
    guardian: "Guardian",
    dateOfBirth: "Date of Birth",
    contactPhone: "Contact Phone",
    profileVerified: "Profile Verified",
  },
  kn: {
    // Navigation
    academics: "ಶೈಕ್ಷಣಿಕ",
    attendance: "ಹಾಜರಾತಿ",
    ranking: "ಶ್ರೇಣಿ",
    finances: "ಹಣಕಾಸು",
    notices: "ಸೂಚನೆಗಳು",
    
    // Dashboard Headers
    welcome: "ಸ್ವಾಗತ",
    parentPortal: "ಪೋಷಕರ ಪೋರ್ಟಲ್",
    appSettings: "ಆ್ಯಪ್ ಸಂಯೋಜನೆಗಳು",
    preferredLanguage: "ಆದ್ಯತೆಯ ಭಾಷೆ",
    clearAppCache: "ಆ್ಯಪ್ ಕ್ಯಾಶ್ ತೆರವುಗೊಳಿಸಿ",
    refreshCacheDesc: "ಸಂಗ್ರಹಿಸಿದ ಸೂಚನೆಗಳು, ಶುಲ್ಕ ವಿವರಗಳು ಮತ್ತು ಆ್ಯಪ್ ಸ್ಥಿತಿಯನ್ನು ರಿಫ್ರೆಶ್ ಮಾಡಿ.",
    cacheClearedSuccess: "ಕ್ಯಾಶ್ ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಂಡಿದೆ! ಡೇಟಾ ರಿಫ್ರೆಶ್ ಆಗಿದೆ.",
    
    // Onboarding Wizard
    selectLanguagePrompt: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    selectLanguageDesc: "ಪೋರ್ಟಲ್ ಸಂಚರಣೆ ಮತ್ತು ಲೇಬಲ್‌ಗಳಿಗಾಗಿ ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    welcomeTitle: "ACE ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ!",
    welcomeSubtitle: "ನಿಮ್ಮ ಮಗುವಿಗೆ ಪೋಷಕರ ಪ್ರೊಫೈಲ್ ಹೊಂದಿಸಲು ಸ್ವಲ್ಪ ಸಮಯ ತಗೆದುಕೊಳ್ಳಿ",
    parentMobileContact: "ಪೋಷಕರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    studentDob: "ವಿದ್ಯಾರ್ಥಿಯ ಹುಟ್ಟಿದ ದಿನಾಂಕ",
    profilePhotoUpload: "ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್",
    getStarted: "ಪ್ರಾರಂಭಿಸಿ",
    personalDetails: "ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    personalDetailsDesc: "ತುರ್ತು ಸಂಪರ್ಕ ಮತ್ತು ಜನ್ಮ ವಿವರಗಳನ್ನು ನೀಡಿ",
    parentMobileNumber: "ಪೋಷಕರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    continueToPhoto: "ಫೋಟೋಗೆ ಮುಂದುವರಿಯಿರಿ",
    uploadProfilePhoto: "ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    choosePhotoDesc: "ನಿಮ್ಮ ಅಥವಾ ನಿಮ್ಮ ಮಗುವಿನ ಸ್ಪಷ್ಟ ಫೋಟೋವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    choosePhoto: "ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ",
    saveAndComplete: "ಉಳಿಸಿ ಮತ್ತು ಪೂರ್ಣಗೊಳಿಸಿ",
    allSet: "ಎಲ್ಲವೂ ಸಿದ್ಧವಾಗಿದೆ!",
    profileSyncedDesc: "ನಿಮ್ಮ ಪೋಷಕರ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ಹೊಂದಿಸಲಾಗಿದೆ ಮತ್ತು ಸಿಂಕ್ ಆಗಿದೆ.",
    goToDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ",
    back: "ಹಿಂದಕ್ಕೆ",
    
    // Profile Drawer
    personalAndAcademic: "ವೈಯಕ್ತಿಕ ಮತ್ತು ಶೈಕ್ಷಣಿಕ",
    transportAndBase: "ಸಾರಿಗೆ ವಿವರಗಳು",
    activeSession: "ಸಕ್ರಿಯ ಸೆಷನ್",
    signedInThisDevice: "ಸೈನ್ ಇನ್ ಮಾಡಲಾಗಿದೆ · ಈ ಸಾಧನ",
    logOut: "ನಿರ್ಗಮಿಸಿ",
    busRoute: "ಬಸ್ ಮಾರ್ಗ",
    roomBase: "ಕೊಠಡಿ",
    guardian: "ಪೋಷಕರು",
    dateOfBirth: "ಹುಟ್ಟಿದ ದಿನಾಂಕ",
    contactPhone: "ಸಂಪರ್ಕ ಫೋನ್",
    profileVerified: "ಪ್ರೊಫೈಲ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ",
  },
  hi: {
    // Navigation
    academics: "अकादमिक",
    attendance: "उपस्थिति",
    ranking: "रैंकिंग",
    finances: "वित्तीय",
    notices: "सूचनाएं",
    
    // Dashboard Headers
    welcome: "स्वागत है",
    parentPortal: "अभिभावक पोर्टल",
    appSettings: "ऐप सेटिंग्स",
    preferredLanguage: "पसंदीदा भाषा",
    clearAppCache: "ऐप कैश साफ करें",
    refreshCacheDesc: "सहेजे गए नोटिस, शुल्क विवरण और ऐप स्थिति रिफ्रेश करें।",
    cacheClearedSuccess: "कैश सफलतापूर्वक साफ हो गया! ऐप डेटा रिफ्रेश हुआ।",
    
    // Onboarding Wizard
    selectLanguagePrompt: "अपनी पसंदीदा भाषा चुनें",
    selectLanguageDesc: "पोर्टल नेविगेशन और लेबल के लिए अपनी भाषा चुनें",
    welcomeTitle: "ACE पोर्टल में आपका स्वागत है!",
    welcomeSubtitle: "आइए अपने बच्चे के लिए अभिभावक प्रोफ़ाइल सेट अप करें",
    parentMobileContact: "अभिभावक मोबाइल नंबर",
    studentDob: "छात्र की जन्म तिथि",
    profilePhotoUpload: "प्रोफ़ाइल फ़ोटो अपलोड",
    getStarted: "शुरू करें",
    personalDetails: "व्यक्तिगत विवरण",
    personalDetailsDesc: "आपातकालीन संपर्क और जन्म विवरण प्रदान करें",
    parentMobileNumber: "अभिभावक मोबाइल नंबर",
    continueToPhoto: "फ़ोटो पर आगे बढ़ें",
    uploadProfilePhoto: "प्रोफ़ाइल फ़ोटो अपलोड करें",
    choosePhotoDesc: "अपनी या अपने बच्चे की स्पष्ट फ़ोटो चुनें",
    choosePhoto: "फ़ोटो चुनें",
    saveAndComplete: "सहेजें और पूरा करें",
    allSet: "सब तैयार है!",
    profileSyncedDesc: "आपकी अभिभावक प्रोफ़ाइल सफलतापूर्वक सेट अप हो गई है।",
    goToDashboard: "डैशबोर्ड पर जाएं",
    back: "पीछे",
    
    // Profile Drawer
    personalAndAcademic: "व्यक्तिगत और अकादमिक",
    transportAndBase: "परिवहन जानकारी",
    activeSession: "सक्रिय सत्र",
    signedInThisDevice: "साइन इन हैं · यह डिवाइस",
    logOut: "लॉग आउट",
    busRoute: "बस मार्ग",
    roomBase: "कमरा",
    guardian: "अभिभावक",
    dateOfBirth: "जन्म तिथि",
    contactPhone: "संपर्क फ़ोन",
    profileVerified: "प्रोफ़ाइल सत्यापित",
  },
};

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("ace_app_language") || "en";
  });

  useEffect(() => {
    const handleLangChange = (e) => {
      const newLang = e.detail || localStorage.getItem("ace_app_language") || "en";
      setLanguageState(newLang);
    };
    window.addEventListener("ace:language-changed", handleLangChange);
    return () => window.removeEventListener("ace:language-changed", handleLangChange);
  }, []);

  const setLanguage = (langCode) => {
    setLanguageState(langCode);
    localStorage.setItem("ace_app_language", langCode);
    window.dispatchEvent(new CustomEvent("ace:language-changed", { detail: langCode }));
  };

  const t = (key) => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
