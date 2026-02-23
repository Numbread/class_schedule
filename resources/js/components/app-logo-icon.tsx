import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            {/* Calendar base - clean white/light background */}
            <rect x="6" y="12" width="52" height="46" rx="3" fill="currentColor" opacity="0.1"/>

            {/* Calendar header - solid color */}
            <rect x="6" y="12" width="52" height="12" rx="3" fill="currentColor"/>

            {/* Calendar binding rings */}
            <circle cx="18" cy="8" r="2.5" fill="currentColor" opacity="0.4"/>
            <circle cx="46" cy="8" r="2.5" fill="currentColor" opacity="0.4"/>

            {/* Calendar grid - clean lines */}
            <line x1="6" y1="24" x2="58" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
            <line x1="6" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
            <line x1="6" y1="40" x2="58" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
            <line x1="6" y1="48" x2="58" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.15"/>

            {/* Vertical grid lines */}
            <line x1="20" y1="24" x2="20" y2="58" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
            <line x1="34" y1="24" x2="34" y2="58" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
            <line x1="48" y1="24" x2="48" y2="58" stroke="currentColor" strokeWidth="1" opacity="0.1"/>

            {/* Schedule blocks - modern rounded blocks */}
            <rect x="8" y="26" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.6"/>
            <rect x="22" y="26" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
            <rect x="50" y="26" width="6" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>

            <rect x="8" y="34" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
            <rect x="22" y="34" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.6"/>
            <rect x="36" y="34" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>

            <rect x="8" y="42" width="12" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="24" y="42" width="8" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
            <rect x="36" y="42" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.5"/>

            <rect x="8" y="50" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
            <rect x="22" y="50" width="14" height="5" rx="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
    );
}
