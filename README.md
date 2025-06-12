# 🌶️ Spice It Up – Creative Recipe Idea Generator

**Spice It Up** is a fun, lightweight cooking assistant that helps users create inspiring meal ideas based on the ingredients they already have at home. Whether you're making oatmeal with banana and peanut butter or cooking dinner with leftovers, the app gives you three smart, creative twists — powered by AI.

Designed to be mobile-friendly and intuitive, the app works with both speech and text, and includes tailored suggestions to fit different diets and moods.

---

## 🚀 Features

- 🎤 **Voice or Text Input**  
  - Press and hold the mic to speak  
  - Or type ingredients manually  
- 🔁 **Tap-to-reshuffle**  
  - Get 3 new ideas with a single tap  
- 🌱 **Suggestion Modes**  
  - **Spice It Up** – bold flavor twists  
  - **Healthify** – lighter, nutritious versions  
  - **Veganize** – plant-based alternatives  
- ⚙️ **Custom Settings**  
  - **Adventurousness Slider** (0–100)  
  - **Portions Selector** (1–8 servings)  
  - **Allergy Notes** (free text input)  
- ❤️ **Favorites System**  
  - Save recipe ideas for later
- 📖 **Full Recipe View**  
  - See ingredients and preparation steps  
  - Easily **save** or **share**

---

## 🧰 Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript  
- **Backend:** Node.js + Express  
- **Database:** MySQL (recipes, favorites, user settings)  
- **Authentication:** Firebase Auth (email & Google login)  
- **AI Engine:** Gemini API (OpenAI fallback)  
- **Voice Input:** Web Speech API  
- **Hosting:** Netlify (web), with future deployment to iOS & Android (Capacitor or React Native)

---

## 🧱 Architecture Overview

- Firebase handles **user authentication**
- MySQL stores **recipes**, **favorites**, and **user-specific data**
- Users are identified by their Firebase `uid`
- Recipes are **AI-generated on demand** and stored if saved

---

## 🧪 MVP Priorities

- Clean, responsive mobile-first interface  
- Working voice + text input  
- Reliable AI idea generation  
- Favorites system with basic auth  
- Ability to view, save, and share full recipes

---

## 🗺️ Roadmap

- [ ] Complete login integration with Firebase  
- [ ] Polish and connect full recipe view  
- [ ] Add recipe sharing via link or export  
- [ ] Mobile deployment with Capacitor or React Native  
- [ ] Add user settings/preferences

---

