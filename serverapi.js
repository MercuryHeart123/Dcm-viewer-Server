const readdir = require("fs/promises").readdir
const join  = require("path").join;
const basename = require("path").basename
const express = require("express")
const app = express()
const fs = require('fs');
const LocalFolder = './dcmFile/local/';
const UploadFolder = './dcmFile/upload/';
var localFilelist = [];
var uploadFilelist = [];
const cors = require("cors");
const corsOptions ={ origin:'*', credentials:true, }


async function* tokenise (path = ".")
{ yield { dir: path }
  for (const dirent of await readdir(path, { withFileTypes: true }))
    if (dirent.isDirectory())
      yield* tokenise(join(path, dirent.name))
    else
      yield { file: join(path, dirent.name) }
  yield { endDir: path }
}

async function parse (iter = empty())
{ const r = [{}]
  for await (const e of iter)
    if (e.dir)
      r.unshift({})
    else if (e.file)
      r[0][basename(e.file)] = true
    else if (e.endDir)
      r[1][basename(e.endDir)] = r.shift()
  return r[0]
}

async function* empty () {}

fs.readdir(LocalFolder, (err, files) => {
  files.forEach(file => {
    localFilelist.push(file);
  });
})

fs.readdir(UploadFolder, (err, files) => {
  files.forEach(file => {
    uploadFilelist.push(file);
  });
})

async function make_dir(FilePath){
  return await new Promise((resolve, reject) => {
    fs.readdir(FilePath, async (err,files) => {
      var arr = [];
      files.forEach(async(file) => {
        if (!file.includes(".dcm")){
          var container = { dir_name: file,
                        sub_dir: {}}
          container.sub_dir = await make_dir(FilePath+ file + '/')
          console.log(container);
          resolve(container)
        }
        else{
          arr.push(file);
        }
      });

      resolve(arr)
    })
  })
}
async function start(){
  app.use(cors(corsOptions))
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({limit: '50mb'}));

  app.post('/upload', (req,res) => {
    var len = String(uploadFilelist.length);
    // process.chdir('C:/Users/VAHAH/Desktop/inuse/dcmFile/');
    let base64 = req.body.file;
    let base64Image = base64.split(';base64,').pop();
    while(len.length<=6){
      len = '0'+len
    }

    fs.writeFile(`./dcmFile/upload/${len}.dcm`, base64Image, {encoding: 'base64'}, function(err) {
      console.log(`${len}.dcm created `);
    });
    uploadFilelist.push(`${len}.dcm`)
  })


  app.get('/list/local', (req,res) => {

    const createTree = (path = ".") =>
        parse(tokenise(path))

    createTree("./dcmFile/local/")
      .then(r => res.send(JSON.stringify(r, null, 2)))
      .catch(console.error)
    console.log("Local list");
  })

  app.get('/list/upload', (req,res) => {
    const createTree = (path = ".") =>
        parse(tokenise(path))

    createTree("./dcmFile/upload/")
      .then(r => res.send(JSON.stringify(r, null, 2)))
      .catch(console.error)
    console.log("Upload listed");
  })

  app.get('/dcm/:folder/:id', function(req, res){
    var id = req.params.id;
    var folder = req.params.folder;
    try{
        const file = `./dcmFile/${folder}/${id}`;
        res.download(file);
        console.log("load", file);
    }
    catch(e){
      console.log(e);
    }

  });

  app.listen(8080, () => {
    console.log('server start at port 8080')
  })
}
start()
