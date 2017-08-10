
var Zoo = {

    nodes: null, // The total list of all nodes
    meta: null, // The database-specific functions
    diffs: null, // The local modification of the database
    
    //tags: null, // The list of all tags

    // Initialize the zoo once for all
    init: function() {
        this.initPanel();
        Filter.init();
        Contextmenu.init();
        
        var data = this.getUrlData();
        if(data.zoo) {
            $('#zoo select').val(data.zoo);
        }
        $('#zoo select').trigger('change');
    },
    
    initPanel: function() {
        
        
        // Make the parts collapsible
        /*$('#panel legend').click(function() {
            $(this).next().toggle('blind', {'direction': 'up'});
        });*/
        
        $('#panel').accordion({
              header: 'legend',
              heightStyle: 'content'
        });
    
    },
    
    // Call Mathjax if necessary to compute the size of nodes
    // And the div object, and then call the callback function
    getNodesSize: function(nodes, callback) {
        var size = $('#size');
        var hasElements = false;
        for(var key in nodes) {
            if(nodes[key].size) continue;
            hasElements = true;
            size.append('<div id="size_' + Tools.escapeChars(key) + '">' + nodes[key].texLabel + '</div>');
        }
        if(!hasElements) {
            callback.call(this);
            return;
        }
        
        if(!this.computingSize)
            MathJax.Hub.Queue(["Typeset",MathJax.Hub, size.get(0)]);
        this.computingSize = true;
        MathJax.Hub.Queue(function() {
            // Get the size of each node
            for(var key in nodes) {
                if(nodes[key].size) continue;
                var div = $('#size_' + Tools.escapeChars(key));
                nodes[key].size = { width: div.width(), height: div.height() };
                nodes[key].div = div;
                div.remove();
            }
            Zoo.computingSize = false;
            callback.call(this);
        });
    },
    
    getUrlData() {
        var url = decodeURIComponent(window.location.href);
        if(url.indexOf('#') == -1) return {};
        return JSON.parse(url.substring(url.indexOf("#")+1));
    },
    
    setUrlData(data) {
        window.location.href = '#' + JSON.stringify(data);
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
        
        var urlData = this.getUrlData();
        if(urlData.zoo != zooUrl) {
            this.setUrlData({ zoo : zooUrl });
        }
        this.disablePanel();
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
        
        this.createPanel();
        
        var urlData = this.getUrlData();
        this.diffs = {
        implications: [],
        separations: []
        };
        if(urlData.diffs) {
            this.diffs = urlData.diffs;
        }
        this.dataToDiffPanel();
        
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
    },
    
    createPanel: function() {
        
        this.createLegend();
        
        // Init the filters
        Filter.initDatabase();
    },
    
    // Init the legend panel
    // Call it once per database
    createLegend: function() {
        
        var urlData = this.getUrlData();
        var edgeNode  = $('#edge_function select');
        edgeNode.empty();
        for(var i=0; i<this.meta.edgeKinds.length; i++) {
            edgeNode.append('<option value="' + i + '">' + this.meta.edgeKinds[i].label + '</option>');
        }
        if(typeof urlData.edgeKind != 'undefined') {
            edgeNode.val(urlData.edgeKind);
            this.meta.selectedEdgeKind = urlData.edgeKind;
        }
        
        var coloringNode = $('#coloring_function select');
        coloringNode.removeAttr('disabled');
        coloringNode.empty();
        for(var i=0; i<this.meta.colorings.length-1; i++) {
            coloringNode.append('<option value="' + i + '">' + this.meta.colorings[i].label + '</option>');
        }
        if(typeof urlData.coloring != 'undefined') {
            coloringNode.val(urlData.coloring);
            this.meta.selectedColoring = urlData.coloring;
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
        key = parseInt(key);
        this.meta.selectedEdgeKind = key;
        var urlData = this.getUrlData();
        urlData.edgeKind = key;
        this.setUrlData(urlData);
        this.newGraph();
    },
    
    changeColoring: function(key) {
        key = parseInt(key);
        this.meta.selectedColoring = key;
        this.updateColoringLegend();
        if(!Select.hasSelectedNodes()) {
            var urlData = this.getUrlData();
            urlData.coloring = key;
            this.setUrlData(urlData);
        }
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
    },
    
    addEdge : function(kind, type, from, to) {
        this.diffs[type].push({
             kind : kind,
             from : from.key,
             to : to.key
        });
        var urlData = this.getUrlData();
        urlData.diffs = this.diffs;
        this.setUrlData(urlData);
        this.dataToDiffPanel();
        this.newGraph();
    },
    
    removeEdge : function(type, i) {
        var diffs = this.diffs[type];
        i = parseInt(i);
        diffs.splice(diffs.indexOf(i), 1);
        var urlData = this.getUrlData();
        urlData.diffs = this.diffs;
        this.setUrlData(urlData);
        this.dataToDiffPanel();
        this.newGraph();
    },
    
    dataToDiffPanel: function() {
        var n = $('.local_modifications + *');
        if(this.diffs.implications.length == 0 && this.diffs.separations.length == 0) {
            n.replaceWith('<p>You have not made any local modification yet. Select nodes, right-click'
                          + ' and choose "Add arrows" to add implications or separations.</p>');
        }
        else {
            var ul = $('<ul></ul>');
            n.replaceWith(ul);
            for(var i=0; i<this.diffs.implications.length; i++) {
                var diff = this.diffs.implications[i];
                ul.append('<li><label><input type="checkbox" checked="checked" onchange="Zoo.removeEdge(\'implications\', ' + i + ')" /> '
                          + diff.from + ' implies ' + diff.to + ' by the relation "'
                          + this.meta.edgeKinds[diff.kind].label + '"</label></li>');
            }
            for(var i=0; i<this.diffs.separations.length; i++) {
                var diff = this.diffs.separations[i];
                ul.append('<li><label><input type="checkbox" checked="checked" onchange="Zoo.removeEdge(\'separations\', ' + i + ')" /> '
                          + diff.from + ' does not imply ' + diff.to + ' by the relation "'
                          + this.meta.edgeKinds[diff.kind].label + '"</label></li>');
            }
        }
    }
    
};

