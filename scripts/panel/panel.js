
var Panel = {

    // Initizalize the panel once for all
    init : function() {
        
        // Set the selected zoo in function of the URL
        var data = Tools.getUrlData();
        if(data.zoo) {
            $('#zoo select').val(data.zoo);
        }
        $('#zoo select').trigger('change');
        
        // Make the panel parts collapsible
        $('#panel').accordion({
          active : 3, // By default, the contextual panel will be active
          collapsible : true,
          header: 'legend',
          heightStyle: 'content'
        });
        
        Filter.init();
        Contextual.init();
        Diffs.init();
        Legend.init();
    },
    
    // Call this once per database
    create : function() {
        Filter.create();
        Contextual.create();
        Diffs.create();
        Legend.create();
        this.createZooPanel();
    },
    
    createZooPanel : function() {
        var about = Zoo.meta.about || {};
        var div = $('#zoo > div');
        div.find('.about').remove();
        if(about.description) {
            div.append('<h3 class="about">About</h3>');
            div.append('<p class="about">' + about.description + '</p>');
        }
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, div.find('p').get(0)]);
    },
    
    disable: function() {
        $('#block').show();
        
    },
        
    enable: function() {
        $('#block').hide();
    }
};
