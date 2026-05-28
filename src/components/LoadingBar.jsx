import React from 'react'

const LoadingBar = ({ active = false, label = '' }) => {
  if (!active) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 w-full bg-blue-500 animate-pulse" />
      {label ? (
        <div className="text-center text-xs py-1 bg-black/40 backdrop-blur-sm">{label}</div>
      ) : null}
    </div>
  )
}

export default LoadingBar
