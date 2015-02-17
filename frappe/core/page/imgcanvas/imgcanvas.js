frappe.pages['imgcanvas'].onload = function(wrapper) {
  frappe.ui.make_app_page({
    parent: wrapper,
    title: 'Image Canvas',
    single_column: false
  });
$('<div id="main-body"><div id="wPaint" align="center" style="position:relative; width:500px; height:500px; background-color:#99CCFF; margin:50px;">\
  </div></div>\
      <center id="wPaint-img"></center>').appendTo($(wrapper).find('.layout-main-section'));
work_order = frappe.route_options.work_order
WorkOrderCanvas = new frappe.Canvas(wrapper, work_order); 
};

frappe.pages['imgcanvas'].refresh = function(wrapper) {
  WorkOrderCanvas.set_from_route();
}

frappe.Canvas = Class.extend({
  init: function(wrapper, woname) {
    this.wrapper = wrapper;
    this.woname = woname
    this.body = $(this.wrapper).find(".user-settings");
    this.make_canvas(),
    this.autoScroll()

    },
    set_from_route: function() {
        var me = this;
        if(frappe.get_route()[1]) {
          woname = frappe.get_route()[1];
          args = '';
        } else if(frappe.route_options) {
          if(frappe.route_options.work_order) {
            woname = frappe.route_options.work_order;
          }
        }
        new frappe.Canvas(me.wrapper, woname);
  },
  make_canvas:function(){
    var images =[]
    var me = this;
    if(me.woname){
          frappe.call({
          "method": "frappe.core.page.imgcanvas.imgcanvas.get_img",
          args: {
            work_order: me.woname
          },
          callback: function(r) {  
            if(r.message){
              for(var x in r.message.img_list)
              {
                  images.push(r.message.img_list[x])
              }   
              $(me.wrapper).find('#wPaint').wPaint({
                  menuOrientation: 'horizontal',
                  menuOffsetLeft: -2,
                  menuOffsetTop: -46,
                  width:579,
                  saveImg: saveImg,
                  loadImgBg: loadImgBg,
                  imageStretch: true,
                  loadImgFg: loadImgFg
              });
              $('.wPaint-menu').css('width','579px')
              $('.wPaint-menu-holder').css('background-color','rgb(229, 247, 246)')
            }
          
          }
        });
  }
    
            function saveImg(image) 
            {                  
                frappe.call({
                  "method": "frappe.core.page.imgcanvas.imgcanvas.save_img",
                  args: {
                    content:image,
                    work_order : frappe.route_options.work_order
                  },
                  callback: function(r) {
                    msgprint(__("File Saved."))
                    frappe.route_options = { number:1}
                    window.history.back();
                  }
                });
     
            }

              function loadImgBg () {
                this._showFileModal('bg', images);
              }

              function loadImgFg () {              
                this._showFileModal('fg', images);
              }
    },
    autoScroll: function(){
      var me = this;
      $(me.wrapper).find("#main-body").hover(function(){
          $(this).css('overflow','auto')
            }, function(){
              $(this).css('overflow','hidden')
      })
    }
  });