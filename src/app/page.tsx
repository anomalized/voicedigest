"use client";

import { useState, useRef } from "react";
import { Mic, Square, Upload, Play, Loader2, Copy, Download, Check, FileWarning } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface ParsedSection {
  title: string;
  content: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [rawMarkdown, setRawMarkdown] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processBlob(audioBlob, "audio/webm");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds the 20MB limit. Please upload a smaller file.");
      return;
    }

    setError(null);
    await processBlob(file, file.type);
  };

  const processBlob = async (blob: Blob, type: string) => {
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setMimeType(type);

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1];
      setAudioBase64(base64data);
    };
  };

  const handleSubmit = async () => {
    if (!audioBase64) return;
    setLoading(true);
    setError(null);
    setSections([]);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType, language }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRawMarkdown(data.text);
      parseMarkdown(data.text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (text: string) => {
    const parts = text.split(/##\s+/).filter(Boolean);
    const parsed: ParsedSection[] = parts.map((part) => {
      const lines = part.split("\n");
      const title = lines[0].trim();
      const content = lines.slice(1).join("\n").trim();
      return { title, content };
    });
    setSections(parsed);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawMarkdown], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VoiceDigest_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTranscriptLength = () => {
    const transcriptItem = sections.find((s) => s.title.toLowerCase().includes("transcript"));
    return transcriptItem ? transcriptItem.content.length : 0;
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-300 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Voice<span className="text-neonteal">Digest</span>
          </h1>
          <p className="text-slate-400">AI-powered transcription, summarization, and action extraction.</p>
        </header>

        {/* Control Panel */}
        <section className="bg-deepslate rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            
            {/* Input Controls */}
            <div className="flex gap-4 w-full md:w-auto">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-neonteal py-3 px-6 rounded-xl transition-all border border-slate-700 hover:border-neonteal"
                >
                  <Mic size={20} /> Record
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-900/50 hover:bg-red-900 text-red-400 py-3 px-6 rounded-xl transition-all border border-red-800"
                >
                  <Square size={20} /> Stop Recording
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-neonpurple py-3 px-6 rounded-xl transition-all border border-slate-700 hover:border-neonpurple"
              >
                <Upload size={20} /> Upload
              </button>
              <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Language Selector */}
            <div className="w-full md:w-48">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-obsidian border border-slate-700 text-slate-300 py-3 px-4 rounded-xl focus:outline-none focus:border-neonteal transition-colors"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-950/30 p-4 rounded-xl border border-red-900/50">
              <FileWarning size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Audio Preview & Submit */}
          {audioUrl && !isRecording && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-4 bg-obsidian rounded-xl border border-slate-800">
                <audio controls src={audioUrl} className="w-full h-10 outline-none" />
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-xl font-medium text-obsidian bg-neonteal hover:bg-teal-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing with Gemini...
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    Generate Digest
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Results Section */}
        {sections.length > 0 && (
          <section className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-semibold text-white">Analysis Results</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">
                  {getTranscriptLength()} characters
                </span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 text-sm text-neonpurple hover:text-purple-400 transition-colors"
                >
                  <Download size={16} /> Download .txt
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {sections.map((section, idx) => (
                <div key={idx} className="bg-deepslate rounded-2xl border border-slate-800 overflow-hidden relative group">
                  <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-neonteal">{section.title}</h3>
                    <button
                      onClick={() => handleCopy(section.content, idx)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === idx ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="p-6 prose prose-invert prose-teal max-w-none">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
