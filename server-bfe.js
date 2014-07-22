/*
   Minimal BIBFRAME Editor Node.js server. To run from the command-line:
   node server-bfe.js
   
*/
var port = 8000;
var config = require('./config.json');
var connect = require('connect');
var http = require('http');
var net = require('net');
var serveStatic = require('serve-static');
var url = require('url');
var util = require('util');

var app = connect();
app.use(serveStatic('.', { 'index': ['index.html', 'index.htm']}))
app.use('/fedora', function(req, res) {
 var json_ld = '';
 if(req.method == 'POST') {
   req.on('data', function(chunk) {
     json_ld += chunk.toString();
   });
   req.on('end', function() {
     var bf_graph = JSON.parse(json_ld);
     var bf_decomposed_types = [];
     for(i in bf_graph[0]['@type']) {
       var gType = bf_graph[0]['@type'][i];
       bf_decomposed_types.push(gType['@id']);
     }
     bf_graph[0]['@type'] = bf_decomposed_types;
     console.log();
     var bf_id = url.parse(bf_graph[0]['@id']);
     var add_request = http.request(
       { hostname: config.fedora.host,
         port: config.fedora.port,
         path: bf_id.path,
         method: 'PUT'},
       function(fedora_response) {
         console.log('STATUS ' + fedora_response.statusCode);
       });
     add_request.setHeader('Content-Type', 'application/ld+json');
     add_request.on('error', function(e) {
       console.log("problem with request: " + e.message);
     });
     add_request.write(JSON.stringify(bf_graph));
     add_request.end();
   });
 };
 res.end('Connected to node.js\n');  
});
connect.createServer(app).listen(port)
util.puts('BIBFRAME Editor running on ' + port);
util.puts('Press Ctrl + C to stop.');
