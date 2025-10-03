import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GamesPageSidebar from '@/components/GamesPageSidebar'
import PFSNFooter from '@/components/PFSNFooter'
import PFSNHeader from '@/components/PFSNHeader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NFL Logo Drawing Game',
  description: 'Draw NFL team logos from memory and get scored!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="fixed top-0 left-0 w-64 h-full">
              <GamesPageSidebar currentGame="NFL Logo Drawing Game" />
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:ml-0">
            {/* Mobile Header */}
            <div className="lg:hidden">
              <PFSNHeader currentGame="NFL Logo Drawing Game" />
            </div>
            
            {/* Page Content */}
            <main className="flex-1">
              {children}
            </main>
            
            {/* Footer */}
            <PFSNFooter currentPage="NFL" />
          </div>
        </div>
        
        {/* Font Awesome for footer icons */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
        />
      </body>
    </html>
  )
}