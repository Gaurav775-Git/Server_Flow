import React from 'react'

const Playground_Page = () => {
  return (
    <div className="relative w-full h-screen bg-[#0d1117] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #30363D 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, transparent 0%, #0d1117 75%)',
        }}
      />

      <div
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[120px] pointer-events-none"
        style={{ background: '#00b4d8' }}
      />
    </div>
  )
}

export default Playground_Page