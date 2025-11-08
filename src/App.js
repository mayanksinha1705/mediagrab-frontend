import React, { useState, useEffect } from 'react';
import { Camera, Film, Image, Video, Download, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';

const API_BASE_URL = 'https://mediagrab-downloader-1.onrender.com/api';

const TOOL_THEMES = {
  youtube: {
    primary: '#FF0000',
    gradient: 'from-red-600 to-red-700',
    icon: Film,
    name: 'YouTube',
    placeholder: 'https://www.youtube.com/watch?v=...',
    formats: [
      { id: 'best', label: 'Best Quality (MP4)', format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' },
      { id: '1080p', label: '1080p MP4', format: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]' },
      { id: '720p', label: '720p MP4', format: 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]' },
      { id: 'audio', label: 'Audio Only (MP3)', format: 'bestaudio' }
    ],
    description: 'Download YouTube videos in HD quality - 1080p, 720p, 480p or extract MP3 audio. Free YouTube video downloader with no ads. ("Sorry, but due to YouTubes automated server IP blocking, the video download feature for YouTube is currently unavailable while we implement an advanced authentication bypass. 🛠️")',
    keywords: 'youtube downloader, youtube video download, download youtube, youtube to mp4, youtube to mp3, free youtube downloader'
  },
  tiktok: {
    primary: '#25F4EE',
    gradient: 'from-cyan-400 to-pink-500',
    icon: Video,
    name: 'TikTok',
    placeholder: 'https://www.tiktok.com/@username/video/...',
    formats: [{ id: 'best', label: 'Best Quality', format: 'best' }],
    description: 'Download TikTok videos without watermark. Free TikTok video downloader - save TikTok videos in HD quality.',
    keywords: 'tiktok downloader, download tiktok video, tiktok no watermark, save tiktok video, tiktok video download'
  },
  pinterest: {
    primary: '#E60023',
    gradient: 'from-red-600 to-red-800',
    icon: Image,
    name: 'Pinterest',
    placeholder: 'https://www.pinterest.com/pin/...',
    formats: [{ id: 'best', label: 'Best Quality', format: 'best' }],
    description: 'Download Pinterest images and videos in high quality. Free Pinterest downloader - save pins, images, and videos.',
    keywords: 'pinterest downloader, download pinterest image, save pinterest video, pinterest image download, pinterest pin download'
  },
  instagram: {
    primary: '#833AB4',
    gradient: 'from-purple-600 via-pink-600 to-orange-500',
    icon: Camera,
    name: 'Instagram',
    placeholder: 'https://www.instagram.com/p/...',
    formats: [{ id: 'best', label: 'Best Quality', format: 'best' }],
    description: 'Download Instagram photos, videos, reels, and IGTV. Free Instagram downloader - save Instagram content in HD.',
    keywords: 'instagram downloader, download instagram video, instagram photo download, save instagram reel, instagram video downloader'
  }
};

function App() {
  const [activeTool, setActiveTool] = useState('youtube');
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);

  const theme = TOOL_THEMES[activeTool];

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2);
      if (TOOL_THEMES[hash]) {
        setActiveTool(hash);
        resetForm();
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const resetForm = () => {
    setUrl('');
    setIsValidUrl(null);
    setMetadata(null);
    setSelectedFormat('');
    setDownloadProgress(0);
    setDownloadStatus('');
    setError(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateUrl = (inputUrl) => {
    const patterns = {
      youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
      tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/,
      pinterest: /^(https?:\/\/)?(www\.)?pinterest\.(com|ca|co\.uk)\/.+/,
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/
    };
    return patterns[activeTool]?.test(inputUrl) || false;
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    setError(null);
    setIsValidUrl(value ? validateUrl(value) : null);
    setMetadata(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setIsValidUrl(validateUrl(text));
      setError(null);
    } catch (err) {
      showToast('Failed to read clipboard', 'error');
    }
  };

  const handleAnalyze = async () => {
    if (!isValidUrl) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform: activeTool })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video information');
      }

      const data = await response.json();
      setMetadata({
        title: data.title || 'Unknown Title',
        thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || '',
        duration: data.duration ? formatDuration(data.duration) : null,
        views: data.view_count ? formatNumber(data.view_count) : null,
        uploader: data.uploader || data.channel || null
      });
      setSelectedFormat(theme.formats[0].id);
      showToast('Media analyzed successfully!');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat || !url) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Starting...');
    setError(null);
    
    let eventSource = null;
    
    try {
      const formatConfig = theme.formats.find(f => f.id === selectedFormat);
      
      // 1. Initiate Download Request to Backend
      const response = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          platform: activeTool, 
          format: formatConfig.format, 
          formatId: selectedFormat 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download initiation failed');
      }

      const { downloadId } = await response.json();
      console.log('📥 Download ID:', downloadId);

      // 2. Establish SSE Connection for Progress Tracking
      eventSource = new EventSource(`${API_BASE_URL}/download-progress/${downloadId}`);
      
      eventSource.onmessage = (event) => {
        const progress = JSON.parse(event.data);
        console.log('📊 Progress update:', progress);
        
        if (progress.percent !== undefined) {
          setDownloadProgress(Math.round(progress.percent));
        }
        
        if (progress.status === 'analyzing') {
          setDownloadStatus('Analyzing media...');
        } else if (progress.status === 'downloading') {
          setDownloadStatus('Downloading...');
        } else if (progress.status === 'processing') {
          setDownloadStatus('Processing file...');
        } else if (progress.status === 'complete') {
          setDownloadStatus('Complete! Starting file transfer...');
          
          // Close SSE stream before starting client download
          if (eventSource) eventSource.close(); 
          
          // Wait briefly, then initiate client download
          setTimeout(() => {
            console.log('🔽 Attempting to download file...');
            const downloadUrl = `${API_BASE_URL}/download-file/${downloadId}`;
            
            // Use anchor tag trick to trigger browser download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
            
            showToast('Download completed!');
            
            // Reset state after successful file delivery
            setIsDownloading(false);
            setDownloadProgress(0);
            setDownloadStatus('');
            
          }, 1000); // Wait 1 second for server to prepare file endpoint
        } else if (progress.status === 'error') {
          // Handle error from the server stream
          throw new Error(progress.error || 'Download failed on server.');
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ SSE Connection Error:', error);
        // Close stream and handle error state if the connection breaks
        if (eventSource) eventSource.close();
        setError('Connection lost. Please try again.');
        setDownloadStatus('');
        setIsDownloading(false);
        showToast('Connection error', 'error');
      };
      
    } catch (err) {
      // Catches errors from initial fetch or errors thrown inside onmessage
      console.error('❌ Final Download Error:', err);
      
      if (eventSource) eventSource.close();
      
      setError(err.message);
      setDownloadStatus('');
      showToast(err.message, 'error');
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 2000);
    }
  }; // <-- Syntax error was here!

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const formatNumber = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n);

  const ToolIcon = theme.icon;

  // SEO structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": `MediaGrab - ${theme.name} Video Downloader`,
    "description": theme.description,
    "url": window.location.href,
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "12547"
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${theme.name} Video Downloader - Download ${theme.name} Videos Free | MediaGrab`}</title>
        <meta name="description" content={theme.description} />
        <meta name="keywords" content={theme.keywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Free ${theme.name} Video Downloader - MediaGrab`} />
        <meta property="og:description" content={theme.description} />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${theme.name} Video Downloader`} />
        <meta name="twitter:description" content={theme.description} />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 bg-gradient-to-r ${theme.gradient} rounded-lg flex items-center justify-center`}>
                  <Download className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">MediaGrab</h1>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <a href="#/" className="text-gray-700 hover:text-gray-900">Home</a>
                <button onClick={() => setShowModal('about')} className="text-gray-700 hover:text-gray-900">About</button>
                <button onClick={() => setShowModal('how')} className="text-gray-700 hover:text-gray-900">How It Works</button>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2" aria-label="Toggle menu">
                <div className="w-6 h-5 flex flex-col justify-between">
                  <span className={`w-full h-0.5 bg-gray-900 transition-all ${mobileMenuOpen?'rotate-45 translate-y-2':''}`} />
                  <span className={`w-full h-0.5 bg-gray-900 transition-all ${mobileMenuOpen?'opacity-0':''}`} />
                  <span className={`w-full h-0.5 bg-gray-900 transition-all ${mobileMenuOpen?'-rotate-45 -translate-y-2':''}`} />
                </div>
              </button>
            </div>
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t">
                <a href="#/" className="block py-2 text-gray-700">Home</a>
                <button onClick={() => {setShowModal('about');setMobileMenuOpen(false);}} className="block w-full text-left py-2 text-gray-700">About</button>
                <button onClick={() => {setShowModal('how');setMobileMenuOpen(false);}} className="block w-full text-left py-2 text-gray-700">How It Works</button>
              </div>
            )}
          </div>
        </nav>

        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex overflow-x-auto">
              {Object.entries(TOOL_THEMES).map(([key, tool]) => {
                const Icon = tool.icon;
                const isActive = activeTool === key;
                return (
                  <button key={key} onClick={() => {setActiveTool(key);window.location.hash=`/${key}`;resetForm();}}
                    className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${isActive?'border-current font-semibold':'border-transparent text-gray-600 hover:text-gray-900'}`}
                    style={{color:isActive?tool.primary:undefined}}
                    aria-label={`Switch to ${tool.name} downloader`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{tool.name}</span>
                    {isActive && <span className="w-2 h-2 rounded-full" style={{backgroundColor:tool.primary}} aria-hidden="true" />}
                  </button>
                );
              })}
              </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article className="bg-white rounded-xl shadow-lg overflow-hidden">
            <header className={`bg-gradient-to-r ${theme.gradient} p-6 text-white`}>
              <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-3">
                <ToolIcon className="w-8 h-8" aria-hidden="true" />
                <span>{theme.name} Video Downloader - Free & Fast</span>
              </h2>
              <p className="mt-2 text-white/90">{theme.description}</p>
            </header>

            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3" role="alert">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste {theme.name} URL
                    </label>
                    <div className="flex space-x-2">
                      <input 
                        id="video-url"
                        type="url" 
                        value={url} 
                        onChange={handleUrlChange} 
                        placeholder={theme.placeholder}
                        aria-invalid={isValidUrl === false}
                        aria-describedby={isValidUrl === false ? "url-error" : undefined}
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${isValidUrl===false?'border-red-500 focus:ring-red-200':'border-gray-300 focus:ring-blue-200'}`} 
                      />
                      <button onClick={handlePaste} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg" aria-label="Paste URL from clipboard">
                        <span className="text-sm font-medium">Paste</span>
                      </button>
                    </div>
                    {isValidUrl===false && <p id="url-error" className="mt-2 text-sm text-red-600">Please enter a valid {theme.name} URL</p>}
                    {isValidUrl===true && !metadata && <p className="mt-2 text-sm text-green-600">✓ Valid URL detected</p>}
                  </div>

                  {!metadata ? (
                    <button onClick={handleAnalyze} disabled={!isValidUrl||isAnalyzing}
                      className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      style={{backgroundColor:theme.primary}}
                      aria-busy={isAnalyzing}>
                      {isAnalyzing ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" /><span>Analyzing...</span></>
                      ) : <span>Analyze Media</span>}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="quality-select" className="block text-sm font-medium text-gray-700 mb-2">Select Quality</label>
                        <select 
                          id="quality-select"
                          value={selectedFormat} 
                          onChange={(e)=>setSelectedFormat(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none">
                          {theme.formats.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                      </div>

                      <button onClick={handleDownload} disabled={!selectedFormat||isDownloading}
                        className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        style={{backgroundColor:theme.primary}}
                        aria-busy={isDownloading}>
                        {isDownloading ? (
                          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" /><span>Downloading...</span></>
                        ) : <><Download className="w-5 h-5" aria-hidden="true" /><span>Download</span></>}
                      </button>

                      {isDownloading && (
                        <div className="space-y-2" role="status" aria-live="polite">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-300 rounded-full" style={{width:`${downloadProgress}%`,backgroundColor:theme.primary}} aria-valuenow={downloadProgress} aria-valuemin="0" aria-valuemax="100" />
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{downloadStatus}</span>
                            <span>{downloadProgress}%</span>
                          </div>
                        </div>
                      )}

                      <button onClick={resetForm} className="w-full py-2 text-sm text-gray-600 hover:text-gray-900">Start Over</button>
                    </div>
                  )}
                </div>

                <aside>
                  {metadata ? (
                    <div className="space-y-4">
                      {metadata.thumbnail && <img src={metadata.thumbnail} alt={metadata.title} className="w-full rounded-lg shadow-md" loading="lazy" onError={(e)=>e.target.style.display='none'} />}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{metadata.title}</h3>
                        {metadata.uploader && <p className="text-sm text-gray-600 mt-1">by {metadata.uploader}</p>}
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                          {metadata.duration && <span>⏱️ {metadata.duration}</span>}
                          {metadata.views && <span>👁️ {metadata.views} views</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <ToolIcon className="w-16 h-16 mx-auto mb-4 opacity-20" aria-hidden="true" />
                        <p>Media preview will appear here</p>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </article>

          {/* SEO Content Section */}
          <section className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How to Download {theme.name} Videos
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Copy the {theme.name} video URL from your browser</li>
              <li>Paste the URL into the input field above</li>
              <li>Click "Analyze Media" to fetch video information</li>
              <li>Select your preferred quality format</li>
              <li>Click "Download" and save the file to your device</li>
            </ol>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
              Features of MediaGrab {theme.name} Downloader
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>✅ 100% Free - No registration required</li>
              <li>✅ Fast downloads with real-time progress</li>
              <li>✅ Multiple quality options (HD, 1080p, 720p, 480p)</li>
              <li>✅ Audio extraction to MP3</li>
              <li>✅ No watermarks or ads on downloaded content</li>
              <li>✅ Works on all devices - PC, Mac, Android, iOS</li>
              <li>✅ Secure and private - No data stored</li>
            </ul>
          </section>
        </main>

        <footer className="bg-gray-900 text-gray-300 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-3">MediaGrab</h3>
                <p className="text-sm">Free video downloader for YouTube, TikTok, Instagram, and Pinterest. Download videos in HD quality.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Popular Tools</h3>
                <ul className="text-sm space-y-2">
                  <li><a href="#/youtube" className="hover:text-white">YouTube Downloader</a></li>
                  <li><a href="#/tiktok" className="hover:text-white">TikTok Downloader</a></li>
                  <li><a href="#/instagram" className="hover:text-white">Instagram Downloader</a></li>
                  <li><a href="#/pinterest" className="hover:text-white">Pinterest Downloader</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Resources</h3>
                <ul className="text-sm space-y-2">
                  <li><button onClick={() => setShowModal('how')} className="hover:text-white">How It Works</button></li>
                  <li><button onClick={() => setShowModal('about')} className="hover:text-white">About Us</button></li>
                  <li><a href="#/blog" className="hover:text-white">Blog</a></li>
                  <li><a href="#/faq" className="hover:text-white">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Legal</h3>
                <p className="text-xs text-gray-400">Always respect copyright laws. Only download content you have permission to use.</p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
              <p>© 2025 MediaGrab - Free Video Downloader. Powered by yt-dlp.</p>
            </div>
          </div>
        </footer>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50" role="alert" aria-live="assertive">
            <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${toast.type==='success'?'bg-green-500':'bg-red-500'} text-white`}>
              <span>{toast.message}</span>
              <button onClick={()=>setToast(null)} className="ml-4 text-white/80 hover:text-white" aria-label="Close notification">✕</button>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setShowModal(null)} role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">
                {showModal === 'about' ? 'About MediaGrab' : 'How It Works'}
              </h2>
              {showModal === 'about' ? (
                <div className="space-y-3 text-gray-700">
                  <p>MediaGrab is a free, fast, and secure video downloader supporting multiple platforms including YouTube, TikTok, Instagram, and Pinterest.</p>
                  <p>Our tool uses advanced technology to provide high-quality downloads without watermarks or ads.</p>
                  <p className="text-sm text-red-600 font-semibold">⚠️ Legal Notice: Always respect copyright laws and platform terms of service. Only download content you have rights to use.</p>
                </div>
              ) : (
                <div className="space-y-4 text-gray-700">
                  <p> MediaGrab makes downloading videossimple and fast:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li><strong>Copy URL:</strong> Go to YouTube, TikTok, Instagram, or Pinterest and copy the video URL</li>
                    <li><strong>Paste URL:</strong> Paste it into our downloader</li>
                    <li><strong>Select Quality:</strong> Choose your preferred video quality or audio format</li>
                    <li><strong>Download:</strong> Click download and save to your device</li>
                  </ol>
                  <p className="mt-4">Our downloader works with:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>YouTube videos in 1080p, 720p, 480p, and MP3 audio</li>
                    <li>TikTok videos without watermark</li>
                    <li>Instagram photos, videos, reels, and IGTV</li>
                    <li>Pinterest images and videos in original quality</li>
                  </ul>
                </div>
              )}
              <button onClick={()=>setShowModal(null)} className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
