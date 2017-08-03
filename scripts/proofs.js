
var Proofs = {
    
    props: null,
    
    // Init once per zoo
    init: function() {
        this.props = null;
    },
    
    // Lazy loading
    getPropById: function(uid) {
        if(this.props) return this.props[uid];
        
        this.props = {};
        for(var key in Zoo.nodes) {
            var node = Zoo.nodes[key];
            for(var k2 in node.properties) {
                this.props[node.properties[k2].uid] = node.properties[k2];
            }
            for(var k1 in node.edges) {
                var edge = node.edges[k1];
                for(var k2 in edge.properties) {
                    this.props[edge.properties[k2].uid] = edge.properties[k2];
                }
            }
        }
        return this.getPropById(uid);
    },
    
    showProperties: function(node) {
        var content = $('<div></div>');
        var h3 = $('<h3>Properties of the node</h3>');
        
        content.html(h3);
        var ul = $('<ul></ul>');
        content.append(ul);
        for(var key in node.properties) {
            this.buildProof(ul, node.properties[key]);
        }
        this.display(content);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, content.get(0)]);
    },
    
    showArrows: function(sel) {
        var content = $('<div></div>');
        var h3 = $('<h3>Justification of the arrows</h3>');
        content.html(h3);
        var ul = $('<ul></ul>');
        content.append(ul);
        for(var i=0; i<sel.length; i++) {
            for(var j=0; j<sel.length; j++) {
                if(i == j) continue;
                var edge = sel[i].edges[sel[j].key];
                for(var k in edge.properties) {
                    this.buildProof(ul, edge.properties[k]);
                }
            }
        }
        this.display(content);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub, content.get(0)]);
    },
    
    display : function(content) {
        Zoo.disablePanel();
        $('#window').html(content).show();
        $('#block').click(Proofs.hide);
    },
    
    hide: function() {
        $('#window').hide();
        $('#block').unbind('click', Proofs.hide);
        Zoo.enablePanel();
    },
    
    buildProof(ul, prop) {
        if(prop.value === null) return;
        
        var just = prop.justification;
        var li = $("<li><span class=\"description\">" + prop.description + "</span></li>");
        var justUl = $("<ul></ul>");
        if(just.direct === null || just.direct)
            li.append(justUl);
        ul.append(li);
        if(just.direct !== null) {
                justUl.append("<li>" + (just.direct ? just.direct : "Obvious") + "</li>");
        }
        else {
            for(var i=0; i<just.composite.length; i++) {
                this.buildProof(justUl, this.getPropById(just.composite[i]));
            }
        }
    }
    
};
