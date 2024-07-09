import { Ollama } from 'ollama/browser'

export const buddy = {
  ollama: new Ollama({ host: import.meta.env.VITE_OLLAMA_URL }),
  modelName: '',

  async initContext(userID: string, systemStr: string) {
    if (this.modelName) {
      console.log(this.modelName + " already initialized")
    } else {
      const modelName = userID ;
      const request = {
        "model": modelName,
        "modelfile": `FROM llama3\nSYSTEM ${systemStr}`
      }
      console.log(request)
      await this.ollama.create(request)
      this.modelName = modelName;
    }
  },

  async endContext() {
    const response = await this.ollama.delete({ model: this.modelName})
    if(response.status === "success")
      this.modelName = ''
  },

  async sendMessageToOllama(message: any, callback: Function) {
    if (this.modelName) {
      // lock
      console.log(message)
      const ollamaMessage = { role: 'user', content: message.data.text }
      const response = await this.ollama.chat({ model: this.modelName, messages: [ollamaMessage], stream: true})
      for await (const part of response) {
        callback(part.message.content)
      }
      // unlock
    }
  }

}