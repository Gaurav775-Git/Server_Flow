import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'

const Chat_Box = () => {
  const [expand , setexpand] = useState(false);
  const { register, handleSubmit, reset } = useForm()
  const [reply, setReply] = useState('')

  const onSubmit = async (data) => {
    const res = await fetch("http://127.0.0.1:8001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: data.message })
    })
    const result = await res.json()
    setReply(result.reply)
    reset()
  }

  if(!expand){
    return (
      <button 
      onClick={()=>{setexpand(true)}}
      className="absolute bottom-5 right-4 rounded-lg bg-[lime] px-4 py-2 text-black shadow-lg">
        Start Build ⚙️
      </button>
    )
  }

  return (
    <aside className="absolute bottom-4 right-4 top-4 w-[350px] flex flex-col rounded-xl border border-gray-300 bg-white shadow-lg">

      <button onClick={()=>{setexpand(false)}}>X</button>

      <div className="border-b p-3 font-semibold">Build Assistant</div>

      <div className="flex-1 overflow-y-auto p-3 text-sm text-gray-600">
        {reply || "Start Building by giving some message below..."}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 border-t p-3">
        <input
          type="text"
          placeholder="Type a message"
          {...register("message")}
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-500"
        />
        <button type="submit" className="rounded-lg bg-gray-800 px-3 text-white">
          <Send size={16} />
        </button>
      </form>
    </aside>
  )
}

export default Chat_Box