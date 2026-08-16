import React from 'react'
import Chat_Box from '../components/chat_box/Chat_Box'

const Playground_Page = () => {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#0d1117]">
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
        className="pointer-events-none absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-[120px]"
        style={{ background: '#00b4d8' }}
      />

      <Chat_Box />
    </main>
  )
}

export default Playground_Page
