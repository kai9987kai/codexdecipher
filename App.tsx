import React, { useState, useRef, useEffect } from 'react';
import { UploadedFile, AnalysisState } from './types';
import { streamManuscriptAnalysis, streamChatWithManuscript } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';
import ScanOverlay from './components/ScanOverlay';
import { 
  ArrowUpTrayIcon, 
  SparklesIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function App() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle', text: '' });
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setFile({
          file: selectedFile,
          dataUrl: event.target?.result as string
        });
        setAnalysis({ status: 'idle', text: '' });
        setChatHistory([]);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setAnalysis({ status: 'analyzing', text: '' });

    try {
      const stream = await streamManuscriptAnalysis(file.dataUrl);
      
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setAnalysis(prev => ({
          ...prev,
          text: fullText
        }));
      }

      setAnalysis(prev => ({ ...prev, status: 'complete' }));
    } catch (error: any) {
      setAnalysis({ 
        status: 'error', 
        text: '', 
        error: error.message || 'Analysis failed.' 
      });
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !file) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      // Add a placeholder for the model's response
      setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
      
      const stream = await streamChatWithManuscript(chatHistory, userMsg, file.dataUrl);
      
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        // Update the last message in history (the model's placeholder)
        setChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex].role === 'model') {
             updated[lastIndex] = { ...updated[lastIndex], text: fullResponse };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        // If we failed during streaming, replace/append error message
        const errorMsg = "I'm having trouble reading the manuscript right now.";
        if (updated[lastIndex].role === 'model' && updated[lastIndex].text === '') {
           updated[lastIndex] = { role: 'model', text: errorMsg };
        } else {
           updated.push({ role: 'model', text: errorMsg });
        }
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetApp = () => {
    setFile(null);
    setAnalysis({ status: 'idle', text: '' });
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-ancient-100 font-sans selection:bg-amber-900 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0c0a09]/80 backdrop-blur-md border-b border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="w-6 h-6 text-amber-500" />
            <h1 className="font-display text-xl tracking-wider text-ancient-50">CODEX <span className="text-amber-500">DECIPHER</span></h1>
          </div>
          {file && (
            <button 
              onClick={resetApp}
              className="flex items-center gap-2 text-sm text-ancient-400 hover:text-amber-400 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              New Scan
            </button>
          )}
        </div>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto h-[calc(100vh-20px)]">
        {!file ? (
          // Empty State / Upload
          <div className="h-full flex flex-col items-center justify-center animate-fade-in">
            <div className="max-w-xl w-full text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-900/20 flex items-center justify-center border border-amber-500/30">
                  <SparklesIcon className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-4xl font-display text-ancient-50">Decode the Unknown</h2>
                <p className="text-lg text-ancient-300 leading-relaxed font-serif">
                  Upload an image of an ancient manuscript, undeciphered text, or mysterious symbol. 
                  Our AI will attempt to analyze the script, interpret illustrations, and provide historical context.
                </p>
              </div>

              <div 
                className="group relative border-2 border-dashed border-ancient-700 hover:border-amber-500/50 bg-ancient-900/30 hover:bg-ancient-900/50 rounded-xl p-12 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <div className="space-y-4 pointer-events-none">
                  <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-ancient-500 group-hover:text-amber-400 transition-colors" />
                  <p className="font-medium text-ancient-200">Click to upload or drag and drop</p>
                  <p className="text-sm text-ancient-500">Supports JPG, PNG, WEBP</p>
                </div>
              </div>
              
              <p className="text-xs text-ancient-600 font-mono">
                POWERED BY GEMINI 2.5 FLASH • MULTIMODAL PALEOGRAPHY
              </p>
            </div>
          </div>
        ) : (
          // Split View
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            
            {/* Left Column: Image Viewer */}
            <div className="relative flex flex-col gap-4 h-full min-h-[50vh]">
              <div className="relative flex-1 bg-black/40 rounded-xl border border-ancient-800 overflow-hidden flex items-center justify-center group">
                <img 
                  src={file.dataUrl} 
                  alt="Manuscript" 
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
                {analysis.status === 'analyzing' && <ScanOverlay />}
              </div>
              
              {/* Action Bar */}
              <div className="flex gap-4">
                 <button 
                  onClick={startAnalysis}
                  disabled={analysis.status === 'analyzing' || analysis.status === 'complete'}
                  className={`flex-1 py-4 rounded-lg font-display font-bold tracking-widest transition-all
                    ${analysis.status === 'idle' 
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-[0_0_20px_rgba(217,119,6,0.3)]' 
                      : 'bg-ancient-800 text-ancient-500 cursor-not-allowed opacity-50'
                    }`}
                >
                  {analysis.status === 'idle' ? 'INITIATE DECODING' : 
                   analysis.status === 'analyzing' ? 'DECODING...' : 'ANALYSIS COMPLETE'}
                </button>
              </div>
            </div>

            {/* Right Column: Analysis & Chat */}
            <div className="flex flex-col h-full bg-ancient-900/20 rounded-xl border border-ancient-800 overflow-hidden relative">
              {analysis.status === 'idle' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-ancient-500 p-8 text-center opacity-60">
                  <MagnifyingGlassIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-serif italic text-lg">"The past is a foreign country; they do things differently there."</p>
                  <p className="text-sm mt-2">Ready to analyze visual and textual layers.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Results Area */}
                  <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {analysis.error ? (
                      <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                        <h3 className="font-bold mb-2">Decryption Error</h3>
                        <p>{analysis.error}</p>
                      </div>
                    ) : (
                       <div className="animate-fade-in">
                          {/* Chat History if it exists, otherwise Analysis */}
                          {chatHistory.length > 0 ? (
                            <div className="space-y-6">
                              {/* Analysis Summary */}
                              <div className="border-b border-ancient-700/50 pb-6 mb-6">
                                <h2 className="text-amber-500 text-xs font-bold tracking-widest mb-4 uppercase">Initial Findings</h2>
                                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar opacity-80 hover:opacity-100 transition-opacity">
                                   <MarkdownRenderer content={analysis.text} />
                                </div>
                              </div>
                              
                              {/* Conversation */}
                              <div className="space-y-4">
                                {chatHistory.map((msg, idx) => (
                                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-4 text-sm leading-relaxed ${
                                      msg.role === 'user' 
                                        ? 'bg-amber-900/40 text-ancient-100 border border-amber-800/30' 
                                        : 'bg-ancient-800/40 text-ancient-200 border border-ancient-700/30'
                                    }`}>
                                      {msg.role === 'model' ? <MarkdownRenderer content={msg.text} /> : msg.text}
                                    </div>
                                  </div>
                                ))}
                                {isChatLoading && (
                                  <div className="flex justify-start">
                                    <div className="bg-ancient-800/40 rounded-lg p-4 flex gap-2 items-center">
                                      {/* If we are streaming, text might be empty initially, show dots then */}
                                      {chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model' && chatHistory[chatHistory.length - 1].text === '' && (
                                        <>
                                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-75"></div>
                                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150"></div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div ref={chatEndRef} />
                              </div>
                            </div>
                          ) : (
                             <MarkdownRenderer content={analysis.text} />
                          )}
                          
                          {/* Cursor effect during analysis streaming */}
                          {analysis.status === 'analyzing' && (
                            <span className="inline-block w-2 h-5 ml-1 bg-amber-500 animate-pulse align-middle"></span>
                          )}
                       </div>
                    )}
                  </div>

                  {/* Input Area (Only visible after initial analysis starts) */}
                  {(analysis.status === 'complete' || chatHistory.length > 0) && (
                    <div className="p-4 bg-black/20 border-t border-ancient-800">
                      <form onSubmit={handleChatSubmit} className="relative">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask a specific question about the manuscript..."
                          className="w-full bg-ancient-900/50 border border-ancient-700 text-ancient-100 placeholder-ancient-600 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-serif"
                        />
                        <button 
                          type="submit"
                          disabled={isChatLoading || !chatInput.trim()}
                          className="absolute right-2 top-2 p-1.5 text-ancient-400 hover:text-amber-400 disabled:opacity-50 transition-colors"
                        >
                          <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;