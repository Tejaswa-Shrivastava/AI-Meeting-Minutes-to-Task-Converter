import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Zap, X } from "lucide-react";

interface TranscriptInputProps {
  inputMethod: 'text' | 'audio';
  onExtractFromTranscript: (transcript: string) => Promise<void>;
  onExtractFromAudio: (file: File) => Promise<void>;
  isExtracting: boolean;
}

export default function TranscriptInput({ 
  inputMethod, 
  onExtractFromTranscript, 
  onExtractFromAudio, 
  isExtracting 
}: TranscriptInputProps) {
  const [transcript, setTranscript] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (250MB limit)
      if (file.size > 250 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 250MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedAudioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'];
      const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/webm'];
      const isValidType = allowedAudioTypes.includes(file.type) || 
                         allowedVideoTypes.includes(file.type) ||
                         file.name.match(/\.(mp3|wav|m4a|mp4|avi|mov|webm)$/i);
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file (MP3, WAV, M4A) or video file (MP4, AVI, MOV, WEBM).",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileSelect({ target: { files: dt.files } } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExtract = async () => {
    try {
      if (inputMethod === 'text') {
        if (!transcript.trim()) {
          toast({
            title: "No transcript provided",
            description: "Please enter a meeting transcript to extract tasks from.",
            variant: "destructive",
          });
          return;
        }
        await onExtractFromTranscript(transcript);
      } else {
        if (!selectedFile) {
          toast({
            title: "No audio file selected",
            description: "Please select an audio file to process.",
            variant: "destructive",
          });
          return;
        }
        await onExtractFromAudio(selectedFile);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="space-y-4">
      {inputMethod === 'text' ? (
        <div>
          <Label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Transcript
          </Label>
          <Textarea
            id="transcript"
            rows={8}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full resize-none"
            placeholder="Paste your meeting transcript here...

Example:
&quot;Aman you take the landing page by 10pm tomorrow. Rajeev you take care of client follow-up by Wednesday. Shreya please review the marketing deck tonight.&quot;"
          />
        </div>
      ) : (
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File Upload
          </Label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose Different File
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Audio or Video File</h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop your meeting audio or video file here, or click to browse
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose Media File
                </Button>
                <p className="text-xs text-gray-400 mt-2">Supports Audio: MP3, WAV, M4A | Video: MP4, AVI, MOV, WEBM (Max 250MB)</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.mp4,.avi,.mov,.webm,audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline" 
          onClick={inputMethod === 'text' ? clearTranscript : clearFile}
          disabled={isExtracting}
        >
          Clear
        </Button>
        <Button 
          onClick={handleExtract}
          disabled={isExtracting || (inputMethod === 'text' ? !transcript.trim() : !selectedFile)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isExtracting ? (
            <>
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Extract Tasks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
