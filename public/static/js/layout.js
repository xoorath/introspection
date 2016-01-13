$(document).ready(function(){
  
  var light = ['#EDF393', '#F5E665', '#FFC472', '#FFA891', '#89BABE']
  var dark = ['#dee937', '#e5cf0f', '#ff990c', '#ff572b', '#508c91'];
  
  for(var i = 0; i < 5; ++i) {
    var cat = '.cat'+i;
    var catln = '.cat'+i+'ln';
    var $cat = $(cat + ', ' + catln);

    $cat.data('inner', cat);
    $cat.data('over', dark[i]);
    $cat.data('off', light[i]);

    $cat.mouseover(function(){
      $($(this).data('inner')).css('background-color', $(this).data('over'));
    }).mouseleave(function(){
      $($(this).data('inner')).css('background-color', $(this).data('off'));
    });
  }
});