# DoorDrushti - Assistive Vision AI

DoorDrushti is a voice-controlled Android application designed to assist visually impaired individuals by providing real-time scene descriptions and text recognition.

## Features

- **Voice Control**: Navigate the app using natural voice commands ("Describe scene", "Read text", "Emergency help").
- **Object Detection**: Get detailed descriptions of your surroundings powered by Gemini 2.5 Flash.
- **Text Recognition (OCR)**: Read signs, labels, and documents aloud.
- **Emergency Assistance**: Quickly trigger a loud alert or call emergency services.
- **Native Text-to-Speech**: High-quality audio output using the Android system voice engine.

## Built With

- **Framework**: React + Vite
- **Mobile Integration**: Capacitor
- **AI Model**: Google Gemini 2.5 Flash (Vision)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Voice Engine**: Web Speech API (Recognition) + Capacitor Text-to-Speech (Native)

## Getting Started

### Prerequisites

- Node.js & npm
- Android Studio (for mobile deployment)

### Installation

1. Clone the repository
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```
4. Build the project:
   ```sh
   npm run build
   ```
5. Sync with Android:
   ```sh
   npx cap sync android
   ```
6. Open in Android Studio:
   ```sh
   npx cap open android
   ```

## Development

To run the web version locally:
```sh
npm run dev
```

## License

MIT
