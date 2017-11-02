onReady(function(go) {
  console.log('ready..');
  go();
});

onProgress(function(percentage) {
  console.log('loading...', percentage);
});

onDone(function() {
  console.log('done.');
});
