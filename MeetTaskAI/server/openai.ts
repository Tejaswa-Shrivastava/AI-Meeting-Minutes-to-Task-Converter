import OpenAI from "openai";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "enter ur api here"
});

export interface ExtractedTask {
  description: string;
  assignee: string;
  deadline: string;
  priority: string;
}

export async function extractTasksFromTranscript(transcript: string): Promise<ExtractedTask[]> {
  try {
    const prompt = `
Analyze the following meeting transcript and extract all actionable tasks. Pay special attention to deadlines and time references.

Look for patterns like:
- "John, you handle the... by Friday"
- "Sarah will take care of... tomorrow"
- "Mike please finish... by 5pm"
- "Complete this by next week"
- "Due by end of day"
- "Before the meeting on Tuesday"

Time references to look for:
- Specific times: "by 5pm", "before 10am", "at 3:30"
- Days: "today", "tomorrow", "Monday", "Friday", "next Tuesday"
- Relative time: "this week", "next week", "end of month", "by EOD"
- Dates: "by January 15th", "before the 20th"

Return the results as a JSON object with a "tasks" array:
{
  "tasks": [
    {
      "description": "brief task description",
      "assignee": "person assigned to the task",
      "deadline": "exact deadline mentioned (preserve original phrasing)",
      "priority": "P3"
    }
  ]
}

Meeting transcript:
${transcript}

IMPORTANT: Capture the exact deadline phrasing from the transcript. If no specific deadline is mentioned, write "No deadline specified". Always default priority to P3 unless P1 or P2 is explicitly mentioned.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at parsing meeting transcripts and extracting actionable tasks. Always respond with valid JSON array format."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
    
    // Debug logging
    console.log("AI Response:", response.choices[0].message.content);
    console.log("Parsed result:", result);
    
    // Handle both direct array and object with tasks array
    const tasks = Array.isArray(result) ? result : (result.tasks || []);
    
    console.log("Extracted tasks:", tasks);
    
    return tasks.map((task: any) => ({
      description: task.description || "",
      assignee: task.assignee || "",
      deadline: task.deadline || "",
      priority: task.priority || "P3"
    }));
  } catch (error) {
    console.error("Error extracting tasks from transcript:", error);
    throw new Error("Failed to process transcript with AI: " + (error as Error).message);
  }
}

async function extractAudioFromVideo(videoBuffer: Buffer, filename: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempVideoPath = path.join('/tmp', `video_${Date.now()}_${filename}`);
    const tempAudioPath = path.join('/tmp', `audio_${Date.now()}.mp3`);
    
    console.log(`Starting audio extraction from video: ${filename}`);
    console.log(`Temp video path: ${tempVideoPath}`);
    console.log(`Temp audio path: ${tempAudioPath}`);
    
    try {
      // Write video buffer to temporary file
      fs.writeFileSync(tempVideoPath, videoBuffer);
      console.log(`Video file written successfully, size: ${videoBuffer.length} bytes`);
    } catch (error) {
      console.error('Failed to write video file:', error);
      reject(new Error('Failed to write video file to disk'));
      return;
    }
    
    // Use FFmpeg to extract audio
    const ffmpeg = spawn('ffmpeg', [
      '-i', tempVideoPath,
      '-vn', // No video
      '-acodec', 'libmp3lame', // Use libmp3lame for MP3 encoding
      '-ab', '128k',
      '-ar', '44100',
      '-y', // Overwrite output file
      tempAudioPath
    ]);
    
    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      console.log(`FFmpeg process finished with code: ${code}`);
      if (stderr) {
        console.log('FFmpeg stderr:', stderr);
      }
      
      // Clean up input file
      try {
        fs.unlinkSync(tempVideoPath);
      } catch (error) {
        console.warn('Failed to clean up input file:', error);
      }
      
      if (code === 0) {
        try {
          if (fs.existsSync(tempAudioPath)) {
            const audioBuffer = fs.readFileSync(tempAudioPath);
            console.log(`Audio extracted successfully, size: ${audioBuffer.length} bytes`);
            fs.unlinkSync(tempAudioPath); // Clean up output file
            resolve(audioBuffer);
          } else {
            reject(new Error('Audio file was not created by FFmpeg'));
          }
        } catch (error) {
          console.error('Failed to read extracted audio:', error);
          reject(new Error('Failed to read extracted audio file'));
        }
      } else {
        reject(new Error(`FFmpeg process failed with code ${code}. Error: ${stderr}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.error('FFmpeg spawn error:', error);
      // Clean up files on error
      try { fs.unlinkSync(tempVideoPath); } catch {}
      try { fs.unlinkSync(tempAudioPath); } catch {}
      reject(new Error(`FFmpeg execution error: ${error.message}`));
    });
  });
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  try {
    let processedAudioBuffer = audioBuffer;
    let processedFilename = filename;
    
    // Check if it's a video file and extract audio
    const isVideo = filename.match(/\.(mp4|avi|mov|webm)$/i);
    if (isVideo) {
      console.log(`Extracting audio from video file: ${filename}`);
      processedAudioBuffer = await extractAudioFromVideo(audioBuffer, filename);
      processedFilename = filename.replace(/\.(mp4|avi|mov|webm)$/i, '.mp3');
    }
    
    // Create a file-like object for OpenAI
    const file = new File([processedAudioBuffer], processedFilename, { 
      type: processedFilename.endsWith('.mp3') ? 'audio/mp3' : 
           processedFilename.endsWith('.wav') ? 'audio/wav' : 
           processedFilename.endsWith('.m4a') ? 'audio/m4a' : 'audio/mpeg'
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}
