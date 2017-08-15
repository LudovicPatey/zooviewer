
var Contextual = {
    
    div : null,

    init : function() {
        this.div = $('#contextual div');
    },
    
    create : function() {
        this.update();
    },
    
    update : function() {
        var sel = Select.getSelectionList();
        if(sel.length == 0) {
            this.div.html('<p>Select nodes to see some context</p>');
        }
        else if(sel.length == 1) {
            this.updateSingleNode(sel[0]);
        }
        else {
            this.updateMultipleNodes(sel);
        }
    },
    
    updateSingleNode: function(node) {
        
        var div = this.div;
        this.div.html('<h3>Selected node</h3>');
        this.div.append('<p class="label"></p>');
        Tools.getNodesSize([node], function() {
            div.find('.label').append($('.MathJax_SVG > *', node.div).clone());
                           });
        this.updateDefinition(node);
        this.updateProperties(node);
        this.updateTags(node);
        
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, this.div.get(0)]);
    },
    
    updateMultipleNodes : function(sel) {
        this.div.html('<p>You selected ' + sel.length
                      + ' nodes. Click on "Proofs" to see the justification of the arrows.</p>');
        this.div.append('<p class="proofs"><input type="button" value="Proofs" /></p>');
        $('.proofs input', this.div).click(function() {
            Proofs.showArrows(sel);
        });
    },
    
    updateDefinition: function(node) {
        if(node.definition) {
            this.div.append('<h3>Definition</h3><p class="definition">' + node.definition + '</p>');
        }
    },
    
    updateProperties : function(node) {
        var ul = $('<ul></ul>');
        var func = Patches["panel.contextual.property"];
        for(var key in node.properties) {
            ul.append('<li>' + func.call(this, key, node.properties[key]) + '</li>');
        }
        this.div.append('<h3>Properties</h3>');
        if(ul.children().length > 0) {
            this.div.append(ul);
            this.div.append('<p class="proofs"><input type="button" value="Proofs" /></p>');
        }
        else {
            this.div.append('<p>There are no properties.</p>');
        }
        $('.proofs input', this.div).click(function() {
          Proofs.showProperties(node);
        });
    },
    
    updateTags : function(node) {
        this.div.append('<h3>Tags</h3>');
        var tags = Zoo.getTagsOfNode(node);
        var p = $('<p class="tags"></p>');
        for(var i=0; i<tags.length; i++) {
            var tag = tags[i];
            p.append('<label><span class="wrapper">' + tag.label + '</span></label>');
        }
        if(p.children().length > 0) {
            this.div.append(p);
        }
        else {
            this.div.append('<p>There are no tags.</p>');
        }
    }
    
};
