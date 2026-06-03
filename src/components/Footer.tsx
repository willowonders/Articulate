import { Mic } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-orange-200/50 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-gray-700">Articulate</span>
          </div>
        
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>Practice speaking. Get better every day.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
