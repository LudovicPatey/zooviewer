
var Legend = {

    init : function() {},
    
    // Create the legend panel
    // Call it once per database
    create : function() {
        var urlData = Tools.getUrlData();
        var edgeNode  = $('#edge_function select');
        edgeNode.empty();
        for(var i=0; i<Zoo.meta.edgeKinds.length; i++) {
            edgeNode.append('<option value="' + i + '">' + Zoo.meta.edgeKinds[i].label + '</option>');
        }
        if(typeof urlData.edgeKind != 'undefined') {
            edgeNode.val(urlData.edgeKind);
            Zoo.meta.selectedEdgeKind = urlData.edgeKind;
        }
        
        var coloringNode = $('#coloring_function select');
        coloringNode.removeAttr('disabled');
        coloringNode.empty();
        for(var i=0; i<Zoo.meta.colorings.length-1; i++) {
            coloringNode.append('<option value="' + i + '">' + Zoo.meta.colorings[i].label + '</option>');
        }
        if(typeof urlData.coloring != 'undefined') {
            coloringNode.val(urlData.coloring);
            Zoo.meta.selectedColoring = urlData.coloring;
        }
        
        this.updateColoringLegend();
    },
    
    changeEdgeKind: function(key) {
        key = parseInt(key);
        Zoo.meta.selectedEdgeKind = key;
        Tools.updateUrlData({ edgeKind : key });
        Zoo.newGraph({
            select : {
                keepSelection: true
            }
        });
    },
        
    changeColoring: function(key) {
        key = parseInt(key);
        Zoo.meta.selectedColoring = key;
        this.updateColoringLegend();
        if(!Select.hasSelectedNodes()) {
            Tools.updateUrlData({ coloring : key });
        }
        Graph.setColoring(Zoo.meta.colorings[Zoo.meta.selectedColoring].coloring);
    },
        
    updateColoringLegend: function() {
        var ul = $('#coloring_function + ul');
        var coloring = Zoo.meta.colorings[Zoo.meta.selectedColoring];
        ul.empty();
        for(var i=0; i<coloring.colors.length; i++) {
            var background = coloring.colors[i].color;
            if(background.indexOf(':') != -1) {
                var c = background.split(':');
                background = 'repeating-linear-gradient(125deg,' + c[0] + ',' + c[0] + ' 2px,' + c[1] + ' 2px,' + c[1] + ' 4px);';
            }
            ul.append('<li><label><div class="node" style="background: ' + background + '">&nbsp;</div> ' + coloring.colors[i].label + '</label>');
        }
    }
    
};
