/*
 * drag - drop to upload file
 * by hongru.chenhr[at]gmail.com 
 * at 2011.04.21
 */
 
(function () {
	// private methods
	var _ = {
		extend: function (target, source, overwrite) {
			if (overwrite == undefined) overwrite = true;
			for (var p in source) {
				if (!(p in target) || overwrite) {
					target[p] = source[p]
				}
			}
			return target;
		},
		log: function (msg, cat) {
			!!window.console && console[(cat ? cat : 'debug')](msg);
		},
		addEvent: function (o, e, f) {
			o.addEventListener ? o.addEventListener(e, f, false) : o.attachEvent('on'+e, function () {f.call(o)});
		}
	}
	
	// main function
	var DDUpload = function (config) {
		this.setConfig(config);
		this.init();
	}
	_.extend(DDUpload.prototype, {
		setConfig: function (config) {
			this.config = {
				name: 'yourFileName',
				action: 'yourAction',
				target: window,
				
				onloadstart: function () {},
				onprogress: function (e) {},
				oncomplete: function (response) {}
			}
			_.extend(this.config, config || {});
		},
		init: function () {
			var c = this.config, _this = this;
			// prevent default of dragenter and dragover
			_.addEvent(window, 'dragenter', this.preventDefault);
			_.addEvent(window, 'dragover', this.preventDefault);
			
			if (!!window.google && google.gears) {
				/* google.gears
				 * http://code.google.com/intl/zh-CN/apis/gears/api_httprequest.html
				 */ 
				this.xhr = google.gears.factory.create('beta.httprequest');
				_.addEvent(c.target, 'drop', function (e) {
					_this.googleGears(e);
				})
			} else if (!!XMLHttpRequest && !!new XMLHttpRequest().sendAsBinary) {
				// html5 XMLHttpRequest
				this.xhr = window.ActiveXObject ? new window.ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
				_.addEvent(c.target, 'drop', function (e) {
					_this.html5Binary(e);
				})
			}
		},
		preventDefault: function (e) {
			e = e || window.event;
			
			if (e && e.stopPropagation) e.stopPropagation();
			else e.cancelBubble = true;
			
			if (e && e.preventDefault) e.preventDefault();
			else e.returnValue = false;
		},
		googleGears: function (e) {
			this.preventDefault(e);
			var _this = this;
			try {
				var desktop = google.gears.factory.create('beta.desktop'),
					data = desktop.getDragData(e, 'application/x-gears-files'),
					file = data.files[0];

				var d = this.googleBuild(file);
				
				this.xhr.onloadstart = this.config.onloadstart;
				this.xhr.upload.onprogress = this.config.onprogress;
				this.xhr.onreadystatechange = function () {
					if (_this.xhr.readyState === 4) {
						_this.config.oncomplete.call(_this, _this.xhr.responseText);
					}
				}
				
				this.xhr.open("POST", this.config.action);
				this.xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + d.boundary);
				this.xhr.send(d.builder.getAsBlob());
				//this.xhr.onloadstart(file);
				
			} catch(e) {
				
			}
		},
		googleBuild: function (file) {

			var boundary = '--multipartformboundary' + (+new Date),
				dashdash = '--',
				crlf     = '\n';
			
			var builder = google.gears.factory.create('beta.blobbuilder');
		
			builder.append(dashdash);
			builder.append(boundary);
			builder.append(crlf);
			
			builder.append('Content-Disposition: form-data; name="'+ this.config.name +'"');
			if (file.name) {
				builder.append('; filename="' + file.name + '"');
			}
			builder.append(crlf);
			
			builder.append('Content-Type: application/octet-stream');
			builder.append(crlf);
			builder.append(crlf); 
			
			/* Append binary data. */
			builder.append(file.blob);
			builder.append(crlf);
	
			/* Write boundary. */
			builder.append(dashdash);
			builder.append(boundary);
			builder.append(crlf); 
			
			/* Mark end of the request. */
			builder.append(dashdash);
			builder.append(boundary);
			builder.append(dashdash);
			builder.append(crlf);
			
			return {
				builder: builder,
				boundary: boundary
			}
		},
		
		/* ====== for html5Binary ======= */
		html5Binary: function (e) {
			var _this = this;
			if (e.dataTransfer.files.length == 0) return;
			
			this.preventDefault(e);
			var file = e.dataTransfer.files[0];
			
			var b = this.binaryBuild(file.name, file.getAsBinary());
			
			this.xhr.onloadstart = this.config.onloadstart;
			this.xhr.onuploadprogress = this.config.onprogress;
			this.xhr.onreadystatechange = function () {
				if (_this.xhr.readyState === 4) {
					_this.config.oncomplete.call(_this, _this.xhr.responseText);
				}
			}
			
			this.xhr.open('POST', this.config.action, true);
			this.xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + b.boundary);
			this.xhr.setRequestHeader('Content-Length', file.size); 
			this.xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');		//read.readAsDataURL(file);
			this.xhr.sendAsBinary(b.builder);
		},
		binaryBuild: function (name, binary) {
			var boundary = '--fileupload'+(+new Date),
				dashdash = '--',
				crlf = '\n';
				
			var builder = '';
		 
			builder += dashdash;
			builder += boundary;
			builder += crlf;
			
			/* httprequest header */
			builder += 'Content-Disposition: form-data; name="'+ this.config.name +'"';
			if (name) {
			  builder += '; filename="' + encodeURIComponent(name) + '"';
			}
			builder += crlf;
		 
			builder += 'Content-Type: application/octet-stream';
			builder += crlf;
			builder += crlf; 
			
			/* build Binary data */
			builder += binary;
			builder += crlf;
			
			/* Write boundary. */
			builder += dashdash;
			builder += boundary;
			builder += crlf;
			
			/* Mark end of the request. */
			builder += dashdash;
			builder += boundary;
			builder += dashdash;
			builder += crlf;
			
			return {
				builder: builder,
				boundary: boundary
			}
		}
	})
	
	this.DDUpload = DDUpload;
	
})();