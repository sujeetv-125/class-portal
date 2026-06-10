import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import {
  File,
  FileText,
  Code,
  Eye,
  EyeOff,
  Download,
  Search,
  X,
  Loader2,
  BookOpen,
  Calendar,
  ArrowLeft,
  LogOut,
  ChevronDown,
  ChevronUp,
  Hash,
  ExternalLink
} from 'lucide-react';

export default function Student() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Materials & loading states
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // PDF Preview states (tracks which material ID is expanded inline)
  const [expandedPdfId, setExpandedPdfId] = useState(null);

  // Code Modal states
  const [selectedCodeMaterial, setSelectedCodeMaterial] = useState(null);
  const [codeContent, setCodeContent] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Fetch materials on load
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.get('/materials');
        setMaterials(data);
      } catch (err) {
        console.error('Failed to load materials:', err);
        setError(err.message || 'Failed to retrieve study materials.');
        toast.error('Failed to retrieve study materials.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Helper to determine if file is code file
  const isCodeFile = (filename = '') => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['py', 'js', 'jsx', 'ts', 'tsx', 'cpp', 'cc', 'c', 'h', 'java', 'html', 'css', 'json', 'sh', 'md', 'txt'].includes(ext);
  };

  // Helper to get highlight.js language name
  const getLanguage = (filename = '') => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'cpp':
      case 'cc':
      case 'c':
      case 'h':
        return 'cpp';
      case 'java':
        return 'java';
      case 'html':
        return 'xml';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'sh':
        return 'bash';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  // Helper to return the file icon based on file type
  const getFileIcon = (filename = '') => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return <FileText className="w-8 h-8 text-error" />;
    } else if (isCodeFile(filename)) {
      return <Code className="w-8 h-8 text-violet" />;
    }
    return <File className="w-8 h-8 text-mute" />;
  };

  // Filter materials based on search query
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const nameMatch = m.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const subjectMatch = m.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || subjectMatch;
    });
  }, [materials, searchQuery]);

  // Group materials by subject
  const groupedMaterials = useMemo(() => {
    return filteredMaterials.reduce((acc, m) => {
      const subject = m.subject || 'Other';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(m);
      return acc;
    }, {});
  }, [filteredMaterials]);

  // Fetch code content dynamically from Cloudinary URL and open modal
  const handleOpenCodeModal = async (material) => {
    try {
      setCodeLoading(true);
      setSelectedCodeMaterial(material);
      setCodeContent('');
      setShowCodeModal(true);

      const response = await fetch(material.cloudinaryUrl);
      if (!response.ok) {
        throw new Error('Failed to retrieve file content.');
      }
      const text = await response.text();
      setCodeContent(text);
    } catch (err) {
      console.error(err);
      toast.error('Could not load code file content.');
      setShowCodeModal(false);
    } finally {
      setCodeLoading(false);
    }
  };

  // Compute syntax highlighted html for modal
  const highlightedHtml = useMemo(() => {
    if (!codeContent || !selectedCodeMaterial) return '';
    const lang = getLanguage(selectedCodeMaterial.filename);
    try {
      return hljs.highlight(codeContent, { language: lang }).value;
    } catch (e) {
      return hljs.highlightAuto(codeContent).value;
    }
  }, [codeContent, selectedCodeMaterial]);

  // Toggle inline PDF preview
  const togglePdfPreview = (id) => {
    if (expandedPdfId === id) {
      setExpandedPdfId(null);
    } else {
      setExpandedPdfId(id);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col justify-between font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md h-16 border-b border-hairline flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-6">
          <Link to="/" className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-lg active:scale-95 transition-transform">
            C
          </Link>
          <span className="font-sans font-semibold tracking-tight text-lg mr-4">ClassPortal</span>
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-body hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-2 border-r border-hairline">
            <span className="w-6 h-6 rounded-full bg-canvas-soft-2 border border-hairline flex items-center justify-center text-xs font-semibold text-primary uppercase">
              {currentUser?.name ? currentUser.name[0] : 'S'}
            </span>
            <span className="text-xs text-primary font-medium hidden sm:inline">{currentUser?.name}</span>
            <span className="text-[10px] font-mono uppercase bg-canvas-soft-2 text-body px-1.5 py-0.5 rounded border border-hairline font-semibold">
              {currentUser?.role === 'Teacher' ? 'Teacher' : 'Student'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="w-8 h-8 rounded-sm border border-hairline bg-canvas flex items-center justify-center text-body hover:text-error hover:border-error-soft active:scale-95 transition-all stacked-shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary font-sans">Materials Library</h1>
            <p className="text-xs text-body font-mono mt-0.5">Explore syllabus materials, scripts, and notes</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-mute pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename or subject..."
              className="w-full pl-9 pr-8 h-9 bg-canvas border border-hairline rounded-sm text-xs text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors stacked-shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-mute hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-error-soft border border-error/20 rounded-sm flex gap-3 text-error text-xs items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loader */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin text-primary" />
            <p className="text-xs text-body font-mono mt-4">Syncing materials index...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          /* Empty State */
          <div className="border border-hairline rounded-lg bg-canvas-soft-2/50 p-16 text-center max-w-lg mx-auto mt-12 stacked-shadow-sm">
            <BookOpen className="w-12 h-12 text-mute mx-auto mb-4" />
            <h3 className="text-base font-semibold text-primary mb-1">No materials found</h3>
            <p className="text-xs text-body font-sans max-w-xs mx-auto mb-4">
              {searchQuery 
                ? "No uploaded items match your filename or subject search query." 
                : "No course materials have been posted to this repository yet."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="h-8 px-4 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-95 transition-opacity"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          /* Grouped Subjects Sections */
          <div className="space-y-12">
            {Object.keys(groupedMaterials).map((subject) => (
              <section key={subject} className="space-y-4">
                
                {/* Subject Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-hairline">
                  <span className="w-5 h-5 rounded bg-primary text-white text-[11px] font-bold flex items-center justify-center font-mono uppercase">
                    {subject[0]}
                  </span>
                  <h2 className="text-sm font-bold tracking-tight text-primary uppercase font-mono">{subject}</h2>
                  <span className="text-[10px] font-mono bg-canvas-soft-2 border border-hairline text-body px-1.5 py-0.2 rounded font-semibold ml-2">
                    {groupedMaterials[subject].length} {groupedMaterials[subject].length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedMaterials[subject].map((m) => {
                    const isPdf = m.filename.toLowerCase().endsWith('.pdf');
                    const isCode = isCodeFile(m.filename);
                    const isPdfExpanded = expandedPdfId === m._id;
                    const uploadDate = m.uploadedAt
                      ? new Date(m.uploadedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'Unknown Date';

                    return (
                      <div
                        key={m._id}
                        className="bg-canvas border border-hairline hover:border-hairline-strong rounded-md p-6 flex flex-col justify-between transition-colors stacked-shadow-md relative overflow-hidden group"
                      >
                        {/* Interactive Accent top line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-deep to-primary opacity-30 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div>
                          {/* File Icon, Badges & Date */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-canvas-soft-2 border border-hairline rounded">
                              {getFileIcon(m.filename)}
                            </div>
                            
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border border-hairline font-bold ${
                                m.subject === 'Math' ? 'bg-violet-soft/20 text-violet-deep border-violet-soft/40' :
                                m.subject === 'Python' ? 'bg-warning-soft/20 text-warning-deep border-warning-soft/40' :
                                m.subject === 'Web Dev' ? 'bg-cyan-soft/20 text-cyan-deep border-cyan-soft/40' :
                                m.subject === 'Notes' ? 'bg-link-bg-soft/30 text-link-deep border-link-bg-soft/40' :
                                'bg-canvas-soft-2 text-body'
                              }`}>
                                {m.subject}
                              </span>
                              
                              <span className="flex items-center gap-1 text-[10px] text-mute font-mono">
                                <Calendar className="w-3 h-3" />
                                {uploadDate}
                              </span>
                            </div>
                          </div>

                          {/* Filename & Description */}
                          <h3 
                            className="text-base font-bold text-primary tracking-tight font-sans mb-1.5 line-clamp-1 cursor-help"
                            title={m.filename}
                          >
                            {m.filename}
                          </h3>
                          
                          <p className="text-xs text-body leading-relaxed mb-6 font-sans line-clamp-2" title={m.description}>
                            {m.description || <span className="italic text-mute">No description provided for this material.</span>}
                          </p>
                        </div>

                        {/* Actions Panel */}
                        <div className="pt-4 border-t border-hairline flex flex-wrap gap-2.5 items-center justify-between">
                          <div className="flex gap-2">
                            {/* PDF Preview Trigger */}
                            {isPdf && (
                              <button
                                onClick={() => togglePdfPreview(m._id)}
                                className={`h-8 px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-sm transition-all border ${
                                  isPdfExpanded 
                                    ? 'bg-canvas-soft-2 border-hairline-strong text-primary' 
                                    : 'bg-canvas border-hairline hover:bg-canvas-soft-2 text-body hover:text-primary active:scale-95'
                                }`}
                              >
                                {isPdfExpanded ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" /> Hide Preview
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" /> Show Preview
                                  </>
                                )}
                              </button>
                            )}

                            {/* Code Preview Trigger */}
                            {isCode && (
                              <button
                                onClick={() => handleOpenCodeModal(m)}
                                className="h-8 px-3 inline-flex items-center gap-1.5 bg-canvas border border-hairline hover:bg-canvas-soft-2 text-body hover:text-primary text-[11px] font-semibold rounded-sm active:scale-95 transition-all"
                              >
                                <Code className="w-3.5 h-3.5" /> Preview Code
                              </button>
                            )}
                          </div>

                          {/* View/Download Cloudinary Link */}
                          <a
                            href={m.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 inline-flex items-center gap-1.5 bg-primary text-white hover:opacity-90 text-[11px] font-semibold rounded-sm active:scale-[0.97] transition-all stacked-shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View / Download
                          </a>
                        </div>

                        {/* Collapsible PDF Inline Preview Iframe */}
                        {isPdf && isPdfExpanded && (
                          <div className="w-full mt-4 border-t border-hairline pt-4 transition-all duration-300 ease-in-out">
                            <div className="bg-canvas-soft-2 border border-hairline rounded-sm overflow-hidden p-1">
                              <iframe
                                src={m.cloudinaryUrl}
                                className="w-full h-80 rounded-xs"
                                title={`PDF Preview for ${m.filename}`}
                              />
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </section>
            ))}
          </div>
        )}

      </main>

      {/* Code syntax highlighted Modal */}
      {showCodeModal && selectedCodeMaterial && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-canvas border border-hairline rounded-lg p-6 stacked-shadow-modal relative flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-hairline pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-primary tracking-tight font-sans truncate max-w-[500px]" title={selectedCodeMaterial.filename}>
                  {selectedCodeMaterial.filename}
                </h3>
                <p className="text-[10px] text-mute font-mono mt-0.5 uppercase tracking-wide">
                  Language: {getLanguage(selectedCodeMaterial.filename)} • Syntax highlighting active
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedCodeMaterial(null);
                  setCodeContent('');
                }}
                className="p-1 rounded-sm border border-hairline bg-canvas hover:bg-canvas-soft-2 text-mute hover:text-primary transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-auto">
              {codeLoading ? (
                <div className="py-24 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin text-primary" />
                  <p className="text-xs text-body font-mono mt-4">Fetching code content...</p>
                </div>
              ) : (
                <pre className="hljs rounded-md p-4 overflow-auto font-mono text-xs max-h-[60vh]">
                  <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-hairline pt-4 mt-4">
              <a
                href={selectedCodeMaterial.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-4 bg-canvas border border-hairline text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 text-body hover:text-primary inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Code
              </a>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedCodeMaterial(null);
                  setCodeContent('');
                }}
                className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-6 text-center text-xs text-mute font-mono mt-12">
        ClassPortal Materials Repository Manager v1.0.0
      </footer>
    </div>
  );
}
