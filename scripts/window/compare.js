
var Compare = {
    
    from : null,
    to : null,
    nodes : null,
    svg : null,

    open : function(from, to) {
        
        this.from = from;
        this.to = to;
        
        // Format nodes
        var kinds = Zoo.meta.edgeKinds;
        this.nodes = {};
        for(var i=0; i<kinds.length; i++) {
            if(!kinds[i].node) {
                kinds[i].node = { key : kinds[i].label, label : kinds[i].label, edges : [] };
            }
            var node = kinds[i].node;
            node.texLabel = Tools.toTex(node.label);
            this.nodes[node.key] = node;
        }
        
        Tools.getNodesSize(this.nodes, function() {
             Compare.render();
        });
    },
    
    render : function() {
        
        var dot = this.buildDot();
        
        var p = $('<p></p>');
        var content = $('<div class="comparison_window"></div>');
        content.append(p);
        content.append(Viz(dot));
        
        p.append($('.MathJax_SVG > *', this.from.div).clone());
        p.append(' imples ');
        p.append($('.MathJax_SVG > *', this.to.div).clone());
        p.append(' for the relations');
        
        Window.open({
            title : "Comparison over relations",
            content : content
        });
        
        this.svg = $('#window p + svg');
        this.svg.removeAttr('width');
        this.svg.removeAttr('height');
        
        this.processNodes();
        
        // Refresh math formulas
        new Svg_MathJax().refresh();
    },
    
    // Make the nodes clickable, and associate metadata to it
    processNodes: function(){
        var nodes = this.nodes;
        $('.node', this.svg).each(function(){
              var id = $('text', this).html();
              var node = nodes[id];
                                  
              // Make associations between metadata and nodes
              $(this).data('data', node);
              node.svgNode = this;
              $(this).attr('localid',id);
              
      });
        
        // Replace the ids by text or tex labels
        this.processNodeLabels();
        
    },
        
    // Replace the ids by text or tex labels
    processNodeLabels: function() {
        $('.node', this.svg).each(function(){
                                  
              var node = $(this).data('data');
              
              
              // Graphviz used ids as labels
              // Replace id with the Latex label
              $('text', this).html(node.texLabel);
              
              
        });
        
    },
    
    buildDot : function() {
        var kinds = Zoo.meta.edgeKinds;
        
        var text = "digraph G { graph ";
        text += "[\n\t rankdir = LR\n\t ranksep = 0.5\n]\n";
        text += "\tnode [shape=ellipse,style=filled,color=white];\n";
        
        // Add nodes
        for(var i=0; i<kinds.length; i++) {
            var key = kinds[i].node.key;
            var size = kinds[i].node.size;
            var color = '#dddddd';
            switch(kinds[i].func.call(this, this.from.edges[this.to.key], {})) {
                case 0 : color = '#eca6a6'; break;
                case 1 : color = '#a4f48c'; break;
            }
            var dim =  'fixedsize=true, width=' + ((size.width+10)/70) + ', height=' + ((size.height+10)/70);
            text += "\t" + '"' + key + '" [' + dim + ', fillcolor="' + color + '"]\n';
        }
        
        // Add edges
        for(var i=0; i<kinds.length; i++) {
            var node = kinds[i].node;
            for(var j=0; j<node.edges.length; j++) {
                text += "\t" + '"' + node.key + '" -> "' + node.edges[j] + '"\n';
            }
        }
        
        text += "}";
        
        return text;
    }
};
