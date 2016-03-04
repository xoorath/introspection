$(document).ready(function(){

	var UpdatePreview = function(){
		var content = $('#content').val();
		var title = $('#title').val();
		var subtitle = $('#subtitle').val();
		var imgmain = $('#imgmain').val();
		var darkband = $('#darkband').val();


		var converter = new Markdown.Converter();
		var bodycontent = converter.makeHtml( content );

		var $rowpost = $('div.row.post');
		var $title = $('h2.color-glitch-solid');
		$title.text(title);
		if(subtitle && subtitle != null) {
			var $subtitle = $('subtitle');
			$subtitle.text(subtitle);
			$title.append($subtitle);
		}

		$rowpost.append($title);
		var $preview = $('#postpreview');

		$preview.empty(); // destroy existing preview
		$preview.append($rowpost);

/*
    div.row.post
      h2.color-glitch-solid #{title}
      if subtitle
        subtitle #{subtitle}
      div.row
        if imgMain && typeof imgMain !== 'string'
          div.col-sm-6.no-col-pad
            block textMain
          div.col-sm-6
            img(src=imgMain.img).img-post-big.img-responsive
            p.description #[a(href=imgMain.link) #{imgMain.txt}]
        else
          div.col-sm-12.text
            block textMain
        div.emblock-1
      if darkband && typeof darkband !== 'string'
        div.row.darkband
          for drkimg in darkband.images
            div(class=darkband.size)
              img(src=drkimg.img).img-post.img-responsive
              p.description #[a(href=drkimg.link) #{drkimg.txt}]
*/
	}

	$('#preview').click(function(e){
		UpdatePreview();
	});

	UpdatePreview();
});