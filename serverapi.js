const express = require("express")
const app = express()
const fs = require('fs');
const LocalFolder = 'C:/Users/VAHAH/Desktop/inuse/dcmFile/local/';
const UploadFolder = 'C:/Users/VAHAH/Desktop/inuse/dcmFile/upload/';
var localFilelist = [];
var uploadFilelist = [];
const cors = require("cors");
const corsOptions ={ origin:'*', credentials:true, }

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

    fs.writeFile(`C:/Users/VAHAH/Desktop/inuse/dcmFile/upload/${len}.dcm`, base64Image, {encoding: 'base64'}, function(err) {
      console.log(`${len}.dcm created `);
    });
    uploadFilelist.push(`${len}.dcm`)
  })


  app.get('/list/local', (req,res) => {
    localFilelist = [];
    fs.readdir(LocalFolder, (err, files) => {
      files.forEach(file => {
        localFilelist.push(file);
      });
      var dcmlist = {"file": localFilelist}
      res.send(dcmlist);
    });
    
    console.log("Local list");
  })

  app.get('/list/upload', (req,res) => {
    uploadFilelist = [];
    fs.readdir(UploadFolder, (err, files) => {
      files.forEach(file => {
        uploadFilelist.push(file);
      });
      var dcmlist = {"file": uploadFilelist}
      res.send(dcmlist);
    });
    
    console.log("Upload listed");
  })

  app.get('/dcm/:folder/:id', function(req, res){
    var id = req.params.id;
    var folder = req.params.folder;
    try{
        const file = `C:/Users/VAHAH/Desktop/inuse/dcmFile/${folder}/${id}`;
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
