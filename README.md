# AI Meeting Task Converter

Transform your meeting recordings and transcripts into actionable tasks automatically using advanced AI technology.

## 🚀 Features

### Core Functionality
- **Smart Task Extraction**: Automatically identifies tasks, assignees, deadlines, and priorities from meeting content
- **Multiple Input Methods**: Support for text transcripts, audio files, and video files
- **Intelligent Processing**: Uses OpenAI's GPT-4o for natural language understanding and task identification
- **Visual Task Management**: Clean, organized display with color-coded priority indicators

### Task Management
- **Grid & List Views**: Switch between different viewing modes for your extracted tasks
- **Priority System**: Automatic P3 priority assignment with color coding (P1-Red, P2-Yellow, P3-Green)
- **Edit & Delete**: Modify task details or remove tasks as needed
- **Export Options**: Download tasks as CSV for integration with other tools

### Audio & Video Processing (Extra  Feature)
- **Audio Transcription**: Upload MP3, WAV, M4A files for automatic transcription
- **Video Support**: Process MP4, AVI, MOV, WEBM files with automatic audio extraction
- **Large File Handling**: Support for files up to 250MB
- **High-Quality Processing**: Uses OpenAI Whisper for accurate speech-to-text conversion

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (version 18 or higher)
- OpenAI API Key

### Installation

1. **Clone or download the project**
   ```bash
   git clone <your-repo-url>
   cd ai-task-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:5000`

## 📖 How to Use

### Method 1: Text Input
1. Select "Text Input" tab
2. Paste your meeting transcript into the text area
3. Click "Extract Tasks" to process the content
4. Review and manage the extracted tasks

### Method 2: Audio/Video Upload
1. Select "Audio/Video Upload" tab
2. Drag and drop or click to upload your file
3. Supported formats:
   - **Audio**: MP3, WAV, M4A
   - **Video**: MP4, AVI, MOV, WEBM
4. Wait for processing (transcription + task extraction)
5. Review the extracted tasks

### Task Management
- **View Options**: Toggle between grid and list view using the view selector
- **Edit Tasks**: Click the edit button on any task card to modify details
- **Delete Tasks**: Use the delete button to remove unwanted tasks
- **Export**: Click "Export CSV" to download all tasks
- **Clear All**: Use "Clear All Tasks" to start fresh

## 🎯 What Gets Extracted

The AI automatically identifies and extracts:

- **Task Description**: What needs to be done
- **Assignee**: Who is responsible for the task
- **Deadline**: When the task should be completed
- **Priority**: Automatically assigned as P3 (can be edited)

### Example Input:
> "Aman, you take the landing page by 10 p.m. tomorrow. Rajiv, take care of client follow-up by Wednesday. Shreya, review the marketing deck tonight."

### Extracted Tasks:
1. **Aman** - take the landing page (Deadline: by 10 p.m. tomorrow, Priority: P3)
2. **Rajiv** - take care of client follow-up (Deadline: by Wednesday, Priority: P3)
3. **Shreya** - review the marketing deck (Deadline: tonight, Priority: P3)

## 🔧 Technical Details

### Built With
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **AI Services**: OpenAI GPT-4o, Whisper
- **Audio Processing**: FFmpeg (for video file audio extraction)

### File Size Limits
- Maximum file size: 250MB
- Recommended for optimal performance: Under 100MB

### Supported Languages
- Primarily optimized for English
- Whisper supports multiple languages for transcription

## 🚨 Troubleshooting

### Common Issues

**"Failed to transcribe audio"**
- Check that your OpenAI API key is valid and has sufficient credits
- Ensure the audio file is not corrupted
- Try with a smaller file size

**"Invalid file type"**
- Verify your file is in a supported format
- Check the file extension matches the actual file type

**"File too large"**
- Reduce file size to under 250MB
- Consider splitting longer recordings

### Getting Help
- Check that all environment variables are properly set
- Ensure you have an active internet connection for AI processing
- Verify your OpenAI API key has sufficient credits

## 📝 License

This project is for demonstration and educational purposes. OpenAI API usage is subject to OpenAI's terms of service.

---

*Transform your meetings into actionable tasks with the power of AI!*
