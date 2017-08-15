
var Select = {
    
    selectedNodes: null,
    options: null,
    
    coloring: {
        "label" : "Selection",
        "selection": true,
        "colors" : [
            { color: "yellow", label: "Selected nodes"},
            { color: "lightgreen", label: "Equivalent to selected"},
            { color: "tomato", label: "Implied by all the selected nodes"},
            { color: "cornflowerblue", label: "Implies all the selected nodes"},
            { color: "violet", label: "Compares to all the selected nodes"},
            { color: "lightgrey", label: "Other nodes"}
        ],
        "coloring" : null
    },
    
    create: function(options) {
        if(!options.keepSelection) {
            this.selectedNodes = {};
        }
        else {
            if(options.selection) {
                this.selectedNodes = {};
                for(var i=0; i<options.selection.length; i++) {
                    var key = options.selection[i];
                    this.selectedNodes[key] = Graph.nodes[key];
                }
            }
            for(var key in this.selectedNodes) {
                if(!Graph.nodes[key]) {
                    delete this.selectedNodes[key];
                }
            }
        }
        this.coloring.coloring = this.colorNode;
        this.options = $.extend({
            change: function() {}
        }, options);
        this.updateColoringFunction();
        
    },
    
    unselectAll: function() {
        this.selectedNodes = {};
        //Select.options.unselect.call(this);
        Select.updateColoringFunction();
    },
    
    unselect: function(data) {
        delete this.selectedNodes[data.key];
        //this.options.unselect.call(this);
        this.updateColoringFunction();
    },
    
    select: function(data) {
        this.selectedNodes[data.key] = data;
        //this.options.select.call(this, data);
        this.updateColoringFunction();
    },
    
    getSelectionList: function() {
        var sel = [];
        for(var key in this.selectedNodes) {
            sel.push(this.selectedNodes[key]);
        }
        return sel;
    },
    
    hasSelectedNodes: function() {
        for(var k in this.selectedNodes)
            return true;
        return false;
    },
        
    colorNode: function(node, context) {
        if(Select.selectedNodes[node.key]) {
            return 'yellow';
        }
        
        
        var belowAll = true;
        var aboveAll = true;
        var comparesAll = true;
        var compatibleBelowAll = true;
        var compatibleAboveAll = true;
        var compatibleComparesAll = true;
        
        for(var id in Select.selectedNodes) {
            if(!Graph.implications[id] || !Graph.implications[id][node.key]) {
                belowAll = false;
                break;
            }
        }
        for(var id in Select.selectedNodes) {
            if(!Graph.implications[node.key] || !Graph.implications[node.key][id]) {
                aboveAll = false;
                break;
            }
        }
        for(var id in Select.selectedNodes) {
            if((!Graph.implications[node.key] || !Graph.implications[node.key][id])
                 && (!Graph.implications[id] || !Graph.implications[id][node.key])) {
                comparesAll = false;
                break;
            }
        }
        for(var id in Select.selectedNodes) {
            if(Graph.nonImplications[id] && Graph.nonImplications[id][node.key]) {
                compatibleBelowAll = false;
                break;
            }
        }
        for(var id in Select.selectedNodes) {
            if(Graph.nonImplications[node.key] && Graph.nonImplications[node.key][id]) {
                compatibleAboveAll = false;
                break;
            }
        }
        for(var id in Select.selectedNodes) {
            if((Graph.nonImplications[node.key] && Graph.nonImplications[node.key][id])
               && (Graph.nonImplications[id] && Graph.nonImplications[id][node.key])) {
                compatibleComparesAll = false;
                break;
            }
        }
        if(aboveAll && belowAll) return 'lightgreen';
        if(belowAll) return 'tomato';
        if(aboveAll) return 'cornflowerblue';
        if(comparesAll) return 'violet';
        if(compatibleAboveAll && compatibleBelowAll) return 'lightgreen:lightgray';
        if(compatibleBelowAll) return 'tomato:lightgray';
        if(compatibleAboveAll) return 'cornflowerblue:lightgray';
        if(compatibleComparesAll) return 'violet:lightgray';
        return 'lightgray';
    },

        // If there are selected nodes, use a custom selection coloring function
        // Otherwise, revert to the previous coloring function
    updateColoringFunction: function() {
        var coloringNode = $('#coloring_function select');
        if(this.hasSelectedNodes()){
            if(!coloringNode.attr('disabled')) {
                var val = coloringNode.children().length;
                coloringNode.data('previousValue', coloringNode.val());
                coloringNode.append('<option value="' + val + '">' + this.coloring.label + '</option>');
                coloringNode.val(val);
                coloringNode.attr('disabled', 'disabled');
                coloringNode.trigger('change');
            }
        }
        else {
            if(coloringNode.attr('disabled')) {
                coloringNode.removeAttr('disabled', 'disabled');
                coloringNode.val(coloringNode.data('previousValue'));
                coloringNode.find('option:last').remove();
                coloringNode.trigger('change');
                
            }
        }
        
        // Save selection list to URL
        var urlData = Tools.getUrlData();
        var sels = [];
        for(var key in this.selectedNodes) {
            sels.push(key);
        }
        urlData.select = {
            keepSelection : true,
            selection : sels
        };
        Tools.setUrlData(urlData);
        
        this.options.change.call(this);
        Graph.colorNodes();
    },
    
    resetPanel: function() {
        var coloringNode = $('#coloring_function select');
    },
    
    processNode: function(node) {
        
        var ellipse = $('ellipse',node);
        
        // Define a visual effect on mouse over
        $(node).attr('style','cursor:hand');
        ellipse.attr('style', 'stroke-width:1;stroke:lightgray');
        $(node).hover(function(){
                      ellipse.attr('style','stroke-width:1;stroke:rgb(0,0,0)');
                      },function(){
                      ellipse.attr('style', 'stroke-width:1;stroke:lightgray');
                      });
        
        
        // Select or unselect
        $(node).click(function(){
          var data = $(this).data('data');
          if(Select.selectedNodes[data.key]) {
          Select.unselect(data);
          }
          else {
          Select.select(data);
          }
                      
        });
    }
    
    
};
