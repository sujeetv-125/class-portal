import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BookOpen, Upload, Shield, Users, Code } from 'lucide-react';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col justify-between overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md h-16 border-b border-hairline flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="font-sans font-semibold tracking-tight text-lg">ClassPortal</span>
        </div>
        <nav className="flex items-center gap-4">
          {currentUser ? (
            <Link 
              to="/dashboard" 
              className="h-8 px-4 flex items-center justify-center bg-primary text-white text-xs font-medium rounded-sm hover:opacity-90 transition-opacity active:scale-95"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="h-8 px-4 flex items-center justify-center text-body hover:text-ink text-xs font-medium rounded-sm transition-colors"
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="h-8 px-4 flex items-center justify-center bg-primary text-white text-xs font-medium rounded-sm hover:opacity-90 transition-opacity active:scale-95"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center">
        <section className="relative w-full max-w-6xl px-6 pt-20 pb-16 text-center flex flex-col items-center mesh-gradient-bg">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-canvas border border-hairline rounded-full stacked-shadow-sm mb-6 animate-pulse">
            <span className="text-[10px] font-mono uppercase bg-link-bg-soft text-link px-2 py-0.5 rounded-full font-semibold">New</span>
            <span className="text-xs text-body font-sans font-medium">Cloudinary storage & Firebase Authentication.</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary font-sans max-w-3xl leading-none mb-6">
            Build and learn in the <span className="bg-gradient-to-r from-violet via-highlight-pink to-warning bg-clip-text text-transparent">Classroom Portal</span>.
          </h1>

          {/* Subheading */}
          <p className="text-base md:text-lg text-body font-sans max-w-xl mb-8 leading-relaxed">
            A minimalist, stark developer-centric interface designed to connect teachers and students. Manage study notes, assign homework, and submit tasks securely.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link 
              to={currentUser ? "/dashboard" : "/register"}
              className="h-12 px-8 inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold rounded-pill hover:opacity-90 transition-all hover:translate-y-[-1px] active:translate-y-[1px] stacked-shadow-md"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to={currentUser ? "/dashboard" : "/login"}
              className="h-12 px-8 inline-flex items-center justify-center bg-canvas text-primary border border-hairline text-sm font-semibold rounded-pill hover:bg-canvas-soft-2 transition-all hover:translate-y-[-1px] active:translate-y-[1px] stacked-shadow-sm"
            >
              Explore Classrooms
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
            <div className="bg-canvas border border-hairline rounded-md p-6 hover:border-hairline-strong transition-colors stacked-shadow-md">
              <div className="w-10 h-10 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center text-primary mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Firebase Authentication</h3>
              <p className="text-sm text-body leading-relaxed">
                Secure, seamless sign-in with verified credentials. Email and password login natively integrated with standard token flows.
              </p>
            </div>

            <div className="bg-canvas border border-hairline rounded-md p-6 hover:border-hairline-strong transition-colors stacked-shadow-md">
              <div className="w-10 h-10 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center text-primary mb-4">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Cloudinary File Engine</h3>
              <p className="text-sm text-body leading-relaxed">
                Instantly store assignments, code files, slides, and study notes. High-performance delivery for PDFs, slides, text files, and images.
              </p>
            </div>

            <div className="bg-canvas border border-hairline rounded-md p-6 hover:border-hairline-strong transition-colors stacked-shadow-md">
              <div className="w-10 h-10 rounded-sm bg-canvas-soft-2 border border-hairline flex items-center justify-center text-primary mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">Teacher & Student Portals</h3>
              <p className="text-sm text-body leading-relaxed">
                Teachers create classrooms and grade submissions. Students join classrooms, download materials, and submit files.
              </p>
            </div>
          </div>
        </section>

        {/* Console / Tech Section */}
        <section className="w-full bg-primary text-white py-16 px-6 md:px-12 flex flex-col items-center border-t border-hairline">
          <div className="w-full max-w-4xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <span className="text-xs font-mono tracking-wider text-mute uppercase">Designed for Tech & Code</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-2 mb-4 leading-tight">
                Submit assignments in any file format.
              </h2>
              <p className="text-sm text-mute leading-relaxed">
                Whether it's a `.py` file, a `.zip` container, or a `.pdf` document, upload files with ease. Review grades and receive feedback in plain markdown comments.
              </p>
            </div>
            <div className="w-full max-w-md bg-canvas-soft-2/5 border border-white/10 rounded-md p-6 text-left shadow-2xl font-mono text-xs text-white/80 overflow-x-auto">
              <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="ml-2 text-[10px] text-white/40">classportal-upload-logs</span>
              </div>
              <div>
                <p className="text-green-400">$ classportal init --project database-atlas</p>
                <p className="text-white/60">Connecting to MongoDB Atlas...</p>
                <p className="text-blue-400">[info] MongoDB database linked successfully</p>
                <p className="text-white/60">Syncing with Cloudinary Storage Engine...</p>
                <p className="text-yellow-400">[warn] No service account found, public-key verification enabled</p>
                <p className="text-green-400">ClassPortal backend is ONLINE on port 5000</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-canvas border-t border-hairline px-6 py-8 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-mute uppercase">© 2026 ClassPortal.</span>
        </div>
        <div className="flex gap-6 text-xs text-body font-medium">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-primary transition-colors">Vercel & Render Setup</a>
        </div>
      </footer>
    </div>
  );
}
