$(document).ready(function(){

	var UpdatePreview = function(){
		var $content = $('#content');
		var content = $content.val();
		console.log(content);
		if(content != null && content != '') {
			var converter = new Markdown.Converter();
			$('#postpreview').html(converter.makeHtml( content ));	
		}
	}

	$('#preview').click(function(e){
		UpdatePreview();
	});

	UpdatePreview();
});