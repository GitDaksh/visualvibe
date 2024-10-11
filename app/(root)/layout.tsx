import StreamVideoProvider from '@/providers/StreamVideoProvider'
import { Metadata } from 'next';
import React, { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "VisualVibe",
  description: "Video Conferencing Web App",
  icons: {
    icon: '/icons/logo.svg'
  }
};

const RootLayout = ({ children }: {children: ReactNode}) => {
  return (
    <main>
        <StreamVideoProvider>
          { children }
        </StreamVideoProvider>
    </main>
  )
}

export default RootLayout