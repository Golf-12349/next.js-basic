import React from 'react'
type Props = {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen w-full bg-white">
        {children}
    </div>
  )
}

export default Layout