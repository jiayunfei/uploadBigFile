import { uploadFile, mergeChunks } from './upload'
import { getFileChunk, DefaultChunkSize } from './chunk'
import { fileChunkList } from './file'
import axios from 'axios'

export const upload = (file, updateProcess) => {
  console.log('onUploadProgress', updateProcess)
  getFileChunk(file).then(fileHash => {
    const requests = fileChunkList.value.map((item, index) => {
      const formData = new FormData()
      formData.append(`${file.name}-${fileHash}-${index}`, item.chunk)
      formData.append('hash', fileHash + '-' + index)
      formData.append('fileHash', fileHash)
      return uploadFile('/upload', formData, updateProcess(item))
    })
    Promise.all(requests).then(() => {
      mergeChunks('/mergeChunks', { size: DefaultChunkSize, filename: file.name })
    })
  }) 
}

export const get = function(url) {
  axios.get('http://localhost:3001' + url)
}
