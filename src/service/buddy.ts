import { Ollama } from 'ollama/browser'

export const buddy = {
  ollama: new Ollama({ host: import.meta.env.VITE_OLLAMA_URL }),
  modelName: '',

  async initContext(userID: string, systemStr: string) {
    if (this.modelName) {
      console.log(this.modelName + ' already initialized')
    } else {
      const modelName = userID
      const request = {
        model: modelName,
        modelfile: `FROM llama3\nPARAMETER num_ctx 8192\nPARAMETER temperature 0.5\nPARAMETER top_k 10\nPARAMETER top_p 0.5\nSYSTEM ${systemStr} `,
      }
      console.log(request.modelfile)
      await this.ollama.create(request)
      this.modelName = modelName
    }
  },

  async endContext() {
    const response = await this.ollama.delete({ model: this.modelName })
    if (response.status === 'success') this.modelName = ''
  },

  async sendMessageToOllama(messageList: any, callback: Function) {
    if (this.modelName) {
      // lock
      const messages = messageList.map((m) => {
        return { role: m.author === 'buddy' ? 'assistant' : 'user', content: m.data.text }
      })
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: messages,
        stream: true,
      })
      for await (const part of response) {
        callback(part.message.content)
      }
      // unlock
    }
  },
}
