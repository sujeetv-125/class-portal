import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  UploadCloud,
  File,
  Trash2,
  Calendar,
  BookOpen,
  AlertCircle,
  FileText,
  ArrowLeft,
  LogOut,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function Teacher() {
  const { currentUser, logout, jwt } = useAuth();
  const navigate = useNavigate();

  // State
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [subject, setSubject] = useState('Math');
  const [description, setDescription] = useState('');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load teacher's uploaded files (which we can filter or just display all from GET /api/materials)
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/materials');
      
      // Filter materials uploaded by this teacher (or display all if required, let's show all and highlight/let them delete their own or all)
      // Since the DELETE endpoint is authorized for teachers, we display the ones uploaded by the logged-in user, or all of them.
      // Usually a teacher page manages all uploaded files or their own. Let's list all files.
      setMaterials(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load uploaded files.');
      toast.error('Failed to load uploaded files.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // react-dropzone config
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false
  });

  // Custom upload helper with XMLHttpRequest to track upload progress
  const uploadFileWithProgress = (file, subjectVal, descVal, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = jwt;
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      xhr.open('POST', `${baseUrl}/upload`);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.message || 'Upload failed'));
          } catch (err) {
            reject(new Error('Upload failed'));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', subjectVal);
      formData.append('description', descVal);
      
      xhr.send(formData);
    });
  };

  // Submit Handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select or drop a file first.');
      return;
    }
    if (!subject) {
      toast.error('Please select a subject.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const newMaterial = await uploadFileWithProgress(
        selectedFile,
        subject,
        description,
        (progress) => setUploadProgress(progress)
      );

      // Successfully uploaded
      toast.success(`Successfully uploaded ${selectedFile.name}`);
      
      // Prepend to the materials list
      setMaterials((prev) => [newMaterial, ...prev]);
      
      // Reset form state
      setSelectedFile(null);
      setDescription('');
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Delete Handler
  const handleDeleteMaterial = async (id, filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      await api.delete(`/materials/${id}`);
      toast.success(`Deleted file: ${filename}`);
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete file.');
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
          <span className="font-sans font-semibold tracking-tight text-lg mr-2">ClassPortal</span>
          <nav className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-1.5 text-xs text-body hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <Link 
              to="/student" 
              className="text-xs text-body hover:text-primary transition-colors font-medium"
            >
              Materials Library
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-2 border-r border-hairline">
            <span className="w-6 h-6 rounded-full bg-canvas-soft-2 border border-hairline flex items-center justify-center text-xs font-semibold text-primary uppercase">
              {currentUser?.name ? currentUser.name[0] : 'T'}
            </span>
            <span className="text-xs text-primary font-medium hidden sm:inline">{currentUser?.name}</span>
            <span className="text-[10px] font-mono uppercase bg-canvas-soft-2 text-body px-1.5 py-0.5 rounded border border-hairline font-semibold">
              Teacher Mode
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
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-md relative overflow-hidden">
            {/* Vercel top line accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet to-highlight-pink opacity-80"></div>
            
            <h2 className="text-lg font-bold tracking-tight text-primary mb-1">Upload Material</h2>
            <p className="text-xs text-body mb-6">Distribute files and notes to your students</p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              {/* Drag-and-drop zone */}
              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1.5">File Upload *</label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? 'border-link bg-link-bg-soft/10' 
                      : selectedFile 
                        ? 'border-hairline-strong bg-canvas-soft-2' 
                        : 'border-hairline hover:border-hairline-strong bg-canvas'
                  }`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="text-xs font-semibold text-primary truncate max-w-[200px]" title={selectedFile.name}>
                        {selectedFile.name}
                      </div>
                      <div className="text-[10px] text-mute font-mono">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-[10px] text-error hover:underline mt-1 font-mono uppercase"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UploadCloud className="w-8 h-8 text-mute group-hover:text-primary transition-colors" />
                      <p className="text-xs font-medium text-primary">
                        Drag & drop a file here
                      </p>
                      <p className="text-[10px] text-mute font-mono">
                        or click to browse local files
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Selector dropdown */}
              <div>
                <label htmlFor="subject-select" className="block text-[10px] font-mono text-body uppercase mb-1.5">Subject *</label>
                <select
                  id="subject-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink focus:outline-none focus:border-hairline-strong transition-colors"
                >
                  <option value="Math">Math</option>
                  <option value="Python">Python</option>
                  <option value="Web Dev">Web Dev</option>
                  <option value="Notes">Notes</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description field */}
              <div>
                <label htmlFor="desc-input" className="block text-[10px] font-mono text-body uppercase mb-1.5">Description</label>
                <textarea
                  id="desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this file for? e.g. Assignment 2 reference materials"
                  rows={4}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors resize-none"
                />
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-body">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-link" />
                      Uploading...
                    </span>
                    <span className="font-semibold text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-canvas-soft-2 h-2 rounded-full overflow-hidden border border-hairline">
                    <div 
                      className="bg-primary h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full h-10 inline-flex items-center justify-center bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all stacked-shadow-md"
              >
                {uploading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading {uploadProgress}%
                  </span>
                ) : (
                  'Upload Material'
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Right column: Files Listing Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-primary">Uploaded Materials</h2>
                <p className="text-xs text-body font-mono">All files loaded onto this classroom portal</p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-canvas-soft-2 text-body px-2 py-1 rounded border border-hairline">
                Total Files: {materials.length}
              </span>
            </div>

            {error && (
              <div className="p-4 bg-error-soft border border-error/20 rounded-sm flex gap-3 text-error text-xs items-center mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin text-primary" />
                <p className="text-xs text-body font-mono mt-4">Loading repository content...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="border border-hairline border-dashed rounded-lg bg-canvas-soft-2/30 py-20 text-center">
                <BookOpen className="w-10 h-10 text-mute mx-auto mb-3" />
                <h3 className="text-xs font-semibold text-primary mb-1">No uploaded files</h3>
                <p className="text-[11px] text-body max-w-xs mx-auto">
                  Use the left upload pane to submit notes, references, or scripts to the portal.
                </p>
              </div>
            ) : (
              /* Custom Vercel-styled table wrapper for horizontal scroll protection */
              <div className="overflow-x-auto border border-hairline rounded-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas-soft border-b border-hairline">
                      <th className="px-4 py-3 font-mono font-semibold uppercase text-mute tracking-wider">File Name</th>
                      <th className="px-4 py-3 font-mono font-semibold uppercase text-mute tracking-wider">Subject</th>
                      <th className="px-4 py-3 font-mono font-semibold uppercase text-mute tracking-wider">Date</th>
                      <th className="px-4 py-3 font-mono font-semibold uppercase text-mute tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {materials.map((m) => {
                      const uploadDate = m.uploadedAt 
                        ? new Date(m.uploadedAt).toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'Unknown';

                      return (
                        <tr 
                          key={m._id}
                          className="hover:bg-canvas-soft-2/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 max-w-[200px]">
                            <a
                              href={m.cloudinaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:text-link hover:underline flex items-center gap-1.5 truncate"
                              title={m.filename}
                            >
                              <File className="w-3.5 h-3.5 text-mute shrink-0" />
                              <span className="truncate">{m.filename}</span>
                            </a>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border border-hairline font-semibold ${
                              m.subject === 'Math' ? 'bg-violet-soft/20 text-violet-deep border-violet-soft/40' :
                              m.subject === 'Python' ? 'bg-warning-soft/20 text-warning-deep border-warning-soft/40' :
                              m.subject === 'Web Dev' ? 'bg-cyan-soft/20 text-cyan-deep border-cyan-soft/40' :
                              m.subject === 'Notes' ? 'bg-link-bg-soft/30 text-link-deep border-link-bg-soft/40' :
                              'bg-canvas-soft-2 text-body'
                            }`}>
                              {m.subject}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-mute whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-mute" />
                              {uploadDate}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-body max-w-[200px]">
                            <p className="truncate" title={m.description}>
                              {m.description || <span className="italic text-mute">No description</span>}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteMaterial(m._id, m.filename)}
                              className="p-1.5 rounded-sm border border-hairline bg-canvas hover:bg-error-soft hover:text-error hover:border-error-soft text-body hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-6 text-center text-xs text-mute font-mono">
        ClassPortal Materials Repository Manager v1.0.0
      </footer>
    </div>
  );
}
