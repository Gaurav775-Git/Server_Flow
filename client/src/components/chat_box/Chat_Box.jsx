import React from 'react'
import { useForm } from 'react-hook-form'
import { Bot, ChevronDown, Copy, MessageSquarePlus, PanelRightClose, Send, Sparkles } from 'lucide-react'

const Chat_Box = () => {
  const { register, handleSubmit, reset } = useForm()

  const onSubmit = async (data) => {
    const res = await fetch("http://127.0.0.1:8001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: data.message })
    })

    const result = await res.json()
    console.log("Reply:", result.reply)

    reset()
  }

  return (
    <aside aria-label="AI agents" className="absolute bottom-4 right-4 top-4 z-30 flex w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[#363b44] bg-[#FAF9F6]/95 text-[#d7dce2] shadow-2xl backdrop-blur-xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="text" {...register("message")} className='text-black' />
        <button type='submit' className='text-black'>Ask</button>
      </form>
    </aside>
  )
}

export default Chat_Box