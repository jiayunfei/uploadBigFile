<template>
  <input type="file" @change="fileChange">
  <button @click="uploadFile">上传</button>
  <div>进度: {{totoalPercentage}}</div>
  <button @click="getUser">getuser</button>
</template>

<script>
import { reactive, computed } from 'vue'
import { upload, get } from './request'
import { fileChunkList, setFileChunkList } from './request/file'

let file = null

export default {
  name: 'App',
  setup() {
    const fileChange = (event) => {
      file = event.target.files[0]
    }
    const chunkList = reactive(fileChunkList)
    setFileChunkList(chunkList)
    // 总进度条
    const totoalPercentage = computed(() => {
      if (!chunkList.value.length) {
        return 0
      }
      const loaded = chunkList.value.map(item => item.size * item.percentage)
      .reduce((curr, next) => Number(curr) + Number(next))
      return parseInt(loaded / file.size).toFixed(2)
    })

    // 分块进度
    const onUploadProgress = (item) => (e) => { // e 是后台的回调
      console.log('event', e)
      item.percentage = parseInt(String(e.loaded / e.total) * 100)
    }

    const uploadFile = () => {
      upload(file, onUploadProgress)
    }

    const getUser = () => {
      get('/user')
    }
    return {
      fileChange,
      uploadFile,
      chunkList,
      totoalPercentage,
      onUploadProgress,
      getUser
    }
  }
}
</script>
