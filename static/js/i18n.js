/**
 * FlowNavigator i18n Translation Module
 * Supports Seamless Dynamic Toggle between English (EN) and Tamil (தமிழ்)
 */

const FlowTranslations = {
  en: {
    // Brand & Header
    "brand.title": "FLOW NAVIGATOR",
    "brand.subtitle": "Autonomous Crowd Telemetry & Dynamic Venue Routing",
    "nav.mode_demo": "Demo Data Mode",
    "nav.mode_real": "Real ESP32 IoT Mode",
    "nav.role_visitor": "Visitor View",
    "nav.role_admin": "Admin Control",
    "nav.role_kiosk": "Public Kiosk",
    "nav.sign_out": "Sign Out",
    "nav.add_venue": "+ Add Custom Venue",

    // Landing Page
    "landing.badge": "⚡ AI-POWERED CROWD TELEMETRY & HARDWARE GATEWAY",
    "landing.title": "Dynamic Campus Navigation & Real-time Flow Telemetry",
    "landing.desc": "Optimized crowd routing, venue occupancy analytics, and hardware-integrated ESP32 ToF IoT sensor monitoring for college events, auditoriums, and open grounds.",
    "landing.btn_demo": "Launch Interactive Demo Mode",
    "landing.btn_admin": "Admin Command Center",
    "landing.stat_capacity": "Total Venues Tracked",
    "landing.stat_sensors": "Active Hardware Nodes",
    "landing.stat_latency": "Sub-Second Telemetry Latency",

    // Role Bar & View Containers
    "visitor.header": "Live Crowd Map & Smart Route Guide",
    "visitor.subtitle": "Real-time occupancy status, safest pathways, and optimal event hall access",
    "admin.header": "Admin Operations & Event Command Center",
    "admin.subtitle": "Manage campus grounds, monitor hardware gateways, and configure user permissions",
    "kiosk.header": "Public Campus Navigation Kiosk",
    "kiosk.subtitle": "Scan QR Code with your mobile phone for live step-by-step turn guidance",

    // Admin Tabs
    "admin.tab_live": "Live Telemetry Map",
    "admin.tab_esp32": "ESP32 ToF IoT Gateway",
    "admin.tab_venues": "Ground & Hall Allocation",
    "admin.tab_users": "User Control & Permissions",

    // Common Controls
    "btn.refresh": "Refresh",
    "btn.save": "Save Changes",
    "btn.cancel": "Cancel",
    "btn.register": "Register Gateway",
    "btn.close": "Close",
    "status.active": "Active",
    "status.online": "Online",
    "status.offline": "Offline",

    // Admin Login Modal
    "login.title": "Admin Authentication",
    "login.subtitle": "Sign in to access admin command controls",
    "login.username": "Username",
    "login.password": "Password",
    "login.submit": "Sign In to Admin Center",

    // Venue Allocation Modal
    "venue.title": "Register Ground / Hall Venue",
    "venue.name": "Venue / Event Name",
    "venue.type": "Venue Type",
    "venue.type_ground": "Outdoor Ground / Stadium",
    "venue.type_auditorium": "Indoor Auditorium / Hall",
    "venue.type_courtyard": "Open Campus Quad / Lawn",
    "venue.type_complex": "Multi-Story Academic Block",
    "venue.length": "Length (Meters)",
    "venue.width": "Width (Meters)",
    "venue.preset_title": "Quick Size Presets (NFPA Crowd Dynamics)",
    "venue.calc_area": "Total Surface Area",
    "venue.calc_cap": "Calculated Max Capacity",
    "venue.submit": "Create & Allocate Venue",

    // ESP32 Gateway Page
    "esp32.title": "Hardware Sensor Registration (ESP32 ToF IoT)",
    "esp32.sub": "Connect ESP32 sensor modules via REST API norms",
    "esp32.dev_id": "Device ID (e.g. SENSOR-GROUND-01)",
    "esp32.ip": "IP Address (e.g. 192.168.1.120)",
    "esp32.zone": "Assigned Zone / Venue",
    "esp32.roster_title": "Registered ESP32 Telemetry Nodes",
    "esp32.code_title": "Arduino C++ ESP32 Telemetry Firmware Generator",
    "esp32.copy_code": "Copy Firmware Code",

    // User Management Page
    "users.title": "User Control & Permission Management",
    "users.subtitle": "Create new system accounts and assign security roles",
    "users.add_title": "Add New User Account",
    "users.full_name": "Full Name",
    "users.role": "Role / Access Level",
    "users.table_name": "User Name",
    "users.table_username": "Username",
    "users.table_role": "Role Level",
    "users.table_status": "Account Status",
    "users.table_actions": "Actions",

    // Audio Voice Guidance
    "audio.voice_enabled": "Voice Navigation On",
    "audio.speak_btn": "Listen Route Voice Prompt"
  },

  ta: {
    // Brand & Header
    "brand.title": "ஃப்ளோ நேவிகேட்டர்",
    "brand.subtitle": "தானியங்கி மக்கள் கூட்ட அளவீடு மற்றும் நிகழ்விட வழிசெலுத்தல்",
    "nav.mode_demo": "மாதிரி தரவு பயன்முறை",
    "nav.mode_real": "உண்மை ESP32 IoT பயன்முறை",
    "nav.role_visitor": "பார்வையாளர் பார்வை",
    "nav.role_admin": "நிர்வாகி கட்டுப்பாடு",
    "nav.role_kiosk": "பொது தகவல் மையம்",
    "nav.sign_out": "வெளியேறு",
    "nav.add_venue": "+ புதிய இடத்தை சேர்",

    // Landing Page
    "landing.badge": "⚡ AI-சார்ந்த மக்கள் கூட்ட அளவீடு & வன்பொருள் நுழைவாயில்",
    "landing.title": "நிகழ்நேர வளாக வழிசெலுத்தல் & கூட்ட ஓட்ட கண்காணிப்பு",
    "landing.desc": "கல்லூரி விழாக்கள், திரையரங்குகள் மற்றும் திறந்தவெளி மைதானங்களுக்கான சிறந்த கூட்ட வழிசெலுத்தல், இட ஆக்கிரமிப்பு பகுப்பாய்வு மற்றும் ESP32 ToF IoT சென்சார் கண்காணிப்பு.",
    "landing.btn_demo": "மாதிரி பயன்முறையை தொடங்கு",
    "landing.btn_admin": "நிர்வாகி கட்டுப்பாட்டு மையம்",
    "landing.stat_capacity": "கண்காணிக்கப்படும் இடங்கள்",
    "landing.stat_sensors": "செயலில் உள்ள சென்சார்கள்",
    "landing.stat_latency": "நிகழ்நேர தரவு பரிமாற்றம்",

    // Role Bar & View Containers
    "visitor.header": "நேரலை கூட்ட வரைபடம் & அறிவார்ந்த வழி காட்டி",
    "visitor.subtitle": "நிகழ்நேர ஆக்கிரமிப்பு நிலை, பாதுகாப்பான பாதைகள் மற்றும் நிகழ்வு அரங்கு வழிகாட்டல்",
    "admin.header": "நிர்வாகி செயல்பாடுகள் & கட்டளை மையம்",
    "admin.subtitle": "வளாக மைதானங்களை நிர்வகித்தல், வன்பொருள் சென்சார்களை கண்காணித்தல் மற்றும் பயனர்களை நிர்வகித்தல்",
    "kiosk.header": "பொது வளாக வழிசெலுத்தல் மையம்",
    "kiosk.subtitle": "உங்கள் கைபேசியில் நேரலை வழிகாட்டலை பெற QR குறியீட்டை ஸ்கேன் செய்யவும்",

    // Admin Tabs
    "admin.tab_live": "நேரலை வரைபடம்",
    "admin.tab_esp32": "ESP32 ToF IoT நுழைவாயில்",
    "admin.tab_venues": "மைதானம் & அரங்கு ஒதுக்கீடு",
    "admin.tab_users": "பயனர் கட்டுப்பாடு & அனுமதிகள்",

    // Common Controls
    "btn.refresh": "புதுப்பி",
    "btn.save": "சேமி",
    "btn.cancel": "ரத்து செய்",
    "btn.register": "பதிவு செய்",
    "btn.close": "மூடு",
    "status.active": "செயலில் உள்ளது",
    "status.online": "இணைக்கப்பட்டுள்ளது",
    "status.offline": "இணைக்கப்படவில்லை",

    // Admin Login Modal
    "login.title": "நிர்வாகி உள்நுழைவு",
    "login.subtitle": "நிர்வாக கட்டுப்பாடுகளை அணுக உள்நுழையவும்",
    "login.username": "பயனர்பெயர்",
    "login.password": "கடவுச்சொல்",
    "login.submit": "நிர்வாக மையத்தில் உள்நுழைக",

    // Venue Allocation Modal
    "venue.title": "மைதானம் / அரங்கு பதிவு செய்தல்",
    "venue.name": "இடம் / நிகழ்வின் பெயர்",
    "venue.type": "இடத்தின் வகை",
    "venue.type_ground": "வெளிப்புற மைதானம் / அரங்கம்",
    "venue.type_auditorium": "உட்புற அரங்கு / மண்டபம்",
    "venue.type_courtyard": "வளாக வெளி / புல்வெளி",
    "venue.type_complex": "பல்அடுக்கு கல்வி கட்டிடம்",
    "venue.length": "நீளம் (மீட்டரில்)",
    "venue.width": "அகலம் (மீட்டரில்)",
    "venue.preset_title": "விரைவு அளவு அமைப்புகள் (NFPA விதிகள்)",
    "venue.calc_area": "மொத்த பரப்பளவு",
    "venue.calc_cap": "கணக்கிடப்பட்ட அதிகபட்ச திறன்",
    "venue.submit": "இடத்தை உருவாக்கி ஒதுக்குக",

    // ESP32 Gateway Page
    "esp32.title": "வன்பொருள் சென்சார் பதிவு (ESP32 ToF IoT)",
    "esp32.sub": "REST API நெறிமுறைகள் மூலம் ESP32 சென்சார்களை இணைக்கவும்",
    "esp32.dev_id": "சாதன ஐடி (எ.கா. SENSOR-GROUND-01)",
    "esp32.ip": "IP முகவரி (எ.கா. 192.168.1.120)",
    "esp32.zone": "ஒதுக்கப்பட்ட மண்டலம் / இடம்",
    "esp32.roster_title": "பதிவு செய்யப்பட்ட ESP32 சென்சார்கள்",
    "esp32.code_title": "Arduino C++ ESP32 மென்பொருள் உருவாக்குவி",
    "esp32.copy_code": "மென்பொருள் குறியீட்டை நகலெடு",

    // User Management Page
    "users.title": "பயனர் கட்டுப்பாடு & அனுமதி மேலாண்மை",
    "users.subtitle": "புதிய பயனர் கணக்குகளை உருவாக்கி பாதுகாப்பு நிலைகளை ஒதுக்குங்கள்",
    "users.add_title": "புதிய பயனரைச் சேர்",
    "users.full_name": "முழு பெயர்",
    "users.role": "பங்கு / அணுகல் நிலை",
    "users.table_name": "பயனர் பெயர்",
    "users.table_username": "பயனர்பெயர்",
    "users.table_role": "அணுகல் நிலை",
    "users.table_status": "கணக்கு நிலை",
    "users.table_actions": "செயல்கள்",

    // Audio Voice Guidance
    "audio.voice_enabled": "குரல் வழிகாட்டல் ஆன் செய்யப்பட்டுள்ளது",
    "audio.speak_btn": "வழி குரல் அறிவிப்பைக் கேளுங்கள்"
  }
};

class FlowI18n {
  constructor() {
    this.currentLang = localStorage.getItem('fn_lang') || 'en';
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      const select = document.getElementById('langSelect');
      if (select) {
        select.value = this.currentLang;
        select.addEventListener('change', (e) => {
          this.setLanguage(e.target.value);
        });
      }
      this.applyTranslations();
    });
  }

  setLanguage(lang) {
    if (!FlowTranslations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('fn_lang', lang);
    this.applyTranslations();
    window.dispatchEvent(new CustomEvent('flow:langchange', { detail: { lang } }));
  }

  t(key) {
    const dict = FlowTranslations[this.currentLang] || FlowTranslations.en;
    return dict[key] || FlowTranslations.en[key] || key;
  }

  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (!translation) return;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
          el.placeholder = translation;
        } else {
          el.value = translation;
        }
      } else {
        el.textContent = translation;
      }
    });

    // Update document title if needed
    document.title = `${this.t('brand.title')} - ${this.t('brand.subtitle')}`;
  }
}

window.i18n = new FlowI18n();
