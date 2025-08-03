import type { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'Raahi Dashboard',
  description: 'A carpooling app that connects drivers and passengers for shared rides, making travel more efficient and eco-friendly.',
  applicationName: 'Raahi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Raahi',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#000000',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>

      {children}
    </section>
  )
}
