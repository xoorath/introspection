var wiki = {
	Setup:function(setupargs) {
		this.db = setupargs.db || require('./db.js');
		this.route = setupargs.route || require('./route.js');
		this.authenticate = setupargs.authenticate || require('./authenticate.js');
		
		this.wikiModel = this.db.GetWikiModel();
		this.GetStyles(); // will set this.styles
	},
	GetStyles: function() {
		var styles = this.styles;
		if(styles == undefined) {
			styles = {
				Default: 'Default'
			};
		}
		return styles;
	},
	/*
		wiki.Update('work/snowedin', {
			author:'Jared Thomson',
			title:'Snowed In Studios',
			subtitle:'Senior Software Engineer',
			content:'some string of markdown.',
			style: 'Default',
			date: '2015-01-23'
		});

	*/
	Update: function(path, data) {
		/*
		The data to fill: (See db.js)
			path: String,
			title: String,
			subtitle: String,
			content: String,
			style: String,
			author: String,
			date: String
		*/
		var req = data.req;
		var author = data.author || ((req && req.user) ? req.user.displayName : 'Anonymous');
		var title = data.title || path;
		var subtitle = data.subtitle || '';
		var imgmain = data.imgmain || '';
		var darkband = data.darkband || '';
		var back = data.back || null;
		var content = data.content;
		var style = data.style || this.GetStyles().Default;
		var date = data.date || new Date().toJSON().slice(0,10);

		var fail = function(err) {
			if(data && data.failure) {
				data.failure(err);
			}
		}

		var succeed = function() {
			if(data && data.success) {
				data.success();
			}
		}

		var TryRequiredParam = function(param) {
			if(param == null || param == '')
				return false;
			return true;
		}

		switch(style) {
			default:
			case this.GetStyles().Default:
				if(!TryRequiredParam(author))
					return fail('author not set');
				if(!TryRequiredParam(title))
					return fail('title not set');
				if(!TryRequiredParam(content))
					return fail('content not set');
				if(!TryRequiredParam(date))
					return fail('date not set');

				var SetAndSave = function(post) {
					post.path = path;
					post.title = title;
					post.subtitle = subtitle;
					post.content = content;
					post.style = style;
					post.imgmain = imgmain;
					post.darkband = darkband;
					post.back = back;

					post.author = author;
					post.date = date;
					post.save(function(err) {
						if (err) {
							fail(err);
						} 
						else {
							succeed();
						}
					});
				}

				this.wikiModel.findOne({
				'path':path
				}, 
				function(err, post) {
					if(err) {
						return fail(err);
					}
					else if(post) {
						SetAndSave(post);
					}
					else {
						var post = new wiki.wikiModel();
						SetAndSave(post);
					}
				});

				
			break;
		}
	}
};
module.exports = wiki;