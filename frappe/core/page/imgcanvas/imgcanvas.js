frappe.pages['imgcanvas'].onload = function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Image Canvas',
		single_column: false
	});
$('<div id="wPaint" style="position:relative; width:500px; height:200px; background-color:#7a7a7a; margin:70px auto 20px auto;">\
  </div>\
   <center style="margin-bottom: 50px;">\
   <input type="button" value="toggle menu" onclick="console.log($("#wPaint").wPaint("menuOrientation")); $("#wPaint").wPaint("menuOrientation", $("#wPaint").wPaint("menuOrientation") ="vertical" );"/>\
         </center>\
      <center id="wPaint-img"></center>').appendTo($(wrapper).find('.layout-main-section'));

new frappe.Canvas(wrapper); 
};

frappe.Canvas = Class.extend({
  init: function(wrapper) {
    this.wrapper = wrapper;
    this.body = $(this.wrapper).find(".user-settings");
    this.make_canvas()
    },
  make_canvas:function(){
    var images =[]
    frappe.call({
          "method": "frappe.core.page.imgcanvas.imgcanvas.get_img",
          // args: {
          //   content:image
          //   },
          callback: function(r) {
            // console.log("r")
            // console.log(r.message)
            for(var x in r.message.img_list)
                {
                 images.push(r.message.img_list[x])
                }
          }
        });
    // var images = [
    //       'files/ls2.jpg','files/man.png'
    //     ];
              function saveImg(image) 
                {
                      console.log(image)
                       	frappe.call({
                          "method": "frappe.core.page.imgcanvas.imgcanvas.save_img",
                          args: {
                            content:image
                            },
                          callback: function(r) {
                            msgprint(__("File Saved."))
                          }
                        });
       
                    }

              function loadImgBg () {
                this._showFileModal('bg', images);
              }

              function loadImgFg () {
                // console.log(images)
                this._showFileModal('fg', images);
              }

        // init wPaint
        $('#wPaint').wPaint({
          menuOffsetLeft: -35,
          menuOffsetTop: -50,
          width:400,
          saveImg: saveImg,
          loadImgBg: loadImgBg,
          loadImgFg: loadImgFg
          });

       $('#wPaint').wPaint('menuOrientation','horizontal'); 


    },
  });