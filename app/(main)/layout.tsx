import React from 'react'
import Guard from './guard'

type Props = {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen w-full bg-white">
      <Guard>
        {children}
      </Guard>
    </div>
  )
}

export default Layout