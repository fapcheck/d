# ZenManager 🧘‍♂️

A modern, distraction-free task and client management application built for deep work and flow state. Now featuring integrated DMCA takedown notice generation.

## ✨ Features

### Core Productivity
*   **Focus-First Design**: Minimalist interface that helps you enter the zone.
*   **Client & Task Management**: Organize work by clients with flexible task tracking.
*   **Deep Work Tools**:
    *   🎧 **Ambient Audio**: Built-in Brown Noise generator for concentration.
    *   ⏱️ **Focus Mode**: Dedicated view for single-tasking.
    *   📊 **Analytics**: Track your focus sessions and productivity trends.
*   **Gamification**: Earn XP, level up, and unlock achievements as you complete tasks.

### DMCA Management
*   **AI-Powered Letter Generation**: Generate legally compliant DMCA takedown notices using AI.
*   **Multi-Recipient Support**: Create notices for websites, hosting providers, and upstream infrastructure.
*   **Profile Management**: Store client profiles with legal information for quick letter generation.
*   **Example Templates**: Built-in professional templates ensure proper tone and escalation language.

### Smart Workflow
*   ✨ **Magnetic Drag & Drop**: Smooth, polished task reordering.
*   ↩️ **Undo/Redo**: Full history support for peace of mind.
*   📅 **Weekly Review**: Review your progress at the end of the week.
*   🔍 **Quick Add**: Natural language task input with multi-client support.

## 🛠️ Tech Stack

*   **Core**: React 18, TypeScript, Vite
*   **Desktop**: Tauri 2.0 (Ready)
*   **State**: Custom Hooks + Refs (Optimized for performance)
*   **UI/UX**: Framer Motion, Tailwind CSS, Lucide Icons, dnd-kit
*   **AI**: Groq API with Llama 3.3-70B for DMCA letter generation

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm

### Installation

1.  Clone the repository
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm run test:run
```

## ⌨️ Keyboard Shortcuts

*   `Ctrl+Z`: Undo
*   `Ctrl+Shift+Z`: Redo
*   `Esc`: Close Modal

---
*Built with ❤️ for the Flow State.*
