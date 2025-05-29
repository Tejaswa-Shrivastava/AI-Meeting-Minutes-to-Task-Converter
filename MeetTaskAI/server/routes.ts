import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { extractTasksFromTranscript, transcribeAudio } from "./openai";
import { transcriptProcessSchema, insertTaskSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video files
  fileFilter: (req, file, cb) => {
    const allowedAudioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'];
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/webm'];
    
    const isAudio = allowedAudioTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a)$/i);
    const isVideo = allowedVideoTypes.includes(file.mimetype) || file.originalname.match(/\.(mp4|avi|mov|webm)$/i);
    
    if (isAudio || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, M4A) and video files (MP4, AVI, MOV, WEBM) are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Process transcript and extract tasks
  app.post("/api/process-transcript", async (req, res) => {
    try {
      const { transcript } = transcriptProcessSchema.parse(req.body);
      
      if (!transcript.trim()) {
        return res.status(400).json({ message: "Transcript cannot be empty" });
      }

      // Extract tasks using OpenAI
      const extractedTasks = await extractTasksFromTranscript(transcript);
      
      // Save tasks to storage
      const savedTasks = [];
      for (const taskData of extractedTasks) {
        if (taskData.description && taskData.assignee && taskData.deadline) {
          const validatedTask = insertTaskSchema.parse(taskData);
          const savedTask = await storage.createTask(validatedTask);
          savedTasks.push(savedTask);
        }
      }

      res.json({ 
        message: `Successfully extracted ${savedTasks.length} tasks`,
        tasks: savedTasks 
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("OpenAI") || error.message.includes("API")) {
          res.status(502).json({ 
            message: "AI service is currently unavailable. Please check your API key and try again." 
          });
        } else if (error.message.includes("parse")) {
          res.status(400).json({ message: "Invalid transcript format" });
        } else {
          res.status(500).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: "Failed to process transcript" });
      }
    }
  });

  // Process audio file
  app.post("/api/process-audio", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      // Transcribe audio using OpenAI Whisper
      const transcript = await transcribeAudio(req.file.buffer, req.file.originalname);
      
      if (!transcript.trim()) {
        return res.status(400).json({ message: "No speech detected in audio file" });
      }

      // Extract tasks from transcript
      const extractedTasks = await extractTasksFromTranscript(transcript);
      
      // Save tasks to storage
      const savedTasks = [];
      for (const taskData of extractedTasks) {
        if (taskData.description && taskData.assignee && taskData.deadline) {
          const validatedTask = insertTaskSchema.parse(taskData);
          const savedTask = await storage.createTask(validatedTask);
          savedTasks.push(savedTask);
        }
      }

      res.json({ 
        transcript,
        message: `Successfully extracted ${savedTasks.length} tasks from audio`,
        tasks: savedTasks 
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("OpenAI") || error.message.includes("API")) {
          res.status(502).json({ 
            message: "AI service is currently unavailable. Please check your API key and try again." 
          });
        } else if (error.message.includes("transcribe")) {
          res.status(400).json({ message: "Failed to transcribe audio. Please ensure it's a valid audio file with clear speech." });
        } else {
          res.status(500).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: "Failed to process audio file" });
      }
    }
  });

  // Delete a specific task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Update a specific task
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const updates = req.body;
      const updatedTask = await storage.updateTask(id, updates);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Clear all tasks
  app.delete("/api/tasks", async (req, res) => {
    try {
      await storage.clearAllTasks();
      res.json({ message: "All tasks cleared successfully" });
    } catch (error) {
      console.error("Error clearing tasks:", error);
      res.status(500).json({ message: "Failed to clear tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
