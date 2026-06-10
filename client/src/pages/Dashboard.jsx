import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Plus, 
  LogIn, 
  LogOut, 
  Folder, 
  User as UserIcon, 
  BookOpen, 
  X, 
  AlertCircle,
  Hash
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Form states
  const [className, setClassName] = useState('');
  const [classSection, setClassSection] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const navigate = useNavigate();

  // Load classrooms
  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/classrooms');
      setClassrooms(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load classrooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Create Classroom Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!className) return setModalError('Classroom name is required.');

    try {
      setModalError('');
      setModalLoading(true);
      const newClass = await api.post('/classrooms', {
        name: className,
        section: classSection,
        description: classDesc
      });
      setClassrooms([newClass, ...classrooms]);
      
      // Reset form
      setClassName('');
      setClassSection('');
      setClassDesc('');
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to create classroom.');
    } finally {
      setModalLoading(false);
    }
  };

  // Join Classroom Submit
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode) return setModalError('Classroom join code is required.');

    try {
      setModalError('');
      setModalLoading(true);
      const joinedClass = await api.post('/classrooms/join', {
        code: joinCode.trim()
      });
      setClassrooms([joinedClass, ...classrooms]);
      
      setJoinCode('');
      setShowJoinModal(false);
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to join classroom.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md h-16 border-b border-hairline flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Link to="/" className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-lg active:scale-95 transition-transform">
              C
            </Link>
            <span className="font-sans font-semibold tracking-tight text-lg">ClassPortal</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link 
              to="/student" 
              className="text-xs text-body hover:text-primary transition-colors font-medium"
            >
              Materials Library
            </Link>
            {currentUser?.role === 'Teacher' && (
              <Link 
                to="/teacher" 
                className="text-xs text-body hover:text-primary transition-colors font-medium"
              >
                Teacher Portal
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-2 border-r border-hairline">
            <span className="w-6 h-6 rounded-full bg-canvas-soft-2 border border-hairline flex items-center justify-center text-xs font-semibold text-primary uppercase">
              {currentUser?.name[0]}
            </span>
            <span className="text-xs text-primary font-medium hidden sm:inline">{currentUser?.name}</span>
            <span className="text-[10px] font-mono uppercase bg-canvas-soft-2 text-body px-1.5 py-0.5 rounded border border-hairline font-semibold">
              {currentUser?.role}
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

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary font-sans">Classrooms</h1>
            <p className="text-xs text-body font-mono mt-0.5">Manage and view your educational workspaces</p>
          </div>
          
          {currentUser?.role === 'Teacher' ? (
            <button
              onClick={() => {
                setModalError('');
                setShowCreateModal(true);
              }}
              className="h-9 px-4 inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-[0.98] transition-all stacked-shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Class
            </button>
          ) : (
            <button
              onClick={() => {
                setModalError('');
                setShowJoinModal(true);
              }}
              className="h-9 px-4 inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-[0.98] transition-all stacked-shadow-md"
            >
              <LogIn className="w-4 h-4" /> Join Class
            </button>
          )}
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-6 p-4 bg-error-soft border border-error/20 rounded-sm flex gap-3 text-error text-xs items-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-body font-mono mt-4">Loading workspaces...</p>
          </div>
        ) : classrooms.length === 0 ? (
          /* Empty State (DESIGN.md matching card-soft / empty card) */
          <div className="border border-hairline rounded-lg bg-canvas-soft-2/50 p-16 text-center max-w-lg mx-auto mt-12 stacked-shadow-sm">
            <BookOpen className="w-12 h-12 text-mute mx-auto mb-4" />
            <h3 className="text-base font-semibold text-primary mb-1">No classrooms yet</h3>
            <p className="text-xs text-body font-sans max-w-xs mx-auto mb-6">
              {currentUser?.role === 'Teacher' 
                ? "Click 'Create Class' to set up a workspace and generate join codes for your students." 
                : "Enter a 6-character class join code provided by your teacher to get enrolled."}
            </p>
            {currentUser?.role === 'Teacher' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 inline-flex items-center justify-center bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-95 transition-opacity"
              >
                Create a Class
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="h-9 px-4 inline-flex items-center justify-center bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 active:scale-95 transition-opacity"
              >
                Join a Class
              </button>
            )}
          </div>
        ) : (
          /* Classroom Grid - 3-up on desktop, 1-up on mobile */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {classrooms.map((c) => (
              <div 
                key={c._id}
                className="bg-canvas border border-hairline hover:border-hairline-strong rounded-md p-6 flex flex-col justify-between transition-colors stacked-shadow-md relative overflow-hidden group"
              >
                {/* Visual decoration: top hair stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet via-highlight-pink to-warning opacity-70 group-hover:opacity-100 transition-opacity"></div>
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono uppercase bg-canvas-soft border border-hairline text-body px-1.5 py-0.5 rounded">
                      Code: {c.code}
                    </span>
                    {c.section && (
                      <span className="text-[10px] font-sans font-medium text-mute">
                        Section {c.section}
                      </span>
                    )}
                  </div>
                  
                  <Link 
                    to={`/class/${c._id}`}
                    className="text-lg font-bold text-primary hover:text-link tracking-tight block mb-2 font-sans line-clamp-1"
                  >
                    {c.name}
                  </Link>
                  
                  <p className="text-xs text-body line-clamp-2 min-h-[2rem] leading-relaxed mb-6 font-sans">
                    {c.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-hairline flex justify-between items-center text-[10px] text-body font-sans">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-mute" />
                    Teacher: {c.owner?.name}
                  </span>
                  
                  <Link 
                    to={`/class/${c._id}`} 
                    className="font-mono text-link hover:underline uppercase tracking-tight flex items-center gap-0.5 font-semibold"
                  >
                    Open Portal →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline py-6 text-center text-xs text-mute font-mono">
        ClassPortal Developer Dashboard v1.0.0
      </footer>

      {/* CREATE CLASSROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-canvas border border-hairline rounded-lg p-6 stacked-shadow-modal relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-mute hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-bold text-primary tracking-tight font-sans mb-1">Create a Classroom</h3>
            <p className="text-[10px] text-body font-mono mb-4">Initialize a new educational node</p>
            
            {modalError && (
              <div className="mb-4 p-3 bg-error-soft border border-error/20 rounded-sm flex gap-2 text-error text-[11px] items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold">{modalError}</p>
              </div>
            )}
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Classroom Name *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Advanced Operating Systems"
                  className="w-full px-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Section</label>
                <input
                  type="text"
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                  placeholder="e.g. CS-401A"
                  className="w-full px-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Description</label>
                <textarea
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  placeholder="Brief syllabus outline or course summary"
                  rows={3}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 px-4 bg-canvas border border-hairline text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
                >
                  {modalLoading ? 'Creating...' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN CLASSROOM MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-canvas border border-hairline rounded-lg p-6 stacked-shadow-modal relative">
            <button 
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-mute hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-bold text-primary tracking-tight font-sans mb-1">Join a Classroom</h3>
            <p className="text-[10px] text-body font-mono mb-4">Link profile via standard enrollment key</p>
            
            {modalError && (
              <div className="mb-4 p-3 bg-error-soft border border-error/20 rounded-sm flex gap-2 text-error text-[11px] items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold">{modalError}</p>
              </div>
            )}
            
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-body uppercase mb-1">Classroom Code (6 characters)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-mute">
                    <Hash className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. ABC123"
                    className="w-full pl-9 pr-3 h-10 bg-canvas border border-hairline rounded-sm text-sm text-ink placeholder:text-mute focus:outline-none focus:border-hairline-strong transition-colors uppercase font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="h-9 px-4 bg-canvas border border-hairline text-xs font-semibold rounded-sm hover:bg-canvas-soft-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="h-9 px-4 bg-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
                >
                  {modalLoading ? 'Enrolling...' : 'Join Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
