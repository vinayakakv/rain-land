import type { Chat, Message } from 'whatsapp-web.js'

export const fetchMessages = async (args: { chat: Chat; from: Date }) => {
  const { chat, from } = args
  const limit = 10
  let tryCount = 1
  let messages: Message[] = []
  while (true) {
    messages = await chat.fetchMessages({ limit: limit * tryCount })
    const firstTimestamp = messages.at(0)?.timestamp
    if (!firstTimestamp || firstTimestamp <= from.getTime() / 1000) {
      break
    }
    tryCount += 1
  }
  return messages
    .filter((message) => message.timestamp > from.getTime() / 1000)
    .map((message) => ({
      senderId: message.from,
      text: message.body,
      timestamp: message.timestamp,
    }))
}
