// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// parent, args, callback
var flag=null
frappe.upload = {
	make: function(opts) {
		if(!opts.args) opts.args = {};
		var $upload = $('<div class="file-upload">\
			<p class="small"><a class="action-attach disabled" href="#"><i class="icon-upload"></i> '
				+ __('Upload a file') + '</a> | <a class="action-link" href="#"><i class="icon-link"></i> '
				 + __('Attach as web link') + '</a></p>\
			<div class="action-attach-input">\
				<input class="alert alert-info" style="padding: 7px; margin: 7px 0px;" \
					type="file" name="filedata" />\
			</div>\
			<div class="action-link-input" style="display: none; margin-top: 7px;">\
				<input class="form-control" style="max-width: 300px;" type="text" name="file_url" />\
				<p class="text-muted">'
					+ (opts.sample_url || 'e.g. http://example.com/somefile.png') +
				'</p>\
			</div>\
			<button class="btn btn-info btn-upload"><i class="icon-upload"></i> ' +__('Upload')
				+'</button>\
				<button class="btn btn-info  test"><i class="icon-upload"></i> ' +__('Crop')
        +'</button></div>').appendTo(opts.parent);


		$upload.find(".action-link").click(function() {
			$upload.find(".action-attach").removeClass("disabled");
			$upload.find(".action-link").addClass("disabled");
			$upload.find(".action-attach-input").toggle(false);
			$upload.find(".action-link-input").toggle(true);
			$upload.find(".btn-upload").html('<i class="icon-link"></i> ' +__('Set Link'))
			return false;
		})

		$upload.find(".action-attach").click(function() {
			$upload.find(".action-link").removeClass("disabled");
			$upload.find(".action-attach").addClass("disabled");
			$upload.find(".action-link-input").toggle(false);
			$upload.find(".action-attach-input").toggle(true);
			$upload.find(".btn-upload").html('<i class="icon-upload"></i> ' +__('Upload'))
			return false;
		})

		// get the first file
		$upload.find(".btn-upload").click(function() {
			// convert functions to values
			for(key in opts.args) {
				if(typeof val==="function")
					opt.args[key] = opts.args[key]();
			}

			// add other inputs in the div as arguments
			opts.args.params = {};
			$upload.find("input[name]").each(function() {
				var key = $(this).attr("name");
				var type = $(this).attr("type");
				if(key!="filedata" && key!="file_url") {
					if(type === "checkbox") {
						opts.args.params[key] = $(this).is(":checked");
					} else {
						opts.args.params[key] = $(this).val();
					}
				}
			})

			opts.args.file_url = $upload.find('[name="file_url"]').val();

			var fileobj = $upload.find(":file").get(0).files[0];
			frappe.upload.upload_file(fileobj, opts.args, opts,flag);
		})

	$upload.find(".test").click(function() {
      var me=this;
      $upload.find(".btn-upload").hide();
      // frappe.upload.button_upload(me,opts);
      console.log("on the test")
            for(key in opts.args) {
            if(typeof val==="function")
              opt.args[key] = opts.args[key]();
          }

          // add other inputs in the div as arguments
          opts.args.params = {};
          $upload.find("input[name]").each(function() {
            var key = $(this).attr("name");
            var type = $(this).attr("type");
            if(key!="filedata" && key!="file_url") {
              if(type === "checkbox") {
                opts.args.params[key] = $(this).is(":checked");
              } else {
                opts.args.params[key] = $(this).val();
              }
            }
          })

          opts.args.file_url = $upload.find('[name="file_url"]').val();
          console.log(opts.args.params[key]);
          var fileobj = $upload.find(":file").get(0).files[0];
          frappe.upload.upload_file(fileobj, opts.args, opts,true);
      })	


	},

	upload_file: function(fileobj, args, opts,flag) {
		if(!fileobj && !args.file_url) {
			msgprint(__("Please attach a file or set a URL"));
			return;
		}
		console.log([fileobj, args, opts])
		var dataurl = null;
		var _upload_file = function() {
			if(opts.on_attach) {
				opts.on_attach(args, dataurl)
			} else {
				var msgbox = msgprint(__("Uploading..."));
				return frappe.call({
					"method": "uploadfile",
					args: args,
					callback: function(r) {
						if(!r._server_messages)
							msgbox.hide();
						if(r.exc) {
							// if no onerror, assume callback will handle errors
							opts.onerror ? opts.onerror(r) : opts.callback(null, null, r);
							return;
						}
						var attachment = r.message;
						opts.callback(attachment, r);
						$(document).trigger("upload_complete", attachment);
					}
				});
			}
		}

		if(args.file_url) {
			_upload_file();
		} else {
			var freader = new FileReader();
			freader.onload = function() {
				args.filename = fileobj.name;
				  if(flag){ 
		        if ((/\.(gif|jpg|jpeg|tiff|png)$/i).test(args.filename) ){
		            dataurl =freader.result;
		            var c = new frappe.Cropper(opts.parent,dataurl,args,opts);
		           }
		           else{
		            msgprint(__("Not Image file,Please Select Valid " ));
		           }
		          }
		        else{
		            dataurl = freader.result;
		          args.filedata = freader.result.split(",")[1];
		          _upload_file();
        }
				// if((opts.max_width || opts.max_height) && (/\.(gif|jpg|jpeg|tiff|png)$/i).test(args.filename)) {
				// 	frappe.utils.resize_image(freader, function(_dataurl) {
				// 		dataurl = _dataurl;
				// 		args.filedata = _dataurl.split(",")[1];
				// 		console.log("resized!")
				// 		_upload_file();
				// 	})
				// } else {
				// 	dataurl = freader.result;
				// 	args.filedata = freader.result.split(",")[1];
				// 	_upload_file();
				// }
			};

			freader.readAsDataURL(fileobj);
		}
	}
}



