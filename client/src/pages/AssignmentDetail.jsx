import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  ArrowLeft, 
  Calendar, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Code as CodeIcon, 
  Archive, 
  File, 
  X, 
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Clock,
  User as UserIcon,
  ChevronRight,
  Download,
  AlertTriangle
} from 'lucide-react';

export default function AssignmentDetail() {
  const { id: classId, assignmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]); // List for teacher
  const [mySubmission, setMySubmission] = useState(null); // Single for student
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student form states
  const [subContent, setSubContent] = useState('');
  const [subFiles, setSubFiles] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Teacher grading states (submissionId -> { grade, feedback })
  const [grades, setGrades] = useState({});
  const [gradingErrors, setGradingErrors] = useState({});
  const [gradingLoadings, setGradingLoadings] = useState({});

  // Active submission detail for teacher grading highlight
  const [activeSubmission, setActiveSubmission] = useState(null);

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load Assignment details
      const assignData = await api.get(`/assignments/${assignmentId}`);
      setAssignment(assignData);

      // Load Submissions
      const subData = await api.get(`/assignments/${assignmentId}/submissions`);
      if (currentUser.role === 'Teacher') {
        setSubmissions(subData);
        // Pre-fill grades state
        const initialGrades = {};
        subData.forEach(s => {
          initialGrades[s._id] = {
            grade: s.grade !== undefined ? s.grade : '',
            feedback: s.feedback || ''
          };
        });
        setGrades(initialGrades);
      } else {
        setMySubmission(subData);
        if (subData) {
          setSubContent(subData.content || '');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId, currentUser.role]);

  // Student submission handler
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (subFiles.length === 0 && !subContent.trim()) {
      return setSubError('Please upload a file or write a summary comment.');
    }

    try {
      setSubError('');
      setSubLoading(true);
      
      const formData = new FormData();
      formData.append('content', subContent);
      for (let i = 0; i < subFiles.length; i++) {
        formData.append('files', subFiles[i]);
      }

      const res = await api.upload(`/assignments/${assignmentId}/submissions`, formData);
      setMySubmission(res);
      setIsResubmitting(false);
    } catch (err) {
      console.error(err);
      setSubError(err.message || 'Failed to submit assignment.');
    } finally {
      setSubLoading(false);
    }
  };

  const handleSubFileChange = (e) => {
    if (e.target.files) {
      setSubFiles(Array.from(e.target.files));
    }
  };

  const removeSubFile = (index) => {
    setSubFiles(subFiles.filter((_, i) => i !== index));
  };

  // Teacher grading submit handler
  const handleGradeSubmit = async (submissionId) => {
    const data = grades[submissionId];
    if (!data || data.grade === '') {
      return setGradingErrors({ ...gradingErrors, [submissionId]: 'Grade value is required.' });
    }

    try {
      setGradingErrors({ ...gradingErrors, [submissionId]: '' });
      setGradingLoadings({ ...gradingLoadings, [submissionId]: true });

      const res = await api.post(`/submissions/${submissionId}/grade`, {
        grade: Number(data.grade),
        feedback: data.feedback
      });

      // Update in submissions array
      setSubmissions(submissions.map(s => s._id === submissionId ? { ...s, grade: res.grade, feedback: res.feedback } : s));
      
      if (activeSubmission && activeSubmission._id === submissionId) {
        setActiveSubmission({ ...activeSubmission, grade: res.grade, feedback: res.feedback });
      }

      alert('Grade saved successfully.');
    } catch (err) {
      console.error(err);
      setGradingErrors({ ...gradingErrors, [submissionId]: err.message || 'Failed to grade submission.' });
    } finally {
      setGradingLoadings({ ...gradingLoadings, [submissionId]: false });
    }
  };

  const handleGradeChange = (submissionId, field, value) => {
    setGrades({
      ...grades,
      [submissionId]: {
        ...grades[submissionId],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-body font-mono mt-4">Restoring submission files...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-canvas-soft p-6 flex flex-col items-center justify-center">
        <AlertCircle className="w-10 h-10 text-error mb-4" />
        <h3 className="text-lg font-bold text-primary mb-1">Failed to load assignment</h3>
        <p className="text-xs text-body mb-6 text-center max-w-sm">
          {error || 'Assignment details could not be found.'}
        </p>
        <Link to={`/class/${classId}`} className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-sm flex items-center justify-center">
          Back to Classroom
        </Link>
      </div>
    );
  }

  const isTeacher = currentUser.role === 'Teacher';
  const showForm = !mySubmission || isResubmitting;

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-hairline px-6 py-4 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/class/${classId}`} 
              className="w-8 h-8 rounded-sm border border-hairline bg-canvas flex items-center justify-center text-body hover:text-primary hover:border-hairline-strong active:scale-95 transition-all stacked-shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-mono uppercase text-mute">Assignment Portal</span>
              <h1 className="text-lg font-bold tracking-tight text-primary font-sans leading-tight mt-0.5">{assignment.title}</h1>
            </div>
          </div>
          <span className="text-xs font-sans text-body bg-canvas border border-hairline px-2.5 py-1 rounded stacked-shadow-sm font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-mute" />
            Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Limit'}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8">
        
        {/* --- TEACHER VIEW --- */}
        {isTeacher ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Submissions list (2 cols on large screen) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-canvas border border-hairline rounded-md p-5 stacked-shadow-sm">
                <h2 className="text-base font-bold text-primary tracking-tight font-sans mb-1">Student Submissions</h2>
                <p className="text-[10px] text-body font-mono mb-4">Select a student submission to view materials and enter grading report</p>

                {submissions.length === 0 ? (
                  <div className="text-center py-12 border border-hairline border-dashed rounded-md bg-canvas-soft-2/50">
                    <UserIcon className="w-8 h-8 text-mute mx-auto mb-2" />
                    <p className="text-xs text-body font-mono">No submissions recorded yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {submissions.map((sub) => {
                      const isGraded = sub.grade !== undefined && sub.grade !== null;
                      const isSelected = activeSubmission && activeSubmission._id === sub._id;
                      
                      return (
                        <div 
                          key={sub._id}
                          onClick={() => setActiveSubmission(sub)}
                          className={`py-3.5 flex justify-between items-center cursor-pointer transition-colors px-2 rounded-sm ${
                            isSelected 
                              ? 'bg-primary/5 border-l-2 border-primary' 
                              : 'hover:bg-canvas-soft-2/30 border-l-2 border-transparent'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-semibold text-primary">{sub.student?.name}</h4>
                            <span className="text-[10px] text-mute flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-mute" />
                              Submitted: {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {isGraded ? (
                              <span className="text-[10px] font-mono uppercase bg-success/10 border border-success/20 text-success px-2 py-0.5 rounded font-semibold">
                                Graded: {sub.grade}/100
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono uppercase bg-warning/10 border border-warning/20 text-warning px-2 py-0.5 rounded font-semibold">
                                Pending
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-mute" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Grading Details Panel */}
            <div className="lg:col-span-1">
              {activeSubmission ? (
                <div className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-md sticky top-24 space-y-6">
                  
                  {/* Selected Submission Header */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-mute">Active grading target</span>
                    <h3 className="text-base font-bold text-primary font-sans leading-none mt-1">{activeSubmission.student?.name}</h3>
                    <p className="text-[10px] text-body mt-1">{activeSubmission.student?.email}</p>
                  </div>

                  {/* Submission Comments */}
                  {activeSubmission.content && (
                    <div className="bg-canvas-soft-2 border border-hairline p-3 rounded-sm">
                      <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-1">Student Comments</h4>
                      <p className="text-xs text-primary font-sans leading-relaxed">{activeSubmission.content}</p>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  <div>
                    <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-2">Submitted Files</h4>
                    {activeSubmission.attachments && activeSubmission.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {activeSubmission.attachments.map((file, idx) => (
                          <a 
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between border border-hairline bg-canvas-soft-2/50 p-2.5 rounded-sm hover:border-hairline-strong transition-colors text-xs text-primary"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getFileIcon(file.name)}
                              <span className="truncate hover:underline">{file.name}</span>
                            </div>
                            <Download className="w-3.5 h-3.5 text-mute" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-mute italic">No files attached to submission.</p>
                    )}
                  </div>

                  {/* Grading Form */}
                  <div className="pt-4 border-t border-hairline">
                    <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-3">Assessment Report</h4>
                    
                    {gradingErrors[activeSubmission._id] && (
                      <div className="mb-3 p-2.5 bg-error-soft border border-error/20 text-error text-[10px] rounded flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p>{gradingErrors[activeSubmission._id]}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-body uppercase mb-1">Score (out of 100) *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={grades[activeSubmission._id]?.grade || ''}
                          onChange={(e) => handleGradeChange(activeSubmission._id, 'grade', e.target.value)}
                          placeholder="e.g. 95"
                          className="w-full px-3 h-9 bg-canvas border border-hairline rounded-sm text-xs text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-body uppercase mb-1">Teacher Feedback</label>
                        <textarea
                          value={grades[activeSubmission._id]?.feedback || ''}
                          onChange={(e) => handleGradeChange(activeSubmission._id, 'feedback', e.target.value)}
                          placeholder="Provide performance breakdown or recommendations..."
                          rows={4}
                          className="w-full px-3 py-2 bg-canvas border border-hairline rounded-sm text-xs text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors resize-none font-sans"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGradeSubmit(activeSubmission._id)}
                        disabled={gradingLoadings[activeSubmission._id]}
                        className="w-full h-9 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
                      >
                        {gradingLoadings[activeSubmission._id] ? 'Saving...' : 'Save Assessment Report'}
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-canvas/50 border border-hairline border-dashed rounded-md p-8 text-center text-xs text-body font-mono">
                  Select a student from the submissions list to view files and assign grades.
                </div>
              )}
            </div>

          </div>
        ) : (
          
          /* --- STUDENT VIEW --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Assignment Details (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Assignment Criteria Card */}
              <div className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-sm">
                <span className="text-[10px] font-mono uppercase text-mute">Detailed syllabus/instructions</span>
                <h2 className="text-xl font-bold tracking-tight text-primary font-sans mt-1 mb-4">{assignment.title}</h2>
                
                <p className="text-sm text-body leading-relaxed whitespace-pre-wrap mb-6 font-sans">
                  {assignment.description}
                </p>

                {/* Assignment Attachments */}
                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div className="pt-4 border-t border-hairline">
                    <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-2">Study Materials / Lab Criteria</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {assignment.attachments.map((file, idx) => (
                        <a 
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 border border-hairline bg-canvas-soft p-2.5 rounded-sm hover:border-hairline-strong transition-colors text-xs text-primary"
                        >
                          {getFileIcon(file.name)}
                          <span className="truncate flex-grow hover:underline">{file.name}</span>
                          <Download className="w-3.5 h-3.5 text-mute" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Submission Panel */}
            <div className="lg:col-span-1">
              
              {/* Submission State Display */}
              {mySubmission && !isResubmitting ? (
                /* SUBMITTED STATE */
                <div className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-md space-y-6">
                  
                  {/* Status Indicator */}
                  <div className="flex justify-between items-center border-b border-hairline pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-mute">Submissions manager</span>
                      <h3 className="text-sm font-bold text-primary font-sans mt-0.5">Your Work</h3>
                    </div>
                    {mySubmission.grade !== undefined && mySubmission.grade !== null ? (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/20 text-success text-[10px] font-semibold font-mono uppercase rounded">
                        <CheckCircle className="w-3 h-3" /> Graded
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-link-bg-soft text-link text-[10px] font-semibold font-mono uppercase rounded">
                        <Clock className="w-3 h-3" /> Turned In
                      </div>
                    )}
                  </div>

                  {/* Submission Grade display */}
                  {mySubmission.grade !== undefined && mySubmission.grade !== null && (
                    <div className="bg-success/5 border border-success/20 rounded-md p-4 space-y-2">
                      <div className="flex justify-between items-center text-success font-semibold text-xs">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Score Achieved:
                        </span>
                        <span className="font-mono text-base font-bold bg-success/10 px-2 py-0.5 rounded border border-success/10">{mySubmission.grade} / 100</span>
                      </div>
                      {mySubmission.feedback && (
                        <div className="pt-2 border-t border-success/10 text-body text-xs font-sans italic leading-relaxed">
                          <strong>Teacher Feedback:</strong> "{mySubmission.feedback}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submitted Files */}
                  <div>
                    <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-2">Uploaded Files</h4>
                    {mySubmission.attachments && mySubmission.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {mySubmission.attachments.map((file, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between border border-hairline bg-canvas-soft-2/50 p-2.5 rounded-sm text-xs text-primary"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getFileIcon(file.name)}
                              <span className="truncate">{file.name}</span>
                            </div>
                            <a href={file.url} target="_blank" rel="noreferrer" title="Download">
                              <Download className="w-3.5 h-3.5 text-mute hover:text-primary transition-colors" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-mute italic">No files attached to submission.</p>
                    )}
                  </div>

                  {/* Submitted comments */}
                  {mySubmission.content && (
                    <div>
                      <h4 className="text-[10px] font-mono text-body uppercase tracking-wider mb-1">Your comments</h4>
                      <p className="text-xs text-body font-sans bg-canvas-soft-2 p-2.5 rounded-sm border border-hairline leading-relaxed">{mySubmission.content}</p>
                    </div>
                  )}

                  {/* Resubmit controls (Disabled if graded) */}
                  {mySubmission.grade === undefined || mySubmission.grade === null ? (
                    <button
                      onClick={() => setIsResubmitting(true)}
                      className="w-full h-9 border border-hairline bg-canvas hover:bg-canvas-soft-2 text-primary text-xs font-semibold rounded-sm transition-colors active:scale-95 shadow-sm"
                    >
                      Resubmit Work
                    </button>
                  ) : (
                    <div className="p-3 bg-canvas-soft-2 border border-hairline rounded-sm flex gap-2 text-[10px] text-mute items-center font-mono">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-mute" />
                      <p>Assignment is graded. Submissions locked.</p>
                    </div>
                  )}

                </div>
              ) : (
                /* SUBMISSION FORM (NEW OR RESUBMISSION) */
                <div className="bg-canvas border border-hairline rounded-md p-6 stacked-shadow-md space-y-6">
                  
                  <div className="border-b border-hairline pb-4">
                    <span className="text-[10px] font-mono uppercase text-mute">Submissions manager</span>
                    <h3 className="text-sm font-bold text-primary font-sans mt-0.5">Turn In Your Work</h3>
                  </div>

                  {subError && (
                    <div className="p-3 bg-error-soft border border-error/20 rounded-sm text-error text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>{subError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmissionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-body uppercase mb-1">Submission Comments</label>
                      <textarea
                        value={subContent}
                        onChange={(e) => setSubContent(e.target.value)}
                        placeholder="Add remarks, codes, summaries, or web links..."
                        rows={3}
                        className="w-full px-3 py-2 bg-canvas border border-hairline rounded-sm text-xs text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors resize-none font-sans"
                      />
                    </div>

                    {/* Files container */}
                    {subFiles.length > 0 && (
                      <div className="border border-hairline bg-canvas-soft-2/50 rounded-sm p-3 space-y-2">
                        <p className="text-[10px] font-mono text-body uppercase border-b border-hairline pb-1">Attachments to upload:</p>
                        {subFiles.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-primary bg-canvas border border-hairline p-2 rounded-sm">
                            <span className="truncate flex-grow mr-2">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeSubFile(idx)}
                              className="text-mute hover:text-error transition-colors shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <label className="h-9 w-full border border-hairline bg-canvas text-body text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" /> Attach submission files
                        <input
                          type="file"
                          multiple
                          onChange={handleSubFileChange}
                          className="hidden"
                        />
                      </label>

                      <div className="flex gap-2">
                        {isResubmitting && (
                          <button
                            type="button"
                            onClick={() => setIsResubmitting(false)}
                            className="flex-1 h-9 bg-canvas border border-hairline text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 transition-colors active:scale-95"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={subLoading || (subFiles.length === 0 && !subContent.trim())}
                          className="flex-1 h-9 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center active:scale-95 shadow-sm"
                        >
                          {subLoading ? 'Uploading...' : 'Turn In'}
                        </button>
                      </div>
                    </div>
                  </form>

                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-6 text-center text-xs text-mute font-mono shrink-0">
        ClassPortal Work Submission Console
      </footer>
    </div>
  );
}
