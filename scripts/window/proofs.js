
var Proofs = {
    
    props: null,
    
    // Init once per zoo
    create: function() {
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

        var ul = $('<ul></ul>');
        for(var key in node.properties) {
            this.buildProof(ul, key, node.properties[key]);
        }
        Window.open({
                    title : "Properties of the node",
                    content : ul
        });
    },
    
    showArrows: function(sel) {
        var ul = $('<ul></ul>');
        for(var i=0; i<sel.length; i++) {
            for(var j=0; j<sel.length; j++) {
                if(i == j) continue;
                var edge = sel[i].edges[sel[j].key];
                for(var k in edge.properties) {
                    this.buildProof(ul, k, edge.properties[k]);
                }
            }
        }
        Window.open({
                    title : "Justification of the arrows",
                    content : ul
        });
    },
    
    buildProof(ul, key, prop) {
        if(prop.value === null) return;
        
        var just = prop.justification;
        var func = Patches["panel.contextual.property"];
        var li = $("<li><span class=\"description\">" + func.call(this, key, prop) + "</span></li>");
        var justUl = $("<ul></ul>");
        if(just.direct === null || just.direct)
            li.append(justUl);
        ul.append(li);
        if(just.direct !== null) {
                justUl.append("<li>" + (just.direct ? just.direct : "Obvious") + "</li>");
        }
        else {
            for(var i=0; i<just.composite.length; i++) {
                this.buildProof(justUl, just.composite[i], this.getPropById(just.composite[i]));
            }
        }
    }
    
};
