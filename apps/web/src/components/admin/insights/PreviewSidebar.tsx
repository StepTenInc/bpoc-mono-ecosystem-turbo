'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { FileText, Sparkles, ArrowRight, Rocket, CheckCircle2, UserPlus } from 'lucide-react';

export default function PreviewSidebar() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [sidebarTop, setSidebarTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Start sticking when the top of the container reaches 20px from viewport top
      if (rect.top <= 20) {
        setIsSticky(true);
        setSidebarTop(20);
      } else {
        setIsSticky(false);
      }
    };

    // Find the scrollable parent
    const findScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
      if (!element) return window;
      const style = getComputedStyle(element);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return element;
      }
      return findScrollParent(element.parentElement);
    };

    const scrollParent = findScrollParent(containerRef.current);
    
    if (scrollParent === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      (scrollParent as HTMLElement).addEventListener('scroll', handleScroll, { passive: true });
    }

    // Also listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollParent !== window) {
        (scrollParent as HTMLElement).removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div 
        ref={sidebarRef}
        className="space-y-8"
        style={isSticky ? {
          position: 'fixed',
          top: `${sidebarTop}px`,
          width: containerRef.current?.offsetWidth || 'auto',
          zIndex: 40,
        } : {}}
      >
        {/* Resume Builder CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <FileText className="w-24 h-24 text-cyan-400 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              Resume not passing?
            </h3>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Our AI Resume Builder is designed to beat the ATS filters used by BPO companies. Get a "hired-ready" resume in minutes.
            </p>
            
            <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)] pointer-events-none">
              Build My Resume Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sign Up CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 backdrop-blur-md relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-purple-400" />
              Get Hired Faster
            </h3>
            
            <ul className="space-y-3 mb-6">
              {[
                'Direct access to top BPO employers',
                'One-click application',
                'Salary transparency'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 pointer-events-none">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Free Account
            </Button>
          </div>
        </div>

        {/* Deep Dive Section (placeholder) */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider text-gray-500">Deep Dive</h4>
          <ul className="space-y-4">
            <li className="group block">
              <h5 className="text-gray-300 text-sm font-medium leading-snug mb-1">
                Related articles will appear here based on internal links
              </h5>
              <span className="text-xs text-purple-400 flex items-center mt-1">
                <ArrowRight className="w-3 h-3 mr-1" /> Read more
              </span>
            </li>
          </ul>
        </div>
      </div>
      {/* Placeholder to maintain space when sidebar is fixed */}
      {isSticky && <div style={{ height: sidebarRef.current?.offsetHeight || 0 }} />}
    </div>
  );
}

