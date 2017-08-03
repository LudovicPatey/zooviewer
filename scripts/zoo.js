
var Zoo = {

    nodes: null, // The total list of all nodes
    meta: null, // The database-specific functions
    tags: null, // The list of all tags

    // Initialize the zoo once for all
    init: function() {
        this.initPanel();
        Filter.init();
        Contextmenu.init();
        $('#zoo select').trigger('change');
    },
    
    initPanel: function() {
        
        // Make the parts collapsible
        $('#panel legend').click(function() {
            $(this).next().toggle('blind', {'direction': 'up'});
        });
    
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
        this.disablePanel();
        $.getJSON(zooUrl, function(zoo) { Zoo.create(zoo) });
    },

    // Create the zoo from a database
    create: function(zoo) {

        this.nodes = zoo.nodes;

        // Extracts tags out of nodes
        this.tags = {};
        for(var key in zoo.nodes) {
            for(var i=0; i<zoo.nodes[key].tags.length; i++) {
                this.tags[zoo.nodes[key].tags[i]] = true;
            }
        }

        // Transform meta into functions
        this.initMeta(zoo.meta);

        // Format nodes
        for(var src in zoo.nodes) {
            var node = zoo.nodes[src];
            node.key = src;
            node.label = Tools.toTex(node.label);
            for(var dest in node.edges) {
                node.edges[dest].src = node;
                node.edges[dest].dest = zoo.nodes[dest];
            }
        }
        
        this.createPanel();
        
        // Draw a new graph
        this.newGraph();

    },
    
    initMeta : function(meta) {
        if(!meta) {
            meta = {};
        }
        
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
    newGraph: function() {
        Graph.init({
           meta: {
               filterEdge: this.meta.edgeKinds[this.meta.selectedEdgeKind].func,
               colorNode: this.meta.colorings[this.meta.selectedColoring].coloring,
               graphviz: $.extend(true, {
                    rankdir: 'TB'
               }, this.meta.graphviz)
           },
           finished: function() { Zoo.enablePanel() }
       });
    },
    
    createPanel: function() {
        
        this.createLegend();
        
        // Init the filters
        Filter.initDatabase();
    },
    
    // Init the legend panel
    // Call it once per database
    createLegend: function() {
        
        var edgeNode  = $('#edge_function select');
        edgeNode.empty();
        for(var i=0; i<this.meta.edgeKinds.length; i++) {
            edgeNode.append('<option value="' + i + '">' + this.meta.edgeKinds[i].label + '</option>');
        }
        
        var coloringNode = $('#coloring_function select');
        coloringNode.removeAttr('disabled');
        coloringNode.empty();
        for(var i=0; i<this.meta.colorings.length-1; i++) {
            coloringNode.append('<option value="' + i + '">' + this.meta.colorings[i].label + '</option>');
        }
        
        this.updateColoringLegend();
        
    },

    disablePanel: function() {
        $('#block').show();

    },
        
    enablePanel: function() {
        $('#block').hide();
    },
    
    changeEdgeKind: function(key) {
        this.meta.selectedEdgeKind = key;
        this.newGraph();
    },
    
    changeColoring: function(key) {
        this.meta.selectedColoring = key;
        this.updateColoringLegend();
        Graph.setColoring(this.meta.colorings[this.meta.selectedColoring].coloring);
    },
    
    updateColoringLegend: function() {
        var ul = $('#coloring_function + ul');
        var coloring = this.meta.colorings[this.meta.selectedColoring];
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

