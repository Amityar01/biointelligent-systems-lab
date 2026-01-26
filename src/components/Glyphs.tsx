'use client';

// Waveform Glyph Component - static version
export function WaveformGlyph({ color }: { color: string }) {
    const bars = [0.3, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 0.5];
    return (
        <div className="flex items-center justify-center gap-[2px] h-8">
            {bars.map((height, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{
                        height: `${height * 32}px`,
                        background: color,
                    }}
                />
            ))}
        </div>
    );
}

// Network Glyph Component
export function NetworkGlyph({ color }: { color: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="8" cy="8" r="3" fill={color} opacity="0.8" />
            <circle cx="24" cy="8" r="3" fill={color} opacity="0.8" />
            <circle cx="16" cy="16" r="4" fill={color} />
            <circle cx="8" cy="24" r="3" fill={color} opacity="0.8" />
            <circle cx="24" cy="24" r="3" fill={color} opacity="0.8" />
            <line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth="1" opacity="0.4" />
            <line x1="24" y1="8" x2="16" y2="16" stroke={color} strokeWidth="1" opacity="0.4" />
            <line x1="8" y1="24" x2="16" y2="16" stroke={color} strokeWidth="1" opacity="0.4" />
            <line x1="24" y1="24" x2="16" y2="16" stroke={color} strokeWidth="1" opacity="0.4" />
        </svg>
    );
}

// Brain Glyph Component
export function BrainGlyph({ color }: { color: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3" />
            <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
            <circle cx="16" cy="16" r="4" fill={color} opacity="0.8" />
            <line x1="16" y1="4" x2="16" y2="8" stroke={color} strokeWidth="1" opacity="0.4" />
            <line x1="16" y1="24" x2="16" y2="28" stroke={color} strokeWidth="1" opacity="0.4" />
            <line x1="4" y1="16" x2="8" y2="16" stroke={color} strokeWidth="1" opacity="0.4" />
            <line x1="24" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1" opacity="0.4" />
        </svg>
    );
}
