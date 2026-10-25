import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Orbit · 나만의 AI 비서', description: '대화하며 나에게 맞춰가는 개인 AI 작업 공간', robots: { index: false, follow: false } };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="ko"><body>{children}</body></html> }
