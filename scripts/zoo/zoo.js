
var Zoo = {

    nodes: null, // The total list of all nodes
    meta: null, // The database-specific functions
    diffs: null, // The local modification of the database

    // Initialize the zoo once for all
    init: function() {
        Panel.init();
        Contextmenu.init();
    },
    
    
    load: function(value) {
        if(value == 'custom') {
            $('#zoo p + p input').get(0).value = '';
            $('#zoo p + p').show();
        }
        else {
            $('#zoo p + p').hide();
            this.loadUrl(value);
        }
    },
    
    loadLocal: function(files) {
        var file = files[0];
        var fr = new FileReader();
        fr.onload = function() {
            Zoo.loadUrl(fr.result);
        };
        fr.readAsDataURL(file);
    },

    loadUrl: function(zooUrl) {
        
        var urlData = Tools.getUrlData();
        if(urlData.zoo != zooUrl) {
            Tools.setUrlData({ zoo : zooUrl });
        }
        Panel.disable();
        $.getJSON(zooUrl, function(zoo) { Zoo.create(zoo) });
    },

    // Create the zoo from a database
    create: function(zoo) {

        this.nodes = zoo.nodes;

        // Transform meta into functions
        this.initMeta(zoo.meta);

        // Format nodes
        for(var src in zoo.nodes) {
            var node = zoo.nodes[src];
            node.key = src;
            node.texLabel = Tools.toTex(node.label);
            for(var dest in node.edges) {
                node.edges[dest].src = node;
                node.edges[dest].dest = zoo.nodes[dest];
            }
        }
        
        Panel.create();
        
        Proofs.create();
        
        // Draw a new graph
        this.newGraph({
            select : Tools.getUrlData().select
        });

    },
    
    initMeta : function(meta) {
        if(!meta) {
            meta = {};
        }
        
        // Init the patches
        Patches.init(meta.patches);
        
        // Init the edges part
        if(!meta.edgeKinds) {
            meta.edgeKinds = [];
        }
        meta.selectedEdgeKind = 0;
        if(!meta.edgeKinds.length) {
            meta.edgeKinds.push({
                                "label" : "Implication",
                                "functionBody" : "if(!edge.properties.implication) return 2; return edge.properties.implication.value ? 1 : 0;"
            });
        }
        for(var i=0; i<meta.edgeKinds.length; i++) {
            meta.edgeKinds[i].func = new Function('edge', 'context', meta.edgeKinds[i].functionBody);
        }
        
        if(!meta.tags) {
            meta.tags = [{ key : "default", label: "Default", "default": true}];
        }
        meta.defaultTag = 0;
        for(var i=0; i<meta.tags.length; i++) {
            if(!meta.tags[i].functionBody) continue;
            meta.tags[i].tag = new Function('node', meta.tags[i].functionBody);
        }
        
        
        // Init the colorings part
        if(!meta.colorings) {
            meta.colorings = [];
        }
        meta.selectedColoring = 0;
        if(!meta.colorings.length) {
            meta.colorings.push({
                                "label" : "By category",
                                "colors" : [ {color: "lightblue", label: "Default category"},
                                            { color: "lightgreen", label:  "Non-default category"} ],
                "coloring" : "return node.tags.indexOf('default') == -1 ? 'lightgreen' : 'lightblue';"
            });
        }
        for(var i=0; i<meta.colorings.length; i++) {
            meta.colorings[i].coloring = new Function('node', 'context', meta.colorings[i].coloring);
        }
        
        meta.colorings.push(Select.coloring);
        
        
        this.meta = meta;
    },
    
    // Draw a new graph
    newGraph: function(options) {
        Graph.init($.extend({
           meta: {
               filterEdge: this.meta.edgeKinds[this.meta.selectedEdgeKind].func,
               colorNode: this.meta.colorings[this.meta.selectedColoring].coloring,
               graphviz: $.extend(true, {
                    rankdir: 'TB'
               }, this.meta.graphviz)
           },
           finished: function() { Panel.enable() }
        }, options));
    },
    
    nodesToKeys: function(nodes) {
        var keys = [];
        for(var i=0; i<nodes.length; i++) {
            keys.push(nodes[i].key);
        }
        return keys;
    },
        
    keysToNodes: function(keys) {
        var nodes = [];
        for(var i=0; i<keys.length; i++) {
            nodes.push(this.nodes[keys[i]]);
        }
        return nodes;
    }
    
};