frappe.Cropper = Class.extend({
  init: function(wrapper,imgdata,args,opts) {
    console.log("hello in cropper");
    this.show_menus(wrapper,imgdata);
    this.show_functions(args,opts,imgdata);
    },
      show_menus: function(wrapper,imgdata) {
        $("#imagecropper").remove();
        $(repl('<div class="container-fluid eg-container" id="imagecropper">\
    <div class="row eg-main">\
      <div class="col-xs-9 col-sm-6">\
        <div class="eg-wrapper">\
          </div>\
      </div>\
      <div class="col-xs-12 col-sm-5">\
      <div class="row eg-output">\
        <div class="col-md-6"><br>\
          <div id="showDataURL" height="50%" width ="60%"></div><br>\
        </div>\
        <div class="col-md-6"><br>\
          <textarea class="form-control" id="dataURL" rows="6"></textarea><br>\
        </div>\
      </div>\
      </div>\
    </div>\
    <div class="clearfix">\
      <div class="eg-button">\
        <button class="btn btn-primary" id="getDataURL" type="button">Cropping Done</button>\
        <button class="btn btn-primary" id="uploadURL" type="button">Upload</button>\
        <button id="rotateLeft" type="button" class="btn btn-info">Rotate Left</button>\
        <button id="rotateRight" type="button" class="btn btn-info">Rotate Right</button>\
      </div>\
      </div>\
    </div>\
  </div>'),{url:imgdata}).appendTo($(wrapper));
    $("#dataURL").hide();
  $("<img class='cropper' ,height=150% width=100%/>").attr("src", imgdata).appendTo($(wrapper).find('.eg-wrapper'));
    },

     show_functions: function(args,opts,imgdata) {
    var me = this;
    $(function() {
      var $image = $(".cropper"),
          $dataX = $("#dataX"),
          $dataY = $("#dataY"),
          $dataHeight = $("#dataHeight"),
          $dataWidth = $("#dataWidth"),
          console = window.console || {log:$.noop},
          cropper;

      $image.cropper({
        aspectRatio: 16 / 9,
        data: {
          x: 420,
          y: 50,
          width: 640,
          height: 360
        },
        preview: ".preview",

        // autoCrop: false,
        // dragCrop: false,
        // modal: false,
        // moveable: false,
        // resizeable: false,
        // scalable: false,

        // maxWidth: 480,
        // maxHeight: 270,
        // minWidth: 160,
        // minHeight: 90,

        done: function(data) {
          $dataX.val(data.x);
          $dataY.val(data.y);
          $dataHeight.val(data.height);
          $dataWidth.val(data.width);
        },
        build: function(e) {
          // console.log(e.type);
        },
        built: function(e) {
          // console.log(e.type);
        },
        dragstart: function(e) {
          // console.log(e.type);
        },
        dragmove: function(e) {
          // console.log(e.type);
        },
        dragend: function(e) {
          // console.log(e.type);
        }
      });

      me.cropper = $image.data("cropper");

      $image.on({
        "build.cropper": function(e) {
          console.log(e.type);
          // e.preventDefault();
        },
        "built.cropper": function(e) {
          console.log(e.type);
          // e.preventDefault();
        },
        "dragstart.cropper": function(e) {
          console.log(e.type);
          // e.preventDefault();
        },
        "dragmove.cropper": function(e) {
          console.log(e.type);
          // e.preventDefault();
        },
        "dragend.cropper": function(e) {
          console.log(e.type);
          // e.preventDefault();
        }
      });

   

      $("#rotate").click(function() {
        $image.cropper("rotate", $("#rotateWith").val());
      });

      $("#rotateLeft").click(function() {
        $image.cropper("rotate", -90);
      });

      $("#rotateRight").click(function() {
        $image.cropper("rotate", 90);
      });

      $("#getImageData").click(function() {
        $("#showImageData").val(JSON.stringify($image.cropper("getImageData")));
      });

      $("#setData").click(function() {
        $(this).image.cropper("setData", {
          x: $dataX.val(),
          y: $dataY.val(),
          width: $dataWidth.val(),
          height: $dataHeight.val()
        });
      });

      $("#getData").click(function() {
        var url=$image.cropper("getData")
        console.log("URi")
        console.log(url)
        $("#showData").val(JSON.stringify($image.cropper("getData")));
      });

      $("#getDataURL").click(function() {
        var dataURL = $image.cropper("getDataURL");
        console.log($("#dataURL"));
        //window.open(dataURL);
        $("#dataURL").text(dataURL);
        $("#showDataURL").html('<img src="' + dataURL + '" height="180%" width="180%">');
      });

      $("#getDataURL2").click(function() {
        //alert("#getDataURL2");
        var dataURL = $image.cropper("getDataURL", "image/jpeg");

        $("#dataURL").text(dataURL);
        window.open(dataURL);
        $("#showDataURL").html('<img src="' + dataURL + '" height="50%" width="50%">');
      });

      $("#uploadURL").click(function() {
        var dataURL2 =$("#dataURL").val();
        var dataurl=dataURL2
        me.upload_img(args,dataurl,opts,imgdata)
           
      });
    });   

   }, 

   upload_img:function(args,dataurl,opts,imgdata){
    // console.log("in the upload_img")
        // var _upload_file = function() {
          // var opts=opts
          console.log("on the upload2")
          console.log(opts)
          console.log(args)
          console.log(dataurl)
          if (!dataurl){
            dataurl=imgdata
          }
          console.log(dataurl)
          args.filedata = dataurl.split(",")[1];
          if(opts.on_attach) {
            opts.on_attach(args, dataurl)
            console.log(args)
          } else {
            var msgbox = msgprint(__("Uploading..."));
            return frappe.call({
              "method": "uploadfile",
              args: args,
              callback: function(r) {
                if(!r._server_messages)
                  msgbox.hide();
                if(r.exc) {
                  // if no onerror, assume callback will handle errors
                  opts.onerror ? opts.onerror(r) : opts.callback(null, null, r);
                  return;
                }
                var attachment = r.message;
                opts.callback(attachment, r);
                $(document).trigger("upload_complete", attachment);
                console.log("done")
              }
            });
          }
        // }
   }
});






