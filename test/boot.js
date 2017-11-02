onReady(function(go) {
  console.log('ready..');
  go();
});

onProgress(function(percentage, resource) {
  console.log('loading...', percentage, resource);
});

onDone(function() {
  console.log('done.');
});
