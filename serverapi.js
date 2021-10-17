const express = require("express")
const app = express()
const fs = require('fs');
const TestLocalFolder = './dcm/local/test';
const TrainLocalFolder = './dcm/local/train';
const UploadFolder = './dcm/upload/';
const CsvFolder = './csv';
const cors = require("cors");
const { parse } = require("path");
const corsOptions ={ origin:'*', credentials:true, }
var lenTestLocal;
var lenUpload;
var lenCsv;
var lenTrainLocal;

make_dir = async(pathname, StartIndex, EndIndex) => { //make nested object directory

  var key = await new Promise((resolve, reject) => {
      fs.readdir(pathname, (err, files) => {
          resolve(files)
      })
      
  })
  var len = key.length
  var begin = 0;
  var tmp_arr = [];
  if(EndIndex !== null){
    len = EndIndex
  }
  if(StartIndex !== null){
    begin = StartIndex;
  }

  for(let i=begin ;i<len;i++){

      if (!key[i].includes('.dcm') && !key[i].includes('.csv')){
          var obj = {};
          obj['title'] = key[i];

          if(obj[`children`] == null){
              obj[`children`] = [];
          }
          var children = await make_dir(pathname + '/' + key[i], null, null) //call recursive in deeper path
          obj[`children`] = children // set result of recursive to children
          tmp_arr.push(obj) // push those children to tmp_arr (prepare to return)
          if(i==key.length-1){
              return tmp_arr
          }
      }
      else{
          var obj = {};
          pathname = pathname.replace('.', '')
          obj[`title`] = key[i];
          obj[`path`] = pathname + '/' + key[i];

          tmp_arr.push(obj);
      }
  }
  return tmp_arr
} 

fs.readdir(TestLocalFolder, (err, files) => {
  lenTestLocal = files.length;
})

fs.readdir(TrainLocalFolder, (err, files) => {
  lenTrainLocal = files.length;
})

fs.readdir(UploadFolder, (err, files) => {
  lenUpload = files.length;
})

fs.readdir(CsvFolder, (err, files) => {
  lenCsv = files.length;
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



  app.get('/list/csv/:StartIndex/:EndIndex', (req,res) => {
    var StartIndex = parseInt(req.params.StartIndex) ;
    var EndIndex =parseInt(req.params.EndIndex) ;
    
    if(EndIndex > lenCsv){
      EndIndex = lenCsv;
    }
    make_dir(`./csv`, StartIndex, EndIndex).then((e)=> {
      var obj = {};
      obj[`files`] = e;
      obj[`MaxIndex`] = lenCsv
     
      res.send(obj)
    })
    console.log("Csv listed");
  })

  app.get('/list/upload/:StartIndex/:EndIndex', (req,res) => {
    var StartIndex = parseInt(req.params.StartIndex) ;
    var EndIndex =parseInt(req.params.EndIndex) ;
    if(EndIndex > lenUpload){
      EndIndex = lenUpload;
    }

    make_dir(`./dcm/upload`, StartIndex, EndIndex).then((e)=> {
      var obj = {};
      obj[`files`] = e;
      obj[`MaxIndex`] = lenUpload
     
      res.send(obj)
    })
    console.log("Upload listed");
  })

  app.get('/dcm/*', function(req, res){

    var id = req.originalUrl;
    if (!id.includes('local') && !id.includes('upload')){
      id = id.replace('/dcm','/dcm/local')  // url that pass this path sometime miss local directory 
                                            // this is filter before load img 
    }
    id = decodeURI(id)
    try{
        const file = `.${id}`;
        res.download(file);
        console.log("loaded", file);
    }
    catch(e){
      res.status(500).send(e)
    }

  });

  app.get('/csv/*', function(req, res){

    try{
        var id = req.originalUrl;

        const file = `.${id}`;
        res.download(file);
        console.log("load", file);
    }
    catch(e){
      res.status(500).send(e)
    }

  });

  app.get('/list/local/:dir/:StartIndex/:EndIndex', (req, res) => {
    var dir = req.params.dir;
    var StartIndex = parseInt(req.params.StartIndex) ;
    var EndIndex =parseInt(req.params.EndIndex) ;

    make_dir(`./dcm/local/${dir}`, StartIndex, EndIndex).then((e)=> {
      var obj = {};
      obj[`files`] = e;
      if(dir === 'test'){
        obj[`MaxIndex`] = lenTestLocal
      }
      else if (dir === 'train'){
        obj[`MaxIndex`] = lenTrainLocal
      }
      res.send(obj)
    })
  })
  app.listen(8080, () => {
    console.log('server start at port 8080')
  })
}
start()
