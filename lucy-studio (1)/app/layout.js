import './globals.css';
import { IBM_Plex_Sans } from 'next/font/google';
const f = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '600'], variable: '--f' });
export const metadata = { title: 'Lucy Studio' };
export default function L({ children }) { return <html lang="fr"><body className={f.variable}>{children}</body></html>; }
