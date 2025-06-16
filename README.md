🌶️ Spice It Up – Creative Recipe Idea Generator

Spice It Up is a fun, lightweight cooking assistant that helps users create inspiring meal ideas based on the ingredients they already have at home. Whether you’re making oatmeal with banana and peanut butter or cooking dinner with leftovers, the app gives you three smart, creative twists — powered by AI.

Built with a mobile-first mindset, the app works seamlessly with both speech and text, and is packaged as a native app for Android and iOS using Capacitor.

⸻

🚀 Features
	•	🎤 Voice or Text Input
	•	Press and hold the mic to speak (Android/iOS compatible via Google Cloud STT)
	•	Or type ingredients manually
	•	🔁 Tap-to-reshuffle
	•	Get 3 new ideas with a single tap
	•	🌱 Suggestion Modes
	•	Spice It Up – bold flavor twists
	•	Healthify – lighter, nutritious versions
	•	Veganize – plant-based alternatives
	•	⚙️ Custom Settings
	•	Adventurousness Slider (0–100)
	•	Portions Selector (1–8 servings)
	•	Allergy Notes (free text input)
	•	❤️ Favorites System
	•	Save recipe ideas for later
	•	📖 Full Recipe View
	•	See ingredients and preparation steps
	•	Easily save or share

⸻

🧰 Tech Stack
	•	Frontend: HTML, CSS, vanilla JavaScript (Capacitor-wrapped for native mobile)
	•	Backend: Node.js + Express
	•	Database: MySQL (recipes, favorites, user settings)
  - DOCKER
	•	Authentication: Firebase Auth (email & Google login)
	•	AI Engine: Gemini API (OpenAI fallback)
	•	Voice Input: Google Cloud Speech-to-Text (via backend streaming)
	•	Mobile Deployment: Capacitor (Android & iOS builds)
	•	Web Hosting: Netlify (for browser version)

⸻

🧱 Architecture Overview
	•	Firebase handles user authentication
	•	MySQL stores recipes, favorites, and user-specific data
	•	Users are identified by their Firebase uid
	•	Recipes are AI-generated on demand and stored when saved
	•	Capacitor bridges the frontend into native Android/iOS apps
	•	Voice input is recorded in the frontend and transcribed via Google Cloud Speech API

⸻

🧪 MVP Priorities
	•	Clean, responsive interface optimized for mobile
	•	Functional voice + text input
	•	Reliable recipe idea generation with AI
	•	Save and retrieve favorites per user
	•	Generate and display full recipes

⸻

🗺️ Roadmap
	•	Finalize Firebase login and token-based session handling
	•	Polish full recipe view with ingredients + steps
	•	Add recipe sharing (deep link or export)
	•	Android/iOS deployment with Capacitor
	•	Launch token-based pricing system
	•	Add admin panel to edit prompts and system behavior
	•	Support for multiple languages (Spanish, English, more)