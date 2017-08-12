
var Window = {
    
    open: function(options) {
        
        var content = $('<div></div>');
        content.append('<h3>' + options.title + '</h3>');
        content.append(options.content);
        $('#window').html(content).show();
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, content.get(0)]);
        this.show();
    },
    
    show : function() {
        Zoo.disablePanel();
        $('#window').show();
        $('#block').click(Window.hide);
    },
    
    hide: function() {
        $('#window').hide();
        $('#block').unbind('click', Window.hide);
        Zoo.enablePanel();
    },
    
};
