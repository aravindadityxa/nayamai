class NAYAMAI {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.currentLanguage = localStorage.getItem('language') || 'auto';
        this.isListening = false;
        this.recognition = null;
        this.synthesis = null;
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.userToken = localStorage.getItem('userToken');
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.backendUrl = 'http://localhost:8000';
        
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.initSpeechRecognition();
        this.initEventListeners();
        this.loadChatHistory();
        this.showIntroAnimation();
        
        if (this.userToken) {
            this.updateUIForLoggedInUser();
        }
    }

    showIntroAnimation() {
        setTimeout(() => {
            document.getElementById('introAnimation').classList.add('hidden');
            document.getElementById('mainContainer').classList.remove('hidden');
            this.addWelcomeMessage();
        }, 3000);
    }

    addWelcomeMessage() {
        if (this.chatHistory.length === 0) {
            const welcomeMessages = {
                'en': 'Hello! I\'m NAYAM AI, your medical assistant. How can I help you today?',
                'ta': 'வணக்கம்! நான் நயம் AI, உங்கள் மருத்துவ உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
                'hi': 'नमस्ते! मैं NAYAM AI हूं, आपकी चिकित्सा सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?',
                'te': 'నమస్కారం! నేను నయం AI, మీ వైద్య సహాయకుడిని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
                'ml': 'നമസ്കാരം! ഞാൻ നയം AI ആണ്, നിങ്ങളുടെ മെഡിക്കൽ അസിസ്റ്റന്റ്. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?',
                'kn': 'ನಮಸ್ಕಾರ! ನಾನು ನಯಂ AI, ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?'
            };
            
            const lang = this.currentLanguage === 'auto' ? 'en' : this.currentLanguage;
            const welcomeMessage = welcomeMessages[lang] || welcomeMessages['en'];
            
            this.addMessageToChat('ai', welcomeMessage);
        }
    }

    initEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Language toggle
        document.getElementById('languageToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLanguageDropdown();
        });

        // Language selection
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.setLanguage(e.target.dataset.lang);
                this.toggleLanguageDropdown();
            });
        });

        // User menu
        document.getElementById('userToggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserDropdown();
        });

        // User dropdown items
        document.getElementById('chatHistoryBtn').addEventListener('click', () => {
            this.showChatHistory();
            this.hideUserDropdown();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
            this.hideUserDropdown();
        });

        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Voice input
        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        // Nearby hospitals
        document.getElementById('nearbyBtn').addEventListener('click', () => {
            this.showNearbyHospitals();
        });

        // Clear chat
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearChat();
        });

        // Login modal
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showLoginModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('closeMapModal').addEventListener('click', () => {
            this.hideMapModal();
        });

        document.getElementById('closeChatHistoryModal').addEventListener('click', () => {
            this.hideChatHistoryModal();
        });

        document.getElementById('closeForgotPasswordModal').addEventListener('click', () => {
            this.hideForgotPasswordModal();
        });

        // Forgot password
        document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPasswordModal();
        });

        document.getElementById('backToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideForgotPasswordModal();
            this.showLoginModal();
        });

        // Chat history controls
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearChatHistory();
        });

        document.getElementById('exportHistoryBtn').addEventListener('click', () => {
            this.exportChatHistory();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e.target);
        });

        document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleForgotPassword(e.target);
        });

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideLoginModal();
                this.hideMapModal();
                this.hideChatHistoryModal();
                this.hideForgotPasswordModal();
            }
            
            if (!e.target.closest('.language-selector')) {
                this.hideLanguageDropdown();
            }
            
            if (!e.target.closest('.user-menu')) {
                this.hideUserDropdown();
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideLanguageDropdown();
                this.hideUserDropdown();
                this.hideLoginModal();
                this.hideMapModal();
                this.hideChatHistoryModal();
                this.hideForgotPasswordModal();
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    toggleLanguageDropdown() {
        const dropdown = document.getElementById('languageDropdown');
        dropdown.classList.toggle('hidden');
    }

    hideLanguageDropdown() {
        document.getElementById('languageDropdown').classList.add('hidden');
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('hidden');
    }

    hideUserDropdown() {
        document.getElementById('userDropdown').classList.add('hidden');
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        // Update UI based on language
        this.updateUILanguage();
        
        // Update welcome message if it's the first message
        if (this.chatHistory.length === 1 && this.chatHistory[0].sender === 'ai') {
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages.children.length === 1) {
                chatMessages.innerHTML = '';
                this.addWelcomeMessage();
            }
        }
    }

    updateUILanguage() {
        const translations = {
            en: {
                placeholder: "Type your health concern...",
                nearby: "Nearby Hospitals",
                clear: "Clear Chat",
                login: "Login",
                welcome: "Welcome to NAYAM AI",
                email: "Email",
                password: "Password",
                register: "Register",
                loginTab: "Login",
                registerTab: "Register",
                hospitalsTitle: "Nearby Hospitals",
                yourLocation: "Your Location",
                chatHistory: "Chat History",
                logout: "Logout",
                resetPassword: "Reset Password",
                forgotPassword: "Forgot Password?",
                backToLogin: "Back to Login",
                clearAllHistory: "Clear All History",
                exportHistory: "Export History",
                noChatHistory: "No chat history available",
                securityQuestion1: "What was your first pet's name?",
                securityQuestion2: "What city were you born in?",
                newPassword: "New Password",
                confirmPassword: "Confirm New Password"
            },
            ta: {
                placeholder: "உங்கள் உடல்நலக் கவலையை தட்டச்சு செய்க...",
                nearby: "அருகிலுள்ள மருத்துவமனைகள்",
                clear: "உரையாடலை அழி",
                login: "உள்நுழைக",
                welcome: "நயம் AI இல் வரவேற்கிறோம்",
                email: "மின்னஞ்சல்",
                password: "கடவுச்சொல்",
                register: "பதிவு செய்க",
                loginTab: "உள்நுழைக",
                registerTab: "பதிவு செய்க",
                hospitalsTitle: "அருகிலுள்ள மருத்துவமனைகள்",
                yourLocation: "உங்கள் இடம்",
                chatHistory: "உரையாடல் வரலாறு",
                logout: "வெளியேறு",
                resetPassword: "கடவுச்சொல்லை மீட்டமைக்க",
                forgotPassword: "கடவுச்சொல் மறந்துவிட்டதா?",
                backToLogin: "உள்நுழைக்கு திரும்பு",
                clearAllHistory: "அனைத்து வரலாற்றையும் அழி",
                exportHistory: "வரலாற்றை ஏற்றுமதி செய்க",
                noChatHistory: "உரையாடல் வரலாறு இல்லை",
                securityQuestion1: "உங்கள் முதல் செல்லப்பிராணியின் பெயர் என்ன?",
                securityQuestion2: "நீங்கள் பிறந்த நகரம் எது?",
                newPassword: "புதிய கடவுச்சொல்",
                confirmPassword: "புதிய கடவுச்சொல்லை உறுதிப்படுத்துக"
            },
            hi: {
                placeholder: "अपनी स्वास्थ्य चिंता टाइप करें...",
                nearby: "आसपास के अस्पताल",
                clear: "चैट साफ करें",
                login: "लॉगिन",
                welcome: "NAYAM AI में आपका स्वागत है",
                email: "ईमेल",
                password: "पासवर्ड",
                register: "रजिस्टर करें",
                loginTab: "लॉगिन",
                registerTab: "रजिस्टर करें",
                hospitalsTitle: "आसपास के अस्पताल",
                yourLocation: "आपका स्थान",
                chatHistory: "चैट इतिहास",
                logout: "लॉगआउट",
                resetPassword: "पासवर्ड रीसेट करें",
                forgotPassword: "पासवर्ड भूल गए?",
                backToLogin: "लॉगिन पर वापस जाएं",
                clearAllHistory: "सभी इतिहास साफ करें",
                exportHistory: "इतिहास निर्यात करें",
                noChatHistory: "कोई चैट इतिहास उपलब्ध नहीं है",
                securityQuestion1: "आपके पहले पालतू जानवर का नाम क्या था?",
                securityQuestion2: "आप किस शहर में पैदा हुए थे?",
                newPassword: "नया पासवर्ड",
                confirmPassword: "नए पासवर्ड की पुष्टि करें"
            },
            te: {
                placeholder: "మీ ఆరోగ్య ఆందోళనను టైప్ చేయండి...",
                nearby: "సమీప ఆసుపత్రులు",
                clear: "చాట్ క్లియర్ చేయండి",
                login: "లాగిన్",
                welcome: "NAYAM AI కు స్వాగతం",
                email: "ఇమెయిల్",
                password: "పాస్వర్డ్",
                register: "నమోదు చేసుకోండి",
                loginTab: "లాగిన్",
                registerTab: "నమోదు చేసుకోండి",
                hospitalsTitle: "సమీప ఆసుపత్రులు",
                yourLocation: "మీ స్థానం",
                chatHistory: "చాట్ చరిత్ర",
                logout: "లాగ్అవుట్",
                resetPassword: "పాస్వర్డ్ రీసెట్ చేయండి",
                forgotPassword: "పాస్వర్డ్ మర్చిపోయారా?",
                backToLogin: "లాగిన్‌కు తిరిగి వెళ్ళండి",
                clearAllHistory: "అన్ని చరిత్రను క్లియర్ చేయండి",
                exportHistory: "చరిత్రను ఎగుమతి చేయండి",
                noChatHistory: "చాట్ చరిత్ర లేదు",
                securityQuestion1: "మీ మొదటి పెంపుడు జంతువు పేరు ఏమిటి?",
                securityQuestion2: "మీరు జన్మించిన నగరం ఏది?",
                newPassword: "కొత్త పాస్వర్డ్",
                confirmPassword: "కొత్త పాస్వర్డ్‌ని నిర్ధారించండి"
            },
            ml: {
                placeholder: "നിങ്ങളുടെ ആരോഗ്യക്കുറിച്ചുള്ള ആശങ്ക ടൈപ്പ് ചെയ്യുക...",
                nearby: "സമീപത്തെ ആശുപത്രികൾ",
                clear: "ചാറ്റ് മായ്ക്കുക",
                login: "ലോഗിൻ",
                welcome: "NAYAM AI ലേക്ക് സ്വാഗതം",
                email: "ഇമെയിൽ",
                password: "പാസ്വേഡ്",
                register: "രജിസ്റ്റർ ചെയ്യുക",
                loginTab: "ലോഗിൻ",
                registerTab: "രജിസ്റ്റർ ചെയ്യുക",
                hospitalsTitle: "സമീപത്തെ ആശുപത്രികൾ",
                yourLocation: "നിങ്ങളുടെ സ്ഥാനം",
                chatHistory: "ചാറ്റ് ചരിത്രം",
                logout: "ലോഗൗട്ട്",
                resetPassword: "പാസ്വേഡ് റീസെറ്റ് ചെയ്യുക",
                forgotPassword: "പാസ്വേഡ് മറന്നോ?",
                backToLogin: "ലോഗിനിലേക്ക് മടങ്ങുക",
                clearAllHistory: "എല്ലാ ചരിത്രവും മായ്ക്കുക",
                exportHistory: "ചരിത്രം എക്‌സ്‌പോർട്ട് ചെയ്യുക",
                noChatHistory: "ചാറ്റ് ചരിത്രം ലഭ്യമല്ല",
                securityQuestion1: "നിങ്ങളുടെ ആദ്യത്തെ വളർത്തുമൃഗത്തിന്റെ പേര് എന്തായിരുന്നു?",
                securityQuestion2: "നിങ്ങൾ ജനിച്ച നഗരം ഏതാണ്?",
                newPassword: "പുതിയ പാസ്‌വേഡ്",
                confirmPassword: "പുതിയ പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക"
            },
            kn: {
                placeholder: "ನಿಮ್ಮ ಆರೋಗ್ಯ ಕಾಳಜಿಯನ್ನು ಟೈಪ್ ಮಾಡಿ...",
                nearby: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು",
                clear: "ಚಾಟ್ ಅಳಿಸಿ",
                login: "ಲಾಗಿನ್",
                welcome: "NAYAM AI ಗೆ ಸ್ವಾಗತ",
                email: "ಇಮೇಲ್",
                password: "ಪಾಸ್ವರ್ಡ್",
                register: "ನೋಂದಾಯಿಸಿ",
                loginTab: "ಲಾಗಿನ್",
                registerTab: "ನೋಂದಾಯಿಸಿ",
                hospitalsTitle: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು",
                yourLocation: "ನಿಮ್ಮ ಸ್ಥಳ",
                chatHistory: "ಚಾಟ್ ಇತಿಹಾಸ",
                logout: "ಲಾಗ್ ಔಟ್",
                resetPassword: "ಪಾಸ್ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
                forgotPassword: "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರಾ?",
                backToLogin: "ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
                clearAllHistory: "ಎಲ್ಲಾ ಇತಿಹಾಸವನ್ನು ಅಳಿಸಿ",
                exportHistory: "ಇತಿಹಾಸವನ್ನು ರಫ್ತು ಮಾಡಿ",
                noChatHistory: "ಚಾಟ್ ಇತಿಹಾಸ ಲಭ್ಯವಿಲ್ಲ",
                securityQuestion1: "ನಿಮ್ಮ ಮೊದಲ ಸಾಕುಪ್ರಾಣಿಯ ಹೆಸರೇನು?",
                securityQuestion2: "ನೀವು ಜನಿಸಿದ ನಗರ ಯಾವುದು?",
                newPassword: "ಹೊಸ ಪಾಸ್ವರ್ಡ್",
                confirmPassword: "ಹೊಸ ಪಾಸ್ವರ್ಡ್ ಅನ್ನು ದೃಢೀಕರಿಸಿ"
            }
        };

        const lang = this.currentLanguage === 'auto' ? 'en' : this.currentLanguage;
        const t = translations[lang] || translations.en;

        // Update input placeholder
        document.getElementById('messageInput').placeholder = t.placeholder;
        
        // Update buttons
        document.getElementById('nearbyBtn').innerHTML = `<i class="fas fa-hospital"></i>${t.nearby}`;
        document.getElementById('clearBtn').innerHTML = `<i class="fas fa-trash"></i>${t.clear}`;
        document.getElementById('loginBtn').textContent = this.user ? this.user.email.split('@')[0] : t.login;
        
        // Update modal content
        const modalTitle = document.querySelector('#loginModal h2');
        if (modalTitle) modalTitle.textContent = t.welcome;
        
        // Update form placeholders
        const emailInputs = document.querySelectorAll('input[type="email"]');
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        
        emailInputs.forEach(input => input.placeholder = t.email);
        passwordInputs.forEach(input => input.placeholder = t.password);
        
        // Update tab buttons
        const loginTab = document.querySelector('[data-tab="login"]');
        const registerTab = document.querySelector('[data-tab="register"]');
        if (loginTab) loginTab.textContent = t.loginTab;
        if (registerTab) registerTab.textContent = t.registerTab;
        
        // Update form buttons
        const loginBtn = document.querySelector('#loginForm button');
        const registerBtn = document.querySelector('#registerForm button');
        if (loginBtn) loginBtn.textContent = t.loginTab;
        if (registerBtn) registerBtn.textContent = t.registerTab;
        
        // Update map modal title
        const mapTitle = document.querySelector('#mapModal h2');
        if (mapTitle) mapTitle.textContent = t.hospitalsTitle;
        
        // Update user dropdown
        document.getElementById('chatHistoryBtn').innerHTML = `<i class="fas fa-history"></i>${t.chatHistory}`;
        document.getElementById('logoutBtn').innerHTML = `<i class="fas fa-sign-out-alt"></i>${t.logout}`;
        
        // Update forgot password modal
        const forgotPasswordTitle = document.querySelector('#forgotPasswordModal h2');
        if (forgotPasswordTitle) forgotPasswordTitle.textContent = t.resetPassword;
        
        document.getElementById('forgotPasswordLink').textContent = t.forgotPassword;
        document.getElementById('backToLogin').textContent = t.backToLogin;
        document.getElementById('forgotPasswordSubmit').textContent = t.resetPassword;
        
        // Update security questions
        const securityQuestion1 = document.querySelector('#forgotPasswordForm label:nth-child(2)');
        const securityQuestion2 = document.querySelector('#forgotPasswordForm label:nth-child(4)');
        if (securityQuestion1) securityQuestion1.textContent = t.securityQuestion1;
        if (securityQuestion2) securityQuestion2.textContent = t.securityQuestion2;
        
        // Update new password fields
        document.getElementById('newPassword').placeholder = t.newPassword;
        document.getElementById('confirmNewPassword').placeholder = t.confirmPassword;
        
        // Update chat history modal
        const chatHistoryTitle = document.querySelector('#chatHistoryModal h2');
        if (chatHistoryTitle) chatHistoryTitle.textContent = t.chatHistory;
        
        document.getElementById('clearHistoryBtn').innerHTML = `<i class="fas fa-trash"></i>${t.clearAllHistory}`;
        document.getElementById('exportHistoryBtn').innerHTML = `<i class="fas fa-download"></i>${t.exportHistory}`;
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.getSpeechRecognitionLanguage();

            this.recognition.onstart = () => {
                this.isListening = true;
                document.getElementById('voiceBtn').classList.add('listening');
                this.showNotification('Listening...', 'info');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('voiceBtn').classList.remove('listening');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('messageInput').value = transcript;
                this.showNotification('Voice input received', 'success');
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                document.getElementById('voiceBtn').classList.remove('listening');
                
                const errorMessages = {
                    'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
                    'audio-capture': 'No microphone found. Please check your microphone.',
                    'network': 'Network error occurred during speech recognition.',
                    'default': 'Speech recognition failed. Please try again.'
                };
                
                this.showNotification(errorMessages[event.error] || errorMessages.default, 'error');
            };
        } else {
            console.warn('Speech recognition not supported');
            document.getElementById('voiceBtn').style.display = 'none';
            this.showNotification('Speech recognition is not supported in your browser', 'warning');
        }

        // Initialize speech synthesis
        this.synthesis = window.speechSynthesis;
    }

    getSpeechRecognitionLanguage() {
        const languageCodes = {
            'en': 'en-IN',
            'ta': 'ta-IN',
            'hi': 'hi-IN',
            'te': 'te-IN',
            'ml': 'ml-IN',
            'kn': 'kn-IN'
        };
        const lang = this.currentLanguage === 'auto' ? 'en' : this.currentLanguage;
        return languageCodes[lang] || 'en-IN';
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Speech recognition is not supported in your browser', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            // Update recognition language based on current selection
            this.recognition.lang = this.getSpeechRecognitionLanguage();
            this.recognition.start();
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) {
            this.showNotification('Please enter a message', 'warning');
            return;
        }

        // Add user message to chat
        this.addMessageToChat('user', message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.sendToBackend(message);
            this.addMessageToChat('ai', response.response);
            
            // Speak the response
            this.speakResponse(response.response, response.language);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = this.getErrorMessage('chat_error');
            this.addMessageToChat('ai', errorMessage);
        } finally {
            this.hideTypingIndicator();
        }
    }

    async sendToBackend(message) {
        const endpoint = this.userToken ? '/chat' : '/chat/public';
        
        const response = await fetch(`${this.backendUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.userToken ? `Bearer ${this.userToken}` : ''
            },
            body: JSON.stringify({
                message: message,
                language: this.currentLanguage === 'auto' ? null : this.currentLanguage
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    addMessageToChat(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to history
        this.chatHistory.push({ 
            sender, 
            content, 
            timestamp: new Date().toISOString(),
            language: this.currentLanguage
        });
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').classList.remove('hidden');
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').classList.add('hidden');
    }

    loadChatHistory() {
        // Clear existing messages except welcome message
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // Reload from localStorage
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        
        // Add all messages to chat
        this.chatHistory.forEach(msg => {
            this.addMessageToChat(msg.sender, msg.content);
        });
    }

    clearChat() {
        const confirmMessage = this.getErrorMessage('clear_confirm');
        if (confirm(confirmMessage)) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            document.getElementById('chatMessages').innerHTML = '';
            this.addWelcomeMessage();
            this.showNotification('Chat cleared', 'success');
        }
    }

    speakResponse(text, language) {
        if (!this.synthesis || this.synthesis.speaking) return;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice based on language
        const voices = this.synthesis.getVoices();
        const langCode = this.getLanguageCode(language);
        const voice = voices.find(v => v.lang.startsWith(langCode)) || 
                     voices.find(v => v.lang.includes('IN')) || 
                     voices[0];
        
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }
        
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onstart = () => {
            console.log('Speech synthesis started');
        };
        
        utterance.onend = () => {
            console.log('Speech synthesis ended');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
        };
        
        this.synthesis.speak(utterance);
    }

    getLanguageCode(lang) {
        const codes = {
            'ta': 'ta-IN',
            'hi': 'hi-IN',
            'te': 'te-IN',
            'ml': 'ml-IN',
            'kn': 'kn-IN',
            'en': 'en-IN'
        };
        return codes[lang] || 'en-IN';
    }

    async showNearbyHospitals() {
        if (!navigator.geolocation) {
            this.showNotification('Geolocation is not supported by your browser', 'error');
            return;
        }

        this.showNotification('Getting your location...', 'info');

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                });
            });

            this.showNotification('Fetching nearby hospitals...', 'info');

            const response = await fetch(`${this.backendUrl}/nearby`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayHospitalsMap(position.coords, data.hospitals);
            
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            if (error.code === error.PERMISSION_DENIED) {
                this.showNotification('Location access denied. Please enable location services.', 'error');
            } else if (error.code === error.TIMEOUT) {
                this.showNotification('Location request timed out. Please try again.', 'error');
            } else {
                this.showNotification('Failed to fetch nearby hospitals. Please try again.', 'error');
            }
        }
    }

    displayHospitalsMap(userLocation, hospitals) {
        const modal = document.getElementById('mapModal');
        const mapContainer = document.getElementById('map');
        const hospitalsList = document.getElementById('hospitalsList');

        // Show modal
        modal.classList.remove('hidden');

        // Clear previous map and list
        mapContainer.innerHTML = '';
        hospitalsList.innerHTML = '';

        // Initialize map
        setTimeout(() => {
            try {
                const map = L.map('map').setView([userLocation.latitude, userLocation.longitude], 13);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(map);

                // Add user location marker
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: '<i class="fas fa-user" style="color: #2563eb; font-size: 20px;"></i>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
                    .addTo(map)
                    .bindPopup('Your Location')
                    .openPopup();

                // Add hospital markers
                hospitals.forEach(hospital => {
                    if (hospital.lat && hospital.lon) {
                        const hospitalIcon = L.divIcon({
                            className: 'hospital-marker',
                            html: '<i class="fas fa-hospital" style="color: #ef4444; font-size: 18px;"></i>',
                            iconSize: [18, 18],
                            iconAnchor: [9, 9]
                        });

                        L.marker([hospital.lat, hospital.lon], { icon: hospitalIcon })
                            .addTo(map)
                            .bindPopup(`
                                <strong>${hospital.name}</strong><br>
                                ${hospital.address || 'Address not available'}<br>
                                ${hospital.phone ? `Phone: ${hospital.phone}` : ''}
                            `);
                    }
                });

                // Update hospitals list
                if (hospitals.length === 0) {
                    hospitalsList.innerHTML = '<p>No hospitals found nearby. Try expanding your search range.</p>';
                } else {
                    hospitalsList.innerHTML = hospitals.map(hospital => `
                        <div class="hospital-item">
                            <h4><i class="fas fa-hospital" style="color: #ef4444;"></i> ${hospital.name}</h4>
                            ${hospital.address ? `<p><i class="fas fa-map-marker-alt"></i> ${hospital.address}</p>` : ''}
                            ${hospital.phone ? `<p><i class="fas fa-phone"></i> ${hospital.phone}</p>` : ''}
                        </div>
                    `).join('');
                }

            } catch (mapError) {
                console.error('Error initializing map:', mapError);
                this.showNotification('Error loading map. Please try again.', 'error');
            }
        }, 100);
    }

    hideMapModal() {
        document.getElementById('mapModal').classList.add('hidden');
    }

    showLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
    }

    showForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').classList.remove('hidden');
        this.hideLoginModal();
    }

    hideForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').classList.add('hidden');
    }

    showChatHistory() {
        document.getElementById('chatHistoryModal').classList.remove('hidden');
        this.loadChatHistoryModal();
    }

    hideChatHistoryModal() {
        document.getElementById('chatHistoryModal').classList.add('hidden');
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
        document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    }

    async handleLogin(form) {
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;
        const language = form.querySelector('select').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.backendUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.userToken = data.token;
                this.user = { email, preferred_language: language };
                
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.updateUIForLoggedInUser();
                this.hideLoginModal();
                this.showNotification('Login successful!', 'success');
                
                // Update language if different from preferred
                if (language !== this.currentLanguage) {
                    this.setLanguage(language);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please check your credentials.', 'error');
        }
    }

    async handleRegister(form) {
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;
        const language = form.querySelector('select').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.backendUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    preferred_language: language 
                })
            });

            if (response.ok) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.switchAuthTab('login');
                // Pre-fill the login form
                const loginForm = document.getElementById('loginForm');
                loginForm.querySelector('input[type="email"]').value = email;
                loginForm.querySelector('input[type="password"]').value = password;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Email may already be registered.', 'error');
        }
    }

    async handleForgotPassword(form) {
        const email = form.querySelector('input[type="email"]').value;
        const securityAnswer1 = form.querySelector('#securityAnswer1')?.value;
        const securityAnswer2 = form.querySelector('#securityAnswer2')?.value;
        const newPassword = form.querySelector('#newPassword')?.value;
        const confirmPassword = form.querySelector('#confirmNewPassword')?.value;

        if (!email) {
            this.showNotification('Please enter your email', 'warning');
            return;
        }

        // Show security questions if email is entered
        const securityQuestions = document.getElementById('securityQuestions');
        if (!securityQuestions.classList.contains('hidden')) {
            // Validate security answers and new password
            if (!securityAnswer1 || !securityAnswer2) {
                this.showNotification('Please answer all security questions', 'warning');
                return;
            }

            if (!newPassword || !confirmPassword) {
                this.showNotification('Please enter and confirm your new password', 'warning');
                return;
            }

            if (newPassword.length < 6) {
                this.showNotification('Password must be at least 6 characters long', 'warning');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showNotification('Passwords do not match', 'warning');
                return;
            }

            // In a real app, you would verify security answers and update password
            try {
                const response = await fetch(`${this.backendUrl}/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        security_answers: {
                            pet_name: securityAnswer1,
                            birth_city: securityAnswer2
                        },
                        new_password: newPassword
                    })
                });

                if (response.ok) {
                    this.showNotification('Password reset successful! Please login with your new password.', 'success');
                    this.hideForgotPasswordModal();
                    this.showLoginModal();
                } else {
                    throw new Error('Password reset failed');
                }
            } catch (error) {
                console.error('Password reset error:', error);
                this.showNotification('Password reset failed. Please check your security answers.', 'error');
            }
        } else {
            // Show security questions
            securityQuestions.classList.remove('hidden');
            document.getElementById('forgotPasswordSubmit').textContent = 'Reset Password';
            this.showNotification('Please answer your security questions', 'info');
        }
    }

    updateUIForLoggedInUser() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (this.user) {
            // Hide login button, show user menu
            loginBtn.classList.add('hidden');
            userMenu.classList.remove('hidden');
            
            // Update user email in dropdown
            document.getElementById('userEmail').textContent = this.user.email;
        } else {
            // Show login button, hide user menu
            loginBtn.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.userToken = null;
            this.user = null;
            
            localStorage.removeItem('userToken');
            localStorage.removeItem('user');
            
            this.updateUIForLoggedInUser();
            this.showNotification('Logged out successfully', 'success');
        }
    }

    loadChatHistoryModal() {
        const chatHistoryList = document.getElementById('chatHistoryList');
        
        if (this.chatHistory.length === 0) {
            chatHistoryList.innerHTML = '<div class="chat-history-empty">No chat history available</div>';
            return;
        }

        // Group chat history by date
        const groupedHistory = this.groupChatHistoryByDate();
        
        let html = '';
        
        Object.keys(groupedHistory).forEach(date => {
            const messages = groupedHistory[date];
            const preview = messages.slice(-2).map(msg => 
                msg.sender === 'user' ? `You: ${msg.content}` : `AI: ${msg.content}`
            ).join(' | ');
            
            html += `
                <div class="chat-history-item" data-date="${date}">
                    <div class="chat-history-header">
                        <strong>${this.formatDate(date)}</strong>
                        <span class="chat-history-date">${messages.length} messages</span>
                    </div>
                    <div class="chat-history-preview">
                        ${preview}
                    </div>
                </div>
            `;
        });
        
        chatHistoryList.innerHTML = html;
        
        // Add click event to load specific chat history
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.addEventListener('click', () => {
                const date = item.dataset.date;
                this.loadSpecificChatHistory(date, groupedHistory[date]);
            });
        });
    }

    groupChatHistoryByDate() {
        const grouped = {};
        
        this.chatHistory.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(msg);
        });
        
        return grouped;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    loadSpecificChatHistory(date, messages) {
        // Clear current chat
        document.getElementById('chatMessages').innerHTML = '';
        
        // Add messages from selected date
        messages.forEach(msg => {
            this.addMessageToChat(msg.sender, msg.content);
        });
        
        this.hideChatHistoryModal();
        this.showNotification(`Loaded chat from ${this.formatDate(date)}`, 'success');
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            this.loadChatHistoryModal();
            this.showNotification('Chat history cleared', 'success');
        }
    }

    exportChatHistory() {
        if (this.chatHistory.length === 0) {
            this.showNotification('No chat history to export', 'warning');
            return;
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            totalMessages: this.chatHistory.length,
            chatHistory: this.chatHistory
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nayam-ai-chat-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Chat history exported successfully', 'success');
    }

    getErrorMessage(type) {
        const errorMessages = {
            'chat_error': {
                'en': 'Sorry, I encountered an error. Please try again.',
                'ta': 'மன்னிக்கவும், பிழை ஏற்பட்டது. தயவு செய்து மீண்டும் முயற்சிக்கவும்.',
                'hi': 'क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
                'te': 'క్షమించండి, ఒక లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
                'ml': 'ക്ഷമിക്കണം, ഒരു പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
                'kn': 'ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
            },
            'clear_confirm': {
                'en': 'Are you sure you want to clear the chat history?',
                'ta': 'உரையாடல் வரலாற்றை அழிக்க விரும்புகிறீர்களா?',
                'hi': 'क्या आप वाकई चैट इतिहास साफ करना चाहते हैं?',
                'te': 'మీరు నిజంగా చాట్ చరిత్రను క్లియర్ చేయాలనుకుంటున్నారా?',
                'ml': 'ചാറ്റ് ചരിത്രം മായ്ച്ചുകളയാൻ നിങ്ങൾക്ക് തീർച്ചയായും താൽപ്പര്യമുണ്ടോ?',
                'kn': 'ಚಾಟ್ ಇತಿಹಾಸವನ್ನು ಅಳಿಸಿಹಾಕಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?'
            }
        };

        const lang = this.currentLanguage === 'auto' ? 'en' : this.currentLanguage;
        return errorMessages[type][lang] || errorMessages[type]['en'];
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease',
            maxWidth: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '0.875rem',
            fontWeight: '500'
        });

        const bgColors = {
            info: '#3b82f6',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b'
        };

        notification.style.background = bgColors[type];

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 4000);
    }

    // Utility method to check backend connectivity
    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new NAYAMAI();
    
    // Check backend connection
    const isBackendConnected = await app.checkBackendConnection();
    if (!isBackendConnected) {
        app.showNotification('Backend server is not running. Please start the backend server on port 8000.', 'error');
    }
});

// Add CSS for map markers
const style = document.createElement('style');
style.textContent = `
    .user-location-marker {
        background: transparent;
        border: none;
    }
    .hospital-marker {
        background: transparent;
        border: none;
    }
`;
document.head.appendChild(style);