import Image from 'next/image'

// Accept 'isDark' as a prop, defaulting to true if not provided
export default function LoadingScreen({ isDark = true }: { isDark?: boolean }) {
    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 ${
            isDark ? 'bg-[#050505] text-white selection:bg-white/20' : 'bg-[#faf9f6] text-stone-900 selection:bg-stone-900/20'
        }`}>
            
            {/* Background Ambient Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse pointer-events-none ${
                isDark ? 'bg-white/10' : 'bg-black/5'
            }`} />

            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
                
                {/* YOUR CUSTOM LOGO WITH FLOATING ANIMATION */}
                <div className="relative w-28 h-28 mb-8 animate-[bounce_3s_infinite]">
                    <Image 
                        // DYNAMIC LOGO SWITCHING HERE
                        src={isDark ? "/pwhitex.png" : "/pblack.png"} 
                        alt="PrintStack Logo" 
                        fill 
                        priority
                        className={`object-contain transition-all duration-700 ${
                            isDark ? 'drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]' : 'drop-shadow-xl'
                        }`}
                    />
                </div>

                {/* Typography */}
                <h1 className="text-3xl font-black tracking-tight mb-3 flex items-center gap-1">
                    PrintStack<span className={`transition-colors duration-700 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>++</span>
                </h1>
                
                {/* Animated Loading Text & Dots */}
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-stone-900'}`} style={{ animationDelay: '0ms' }} />
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-white/60' : 'bg-stone-900/60'}`} style={{ animationDelay: '150ms' }} />
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-white/30' : 'bg-stone-900/30'}`} style={{ animationDelay: '300ms' }} />
                    <p className={`text-xs font-bold uppercase tracking-[0.3em] ml-2 transition-colors duration-700 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
                        Preparing Stack
                    </p>
                </div>

            </div>
        </div>
    )
}