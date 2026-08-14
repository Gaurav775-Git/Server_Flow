import React, { useState } from 'react'
import { Bot, ChevronDown, Copy, MessageSquarePlus, PanelRightClose, Send, Sparkles } from 'lucide-react'

const starterMessages = [
  { role: 'agent', text: 'Hi! I can help you build, inspect, and improve your flow. What would you like to work on?' },
]

const Chat_Box = () => {

  return (
    <aside aria-label="AI agents" className="absolute bottom-4 right-4 top-4 z-30 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[#363b44] bg-[#FAF9F6]/95 text-[#d7dce2] shadow-2xl backdrop-blur-xl">
      
    </aside>
  )
}

export default Chat_Box
