$(document).ready(function(){
	
	var light = ['#EDF393', '#F5E665', '#FFC472', '#FFA891', '#89BABE']
	var dark = ['#dee937', '#e5cf0f', '#ff990c', '#ff572b', '#508c91'];
	
	$('.cat0, .cat0ln').mouseover(function(){
		$('.cat0').css('background-color', dark[0]);
	}).mouseleave(function(){
		$('.cat0').css('background-color', light[0]);
	});

	$('.cat1, .cat1ln').mouseover(function(){
		$('.cat1').css('background-color', dark[1]);
	}).mouseleave(function(){
		$('.cat1').css('background-color', light[1]);
	});

	$('.cat2, .cat2ln').mouseover(function(){
		$('.cat2').css('background-color', dark[2]);
	}).mouseleave(function(){
		$('.cat2').css('background-color', light[2]);
	});

	$('.cat3, .cat3ln').mouseover(function(){
		$('.cat3').css('background-color', dark[3]);
	}).mouseleave(function(){
		$('.cat3').css('background-color', light[3]);
	});

	$('.cat4, .cat4ln').mouseover(function(){
		$('.cat4').css('background-color', dark[4]);
	}).mouseleave(function(){
		$('.cat4').css('background-color', light[4]);
	});
});