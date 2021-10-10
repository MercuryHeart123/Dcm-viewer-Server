const readdir = require("fs/promises").readdir
const join  = require("path").join;
const basename = require("path").basename
const express = require("express")
const app = express()
const fs = require('fs');
const LocalFolder = './dcm/local/';
const UploadFolder = './dcm/upload/';

const cors = require("cors");
const corsOptions ={ origin:'*', credentials:true, }
var lenLocal ;
var lenUpload;

async function* tokenise (path = ".")
{ yield { dir: path }
  
  for (const dirent of await readdir(path, { withFileTypes: true }))
    if (dirent.isDirectory())
      yield* tokenise(join(path, dirent.name))
    else
      yield { file: join(path, dirent.name) }

  yield { endDir: path }
}

async function parse (iter = empty(), index, islocal=true)
{ const r = [{}]
  var a=0;
  var fileIndex = 0;
  var end =false;
  for await (const e of iter)
    if (e.dir){
      r.unshift({})

    }
    else if (e.file){
      if (fileIndex >= index && islocal == false){ // skip index that unwanted 
        continue;
      }
      end = true;
      fileIndex++;
      r[0][basename(e.file)] = true
      
    }

    else if (e.endDir){
      if(end == true){
        a++
        end = false;
      }
      r[1][basename(e.endDir)] = r.shift()
      if(Object.keys(r[0]).length == index && islocal){
        return r[0]
      }
      

      }

  return r[0]
}

async function* empty () {}

fs.readdir(LocalFolder, (err, files) => {
  lenLocal = files.length;
})

fs.readdir(UploadFolder, (err, files) => {
  lenUpload = files.length;
})

async function start(){
  app.use(cors(corsOptions))
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({limit: '50mb'}));

  app.post('/upload', (req,res) => {
    var len = lenUpload.toString();;
    let base64 = req.body.file;
    let base64Image = base64.split(';base64,').pop();

    while(len.length<=6){
      len = '0'+len

    }

    fs.writeFile(`./dcm/upload/${len}.dcm`, base64Image, {encoding: 'base64'}, function(err) {
      console.log(`${len}.dcm created `);
    });
    lenUpload+=1;
  })


  app.get('/list/local/:index', (req,res) => {
    var index = req.params.index;
    const createTree = (path = ".", index) =>
        parse(tokenise(path), index)

    createTree("./dcm/local/", index)
    .then(r => {
                  r[`MaxIndex`] = lenLocal;
                  res.send(JSON.stringify(r, null, 2))
                })
      .catch(console.error)
    console.log("Local list");
  })

  app.get('/list/upload/:index', (req,res) => {
    var index = req.params.index;
    const createTree = (path = ".", index) =>
        parse(tokenise(path), index, false)

    createTree("./dcm/upload/", index)
      .then(r => {
                    r[`MaxIndex`] = lenUpload;
                    res.send(JSON.stringify(r, null, 2))
                  })
      .catch(console.error)
    console.log("Upload listed");
  })

  app.get('/dcm/*', function(req, res){

    var id = req.originalUrl;
    if (!id.includes('local') && !id.includes('upload')){
      id = id.replace('/dcm','/dcm/local')  // url that pass this path sometime miss local directory 
                                            // this is filter before load img 
    }
    console.log(id);
    id = decodeURI(id)
    try{
        const file = `.${id}`;
        res.download(file);
        console.log("load", file);
    }
    catch(e){
      res.status(500).send(e)
    }

  });

  app.listen(8080, () => {
    console.log('server start at port 8080')
  })
}
start()
