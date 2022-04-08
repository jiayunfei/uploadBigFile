import SparkMD5 from 'spark-md5'
import { fileChunkList } from './file'

export const DefaultChunkSize = 5 * 1024 * 1024

export const getFileChunk = (file, chunkSize = DefaultChunkSize) => {
  return new Promise(resolve => {
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
    const chunks = Math.ceil(file.size / chunkSize) // 分了几块
    let currentChunk = 0,
    spark = new SparkMD5.ArrayBuffer(), // 根据文件内容计算出文件的hash值
    // FileReader 对象允许Web应用程序异步读取存储在用户计算机上的文件（或原始数据缓冲区）的内容，
    // 使用 File 或 Blob 对象指定要读取的文件或数据。
    fileReader = new FileReader() 

    // 做一个闭包保持持续作用域
    fileReader.onload = (e) => {
      console.log('读到第', currentChunk + 1, '块')

      const chunk = e.target.result
      spark.append(chunk)
      currentChunk++

      if (currentChunk < chunks) { // 持续读取
        loadNext()
      } else { // 读完了
        let fileHash = spark.end()
        console.info('结束生成hash', fileHash)
        resolve(fileHash)
      }

    }

    fileReader.onerror = err => {
      console.warn('something went wrong', err)
    }

    const loadNext = ()=> { // 持续读取
      const start = currentChunk * chunkSize, // 从哪个位置开始
      end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize // 从哪个位置结束
      let chunk = blobSlice.call(file, start, end)
      fileChunkList.value.push({chunk, size: chunk.size, name: file.name})
      fileReader.readAsArrayBuffer(chunk)
    }

    loadNext() // 触发
  })
}