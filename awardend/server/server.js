const router = require('koa-router')()
const koaBody = require('koa-body')
const path = require('path')

const Koa = require('koa')
const outputPath = path.join(__dirname, '/resources')
const fs = require('fs')
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser');
const app = new Koa()
app.use(bodyParser())

let currChunk = {}

router.get('/user', async ctx => {
  ctx.body = {
    user:'holiday'
  }
})

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath)
}

// 接收分块
router.post('/upload', // 处理文件 formData 数据
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: outputPath,
      onFileBegin: (name, file) => {
        const [filename, fileHash, index] = name.split('.-.')
        const dir = path.join(outputPath, filename)
        // 保存当前chunk信息，发生错误时候返回
        currChunk = {
          filename,
          fileHash,
          index
        }

        // 检查文件夹是否存在，如果不存在则新建文件夹
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }

        // 覆盖文件的完整路径
        file.path = `${dir}/${fileHash}-${index}`
      },
      onError: error => {
        app.status = 400
        app.body = { code: 400, msg: '上传失败', data: currChunk }
      }
    }
  }),
  async ctx => {
    ctx.set('Content-Type', 'application/json')
    ctx.body = JSON.stringify({
      code: 200,
      message: 'upload successfully'
    })
  }
)

// 整合分块
// 合并请求
router.post('/mergeChunks', async (ctx) => {
  console.log(ctx.request.body)
  const { filename, size } = ctx.request.body;
  // 合并 chunks
  await mergeFileChunk(path.join(outputPath, '_' + filename), filename, size);

  // 处理响应
  ctx.set("Content-Type", "application/json");
  ctx.body = JSON.stringify({
    data: {
      code: 2000,
      filename,
      size
    },
    message: 'merge chunks successful！'
  });
});

// 通过管道处理流 
const pipeStream = (path, writeStream) => {
  return new Promise(resolve => {
    const readStream = fs.createReadStream(path);
    readStream.pipe(writeStream);
    readStream.on("end", () => {
      fs.unlinkSync(path);
      resolve();
    });
  });
}

// 合并切片
const mergeFileChunk = async (filePath, filename, size) => {
  const chunkDir = path.join(outputPath, filename);
  const chunkPaths = fs.readdirSync(chunkDir);

  if (!chunkPaths.length) return;

  // 根据切片下标进行排序，否则直接读取目录的获得的顺序可能会错乱
  chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);
  console.log("chunkPaths = ", chunkPaths);

  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        // 指定位置创建可写流
        fs.createWriteStream(filePath, {
          start: index * size,
          end: (index + 1) * size
        })
      )
    )
  );

  // 合并后删除保存切片的目录
  fs.rmdirSync(chunkDir);
};

app.use(cors())
app.use(router.routes()) // 启动路由
app.use(router.allowedMethods())

app.listen(3001, () => {
  console.log('starting at port 3001');
})