const fs = require('fs');
const spawn = require('child_process').spawn;
const http = require('http');
const HttpDispatcher = require('httpdispatcher');

const inputPath = process.env.INPUT_PATH || '/input/';
const outputPath = process.env.OUTPUT_PATH || '/output/';
const PORT = process.env.PORT || 4000;
const openjscadPath = '/openjscad/';
var dispatcher = new HttpDispatcher();

const files = fs.readdirSync(inputPath);

files.forEach(checkFile);

startWebserver();

startWatch();


function startWatch() {
  fs.watch(inputPath, {recursive: true}, function (eventType, filename) {
    if (eventType == "change") {
      console.log(filename + ' changed!');
      checkFile(filename);
    }
  });
  console.log("Starting watch of changes in directory. Press Ctrl-C to exit!");
}


function checkFile(fileString) {
  var file;
  if (file = getFileInfo(fileString)) {
    console.log(`${fileString} CONVERTING to ${file.outPath}`);
    convertFile(file);
  } else {
    console.log(`${fileString} skipped`);
  }
}

function getFileInfo(fileName) {
  const file = {
    name: fileName.split('.')[0],
    type: fileName.split('.')[1],
    inPath: inputPath + fileName,
    outPath: outputPath + fileName.split('.')[0] + '.jscad'
  };
  const supportedTypes = ['svg'];
  if( supportedTypes.includes(file.type) ) {
    return file;
  } else {
    return false;
  }
}
  
function convertFile(file) {
  const options = { cwd: openjscadPath };
  const p = spawn('node', ['openjscad', file.inPath, '-o', file.outPath], options);
  
  var success = false;
  var stdout = '';
  p.stdout.on('data', (data) => {
    var dataString = data.toString();
    stdout += dataString;
    if(dataString.match(/success/)) {
      success = true;
    }
  });
  p.stderr.on('data', (data) => {
    console.error(`convertFileError: ${data}`);
  });
  p.on('error', (err) => {
    console.log(err)
  });
  p.on('close', (code) => {
    if (success) {
      editJscadFile(file);
    } else {
      console.error(`Converting failed on ${file.inPath}. Output:`);
      console.error(stdout);
    }
  });
}

function editJscadFile(file) {
  fs.readFile(file.outPath, (err,data) => {
    if (err) {
      return console.log(err);
    }
    const dataString = data.toString();
    const result = dataString.replace(
      /function main\(params\)/, 
      `// Modified by openjscad-docker\n//\nfunction ${file.name}(params)`
    );
    fs.writeFile(file.outPath, result, (err) => {
       if (err) {
         return console.log(err);
       }
    });
  });
}


function startWebserver() {
  dispatcher.setStatic('');
  dispatcher.setStaticDirname(openjscadPath);
  var server = http.createServer(handleRequest);
  server.listen(PORT, function() {
    console.log("Server started on port " + PORT);
  });
}

function handleRequest(request, response){
  try {
    console.log(request.url);
    dispatcher.dispatch(request, response);
  } catch(err) {
    console.log(err);
  }
}
