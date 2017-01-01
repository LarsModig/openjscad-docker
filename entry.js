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


function checkFile(file) {
  if (isSuportedInput(file)) {
    const inName = inputPath + file;
    const newName = file.split('.')[0] + '.jscad';
    const outName = outputPath + newName;
    console.log(`${file} CONVERTING to ${newName}`);
    convertFile(inName,outName);
  } else {
    console.log(`${file} skipped`);
  }
}

function convertFile(inPath, outPath) {
  const options = { cwd: openjscadPath };
  const p = spawn('node', ['openjscad', inPath, '-o', outPath], options);
  
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
    if (!success) {
      console.error(`Converting failed on ${inPath}. Output:`);
      console.error(stdout);
    }
  });
}

function isSuportedInput(filename) {
  const filetype = filename.split('.')[1];
  const supportedTypes = ['svg'];
  return supportedTypes.includes(filetype);
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
