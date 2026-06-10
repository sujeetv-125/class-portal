import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  User as UserIcon, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  Code as CodeIcon, 
  Archive, 
  File, 
  X, 
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

export default function Classroom() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  
  // Data states
  const [classroom, setClassroom] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('Stream'); // 'Stream', 'Classwork', 'People'
  
  // Announcement form states
  const [announceContent, setAnnounceContent] = useState('');
  const [announceFiles, setAnnounceFiles] = useState([]);
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceError, setAnnounceError] = useState('');
  
  // Assignment form states (Teacher only)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignFiles, setAssignFiles] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  
  // Comments input states (announcementId -> text)
  const [commentTexts, setCommentTexts] = useState({});

  // File Icon Helper
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-violet shrink-0" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-4 h-4 text-red-500 shrink-0" />;
    }
    if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-4 h-4 text-yellow-600 shrink-0" />;
    }
    if (['py', 'js', 'ts', 'html', 'css', 'json', 'cpp', 'java', 'c'].includes(ext)) {
      return <CodeIcon className="w-4 h-4 text-green-600 shrink-0" />;
    }
    return <File className="w-4 h-4 text-body shrink-0" />;
  };

  // Load classroom and streams
  const loadClassroomData = async () => {
    try {
      setLoading(true);
      setError('');
      const classData = await api.get(`/classrooms/${id}`);
      setClassroom(classData);
      
      const streamData = await api.get(`/classrooms/${id}/announcements`);
      setAnnouncements(streamData);

      const homeworkData = await api.get(`/classrooms/${id}/assignments`);
      setAssignments(homeworkData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load classroom details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassroomData();
  }, [id]);

  // Announcement post submit
  const handleAnnounceSubmit = async (e) => {
    e.preventDefault();
    if (!announceContent.trim()) return;

    try {
      setAnnounceError('');
      setAnnounceLoading(true);
      
      const formData = new FormData();
      formData.append('content', announceContent);
      for (let i = 0; i < announceFiles.length; i++) {
        formData.append('files', announceFiles[i]);
      }

      const newAnnounce = await api.upload(`/classrooms/${id}/announcements`, formData);
      setAnnouncements([newAnnounce, ...announcements]);
      
      // Reset
      setAnnounceContent('');
      setAnnounceFiles([]);
    } catch (err) {
      console.error(err);
      setAnnounceError(err.message || 'Failed to post announcement.');
    } finally {
      setAnnounceLoading(false);
    }
  };

  // Announcement file selection
  const handleAnnounceFileChange = (e) => {
    if (e.target.files) {
      setAnnounceFiles(Array.from(e.target.files));
    }
  };

  // Remove file from selection
  const removeAnnounceFile = (index) => {
    setAnnounceFiles(announceFiles.filter((_, i) => i !== index));
  };

  // Comment submit
  const handleCommentSubmit = async (e, announcementId) => {
    e.preventDefault();
    const text = commentTexts[announcementId];
    if (!text || !text.trim()) return;

    try {
      const updatedAnnounce = await api.post(`/announcements/${announcementId}/comments`, {
        content: text
      });

      // Update in stream state
      setAnnouncements(announcements.map(a => a._id === announcementId ? updatedAnnounce : a));
      
      // Clear input
      setCommentTexts({
        ...commentTexts,
        [announcementId]: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to post comment.');
    }
  };

  const handleCommentTextChange = (announcementId, text) => {
    setCommentTexts({
      ...commentTexts,
      [announcementId]: text
    });
  };

  // Create assignment submit (Teacher only)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTitle || !assignDesc) {
      return setAssignError('Title and description are required.');
    }

    try {
      setAssignError('');
      setAssignLoading(true);

      const formData = new FormData();
      formData.append('title', assignTitle);
      formData.append('description', assignDesc);
      if (assignDueDate) {
        formData.append('dueDate', assignDueDate);
      }
      for (let i = 0; i < assignFiles.length; i++) {
        formData.append('files', assignFiles[i]);
      }

      const newAssignment = await api.upload(`/classrooms/${id}/assignments`, formData);
      setAssignments([newAssignment, ...assignments]);

      // Reset
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      setAssignFiles([]);
      setShowAssignModal(false);
    } catch (err) {
      console.error(err);
      setAssignError(err.message || 'Failed to create assignment.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignFileChange = (e) => {
    if (e.target.files) {
      setAssignFiles(Array.from(e.target.files));
    }
  };

  const removeAssignFile = (index) => {
    setAssignFiles(assignFiles.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-body font-mono mt-4">Syncing workspace stream...</p>
        </div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-canvas-soft p-6 flex flex-col items-center justify-center">
        <AlertCircle className="w-10 h-10 text-error mb-4" />
        <h3 className="text-lg font-bold text-primary mb-1">Access Denied</h3>
        <p className="text-xs text-body mb-6 text-center max-w-sm">
          {error || 'Classroom not found, or you are not authorized to view this room.'}
        </p>
        <Link to="/dashboard" className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-sm flex items-center justify-center">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isTeacher = classroom.owner._id.toString() === currentUser.id.toString();

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col justify-between">
      {/* Navbar header */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-hairline px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="w-8 h-8 rounded-sm border border-hairline bg-canvas flex items-center justify-center text-body hover:text-primary hover:border-hairline-strong active:scale-95 transition-all stacked-shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-primary font-sans">{classroom.name}</h1>
                {classroom.section && (
                  <span className="text-xs font-mono font-medium text-mute">({classroom.section})</span>
                )}
              </div>
              <p className="text-xs text-body font-sans truncate max-w-md">{classroom.description || 'No classroom details specified.'}</p>
            </div>
          </div>

          {/* Invitation code view */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-body uppercase border-r border-hairline pr-3">Invitation Code</span>
            <span className="font-mono text-sm bg-canvas border border-hairline text-primary font-bold px-2 py-1 rounded stacked-shadow-sm select-all">
              {classroom.code}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="border-b border-hairline bg-canvas">
        <div className="max-w-6xl mx-auto px-6 flex gap-6">
          {['Stream', 'Classwork', 'People'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-xs font-semibold font-mono border-b-2 tracking-wide transition-all ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-body hover:text-primary'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8">
        
        {/* --- TAB 1: STREAM --- */}
        {activeTab === 'Stream' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column (Static info / widgets) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-canvas border border-hairline rounded-md p-4 stacked-shadow-sm">
                <h3 className="text-xs font-mono font-semibold text-primary uppercase mb-2">Upcoming Work</h3>
                {assignments.length === 0 ? (
                  <p className="text-[11px] text-mute">Woohoo, no work due soon!</p>
                ) : (
                  <div className="space-y-3">
                    {assignments.slice(0, 3).map(a => (
                      <div key={a._id} className="text-xs">
                        <Link to={isTeacher ? `/class/${id}` : `/class/${id}/assignment/${a._id}`} className="font-semibold text-primary hover:text-link block line-clamp-1">
                          {a.title}
                        </Link>
                        <span className="text-[10px] text-body flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-mute" />
                          Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No limit'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Announcements feed) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Post Announcement Form */}
              <div className="bg-canvas border border-hairline rounded-md p-5 stacked-shadow-md">
                <form onSubmit={handleAnnounceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-body uppercase mb-2">Announce something to your class</label>
                    <textarea
                      required
                      value={announceContent}
                      onChange={(e) => setAnnounceContent(e.target.value)}
                      placeholder="Share resources, codes, guidelines or links..."
                      rows={3}
                      className="w-full px-4 py-3 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors resize-none"
                    />
                  </div>

                  {announceError && (
                    <div className="p-3 bg-error-soft border border-error/20 rounded-sm text-error text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{announceError}</p>
                    </div>
                  )}

                  {/* Render Selected Files */}
                  {announceFiles.length > 0 && (
                    <div className="border border-hairline bg-canvas-soft-2/50 rounded-sm p-3 space-y-2">
                      <p className="text-[10px] font-mono text-body uppercase border-b border-hairline pb-1.5">Attachments to upload:</p>
                      {announceFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-primary bg-canvas border border-hairline p-2 rounded-sm">
                          <div className="flex items-center gap-2 truncate">
                            {getFileIcon(file.name)}
                            <span className="truncate">{file.name}</span>
                            <span className="text-[10px] text-mute">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeAnnounceFile(idx)}
                            className="text-mute hover:text-error transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-hairline">
                    <label className="h-9 px-3 border border-hairline bg-canvas text-body text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> Attach Files
                      <input
                        type="file"
                        multiple
                        onChange={handleAnnounceFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={announceLoading || !announceContent.trim()}
                      className="h-9 px-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {announceLoading ? 'Posting...' : 'Post'} <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Announcements */}
              <div className="space-y-6">
                {announcements.length === 0 ? (
                  <div className="text-center py-12 bg-canvas/30 border border-hairline border-dashed rounded-md">
                    <MessageSquare className="w-8 h-8 text-mute mx-auto mb-2" />
                    <p className="text-xs text-body font-mono">Stream is empty. Write the first post!</p>
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a._id} className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-sm">
                      
                      {/* Announcement Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-xs font-semibold text-primary uppercase">
                            {a.sender?.name[0]}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">{a.sender?.name}</span>
                              <span className="text-[9px] font-mono uppercase bg-canvas-soft text-body px-1 rounded border border-hairline font-semibold">
                                {a.sender?.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-mute flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-mute" />
                              {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap font-sans mb-4">
                        {a.content}
                      </p>

                      {/* Attachments */}
                      {a.attachments && a.attachments.length > 0 && (
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {a.attachments.map((file, idx) => (
                            <a 
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 border border-hairline bg-canvas-soft p-2.5 rounded-sm hover:border-hairline-strong transition-colors text-xs text-primary"
                            >
                              {getFileIcon(file.name)}
                              <span className="truncate flex-grow hover:underline">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Comments section */}
                      <div className="pt-4 border-t border-hairline space-y-4">
                        <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-2">Class Comments ({a.comments?.length || 0})</h4>
                        
                        {a.comments && a.comments.length > 0 && (
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                            {a.comments.map((comment, idx) => (
                              <div key={idx} className="flex gap-2.5 items-start text-xs bg-canvas-soft-2/30 p-2.5 rounded border border-hairline/60">
                                <span className="w-6 h-6 rounded-full bg-canvas-soft border border-hairline shrink-0 flex items-center justify-center text-[10px] font-semibold text-primary uppercase">
                                  {comment.sender?.name[0]}
                                </span>
                                <div className="flex-grow">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-primary">{comment.sender?.name}</span>
                                    <span className="text-[9px] text-mute font-mono">({new Date(comment.createdAt).toLocaleDateString()})</span>
                                  </div>
                                  <p className="text-body mt-0.5 leading-relaxed font-sans">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input */}
                        <form onSubmit={(e) => handleCommentSubmit(e, a._id)} className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={commentTexts[a._id] || ''}
                            onChange={(e) => handleCommentTextChange(a._id, e.target.value)}
                            placeholder="Add a class comment..."
                            className="flex-grow px-3 h-8 bg-canvas border border-hairline rounded-sm text-xs text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={!commentTexts[a._id] || !commentTexts[a._id].trim()}
                            className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CLASSWORK --- */}
        {activeTab === 'Classwork' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-primary font-sans">Assignments & Materials</h2>
                <p className="text-xs text-body font-mono">Homework guidelines, grading schemas, and deadlines</p>
              </div>
              
              {isTeacher && (
                <button
                  onClick={() => {
                    setAssignError('');
                    setShowAssignModal(true);
                  }}
                  className="h-9 px-4 inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-95 transition-all stacked-shadow-md"
                >
                  <Plus className="w-4 h-4" /> Create Assignment
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-20 border border-hairline border-dashed rounded-md bg-canvas/40">
                <FileText className="w-12 h-12 text-mute mx-auto mb-4" />
                <h3 className="text-base font-semibold text-primary mb-1">No classwork posted yet</h3>
                <p className="text-xs text-body font-sans max-w-xs mx-auto mb-4">
                  {isTeacher 
                    ? "Click 'Create Assignment' to distribute study materials or exercises and collect grading reports." 
                    : "No homework exercises or grading materials have been assigned yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assign) => (
                  <div 
                    key={assign._id}
                    className="bg-canvas border border-hairline rounded-md p-5 stacked-shadow-sm hover:border-hairline-strong transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="w-6 h-6 rounded bg-primary/5 text-primary border border-hairline flex items-center justify-center text-xs shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="text-sm font-bold text-primary font-sans leading-tight">
                          {assign.title}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-body line-clamp-2 max-w-2xl leading-relaxed mb-3">
                        {assign.description}
                      </p>

                      {assign.attachments && assign.attachments.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-mute">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span>{assign.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-hairline flex md:flex-col justify-between items-end gap-2 text-right">
                      {assign.dueDate ? (
                        <span className="text-[10px] font-sans text-body flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-mute" />
                          Due: {new Date(assign.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-mute">No Limit</span>
                      )}

                      <Link 
                        to={isTeacher ? `/class/${id}` : `/class/${id}/assignment/${assign._id}`}
                        onClick={(e) => {
                          if (isTeacher) {
                            // If teacher, route to detail which resolves assignment submissions
                            // Let's route to AssignmentDetail page for both
                            navigate(`/class/${id}/assignment/${assign._id}`);
                          }
                        }}
                        className="h-8 px-3.5 border border-hairline bg-canvas hover:bg-canvas-soft-2 text-primary hover:text-link text-xs font-semibold rounded-sm inline-flex items-center justify-center transition-colors shadow-sm font-mono active:scale-95 shrink-0"
                      >
                        {isTeacher ? 'SUBMISSIONS' : 'VIEW TASK'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: PEOPLE --- */}
        {activeTab === 'People' && (
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Teacher section */}
            <div>
              <h3 className="text-xs font-mono font-semibold text-primary uppercase border-b border-hairline pb-2 mb-3">Teachers</h3>
              <div className="flex items-center gap-3 py-2">
                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold uppercase">
                  {classroom.owner?.name[0]}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-primary leading-none">{classroom.owner?.name}</h4>
                  <span className="text-[10px] text-mute">{classroom.owner?.email}</span>
                </div>
              </div>
            </div>

            {/* Students section */}
            <div className="pt-6">
              <div className="flex justify-between items-center border-b border-hairline pb-2 mb-3">
                <h3 className="text-xs font-mono font-semibold text-primary uppercase">Classmates</h3>
                <span className="text-[10px] font-mono text-body bg-canvas-soft border border-hairline px-1.5 py-0.5 rounded font-semibold">
                  Total: {classroom.students?.length || 0}
                </span>
              </div>

              {classroom.students && classroom.students.length === 0 ? (
                <p className="text-xs text-mute py-4 text-center font-mono">No students enrolled yet. Distribute the class invitation code to add people.</p>
              ) : (
                <div className="space-y-3">
                  {classroom.students?.map((student) => (
                    <div key={student._id} className="flex items-center gap-3 py-2 hover:bg-canvas-soft-2/30 rounded px-1 transition-colors">
                      <span className="w-8 h-8 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-xs font-semibold text-body uppercase">
                        {student.name[0]}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-primary leading-none">{student.name}</h4>
                        <span className="text-[10px] text-mute">{student.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-6 text-center text-xs text-mute font-mono shrink-0">
        ClassPortal Stream Workspace
      </footer>

      {/* CREATE ASSIGNMENT MODAL (Teacher only) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-canvas border border-hairline rounded-lg p-6 stacked-shadow-modal relative">
            <button 
              onClick={() => setShowAssignModal(false)}
              className="absolute top-4 right-4 text-mute hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-bold text-primary tracking-tight font-sans mb-1">Create Assignment</h3>
            <p className="text-[10px] text-body font-mono mb-4">Post exercises or homework criteria</p>
            
            {assignError && (
              <div className="mb-4 p-3 bg-error-soft border border-error/20 rounded-sm flex gap-2 text-error text-[11px] items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold">{assignError}</p>
              </div>
            )}
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Lab 3: Multiprocessing and IPC"
                  className="w-full px-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full px-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink focus:outline-none focus:border-hairline-strong transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Description / Guidelines *</label>
                <textarea
                  required
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Outline the steps, submission format, and criteria..."
                  rows={4}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors resize-none"
                />
              </div>

              {/* Render Selected Files */}
              {assignFiles.length > 0 && (
                <div className="border border-hairline bg-canvas-soft-2/50 rounded-sm p-3 space-y-2 max-h-[150px] overflow-y-auto">
                  <p className="text-[10px] font-mono text-body uppercase border-b border-hairline pb-1">Attachments:</p>
                  {assignFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-primary bg-canvas border border-hairline p-1.5 rounded-sm">
                      <span className="truncate flex-grow mr-2">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeAssignFile(idx)}
                        className="text-mute hover:text-error transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-hairline">
                <label className="h-9 px-3 border border-hairline bg-canvas text-body text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attach criteria
                  <input
                    type="file"
                    multiple
                    onChange={handleAssignFileChange}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="h-9 px-4 bg-canvas border border-hairline text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading || !assignTitle || !assignDesc}
                    className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
                  >
                    {assignLoading ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
