
var Graph = {
    
    nodes: null, // The list of nodes appearing in the graph
    implications: null, // map of all implications
    nonImplications: null, // map of all proved non-implications
    openImplications: null, // map of all open implications
    canonical: null, // Mapping a statement to a canonical equivalent statement
    meta: null,
    
    options: {
      displayNonImplications: false,
      displayWeakOpenImplications: false,
      displayStrongOpenImplications: false
    },
    
    predecessors: null,  // map of the predecessor relation
    successors: null,  // map of the successor relation
    
    strongImplications: null, // list of the successor relation
    strongNonImplications: null,  // list of the maximal non-implications
    weakOpenImplications: null,  // list of the weakest open implications
    strongOpenImplications: null,  // list of the strongest open implications
        
    // Html components
    svg: null,
    svgPatterns: null,
    svgDefs: null,
    
    init: function(options) {
        this.meta = options.meta;
        this.filterNodes();
        this.filterImplications();
        this.computeCanonical();
        this.computeStrongImplications();
        this.computePredecessorsAndSuccessors();
        this.computeStrongNonImplications();
        this.computeOpenImplications();
        this.computeWeakOpenImplications();
        this.computeStrongOpenImplications();
        
        this.svgPatterns = {};
        
        // Make the graph clickable
        Select.init({
            select: function() {
                Graph.updateContext();
            },
            unselect: function() {
                Graph.updateContext();
            }
        });
        
        this.updateContext();
        Proofs.init();
        
        // Compute text size and generate once for all the latex node
        var size = $('#size');
        for(var key in this.nodes) {
            if(this.nodes[key].size) continue;
            size.append('<div id="size_' + Tools.escapeChars(key) + '">' + this.nodes[key].label + '</div>');
        }
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
        MathJax.Hub.Queue(function() { Graph.render(); options.finished.call(this) });
    },
    
    
    setOption: function(key, value) {
        this.options[key] = value;
        this.render();
    },
    
    render: function() {
        
        // Get the size of each node
        for(var key in this.nodes) {
            if(this.nodes[key].size) continue;
            var div = $('#size_' + Tools.escapeChars(key));
            this.nodes[key].size = { width: div.width(), height: div.height() };
            this.nodes[key].div = div;
        }
        $('#size').empty();
        
        // Build a raw graphviz graph
        var text = this.buildDot();
        var container = $('#graph');
        container.html(Viz(text));
        
        // Resize the graph to fit the screen
        this.svg = container.find('svg');
        this.svg.attr('id', 'svg').attr('width','100%').attr('height','100%');
        this.svgDefs = $('#defs defs');
        
        
        Contextmenu.init();
        
        // Process the nodes to make them clickable, and attach metadata to it
        this.processNodes();
        
        // Color each node
        this.colorNodes();
        
        // This makes the graph zoomable
        svgPanZoom(this.svg.get(0), {
                   dblClickZoomEnabled: false
        });
        
        // Refresh math formulas
        new Svg_MathJax().refresh();
    },
    
    filterNodes: function() {
        var filters = Filter.filters;
        this.nodes = {};
        for(var key in Zoo.nodes) {
            var node = Zoo.nodes[key];
            
            // Restrict to nodes having specified tags
            if(filters.restrictToTags) {
                var hasTag = false;
                for(var i=0; i<filters.tags.length; i++) {
                    if(node.tags.indexOf(filters.tags[i]) != -1) {
                        hasTag = true;
                        break;
                    }
                }
                if(!hasTag) continue;
            }
            
            // Restrict to node comparable with a set
            if(filters.restrictToComparable) {
                var test = filters.comparableOptions.provably ? [1] : [1,2];
                var inBetween = filters.comparableOptions.inBetween;
                var different = false;
                var previousComp = null;
                var isComparable = true;
                
                // Add comparable nodes
                for(var i=0; i<filters.comparableList.length; i++) {
                    var node2 = filters.comparableList[i];
                    var isAbove = test.indexOf(this.meta.filterEdge.call(this, Zoo.nodes[key].edges[node2.key], {})) != -1;
                    var isBelow = test.indexOf(this.meta.filterEdge.call(this, Zoo.nodes[node2.key].edges[key], {})) != -1;
                    
                    // Equivalent statements are always included
                    if(isAbove && isBelow) {
                        different = true;
                        break;
                    }
                    
                    if(isAbove) {
                        if(!previousComp) previousComp = 'above';
                        else if(previousComp != 'above') different = true;
                        continue;
                    }
                    if(isBelow) {
                        if(!previousComp) previousComp = 'below';
                        else if(previousComp != 'below') different = true;
                        continue;

                    }
                    isComparable = false;
                    break;
                }
                
                // Add selected nodes
                for(var i=0; i<filters.comparableList.length; i++) {
                    if(key == filters.comparableList[i].key) {
                        isComparable = true;
                        different = true;
                        break;
                    }
                }
                       
                
                if(!isComparable || (inBetween && !different)) continue;
            }
               
            // If we passed all the filters, we keep the node
            this.nodes[key] = node;
            
            // Finally, remove the excluded elements
            if(filters.excludeElements) {
                for(var i=0; i<filters.exclusionList.length; i++) {
                    delete this.nodes[filters.exclusionList[i].key];
                }
            }
        }
    },
    
    filterImplications: function() {
        var impls = {};
        var nonImpls = {};
        for(var key1 in this.nodes) {
            for(var key2 in this.nodes) {
                var implType = this.meta.filterEdge.call(this, this.nodes[key1].edges[key2], {});
                switch(implType) {
                    case 0:
                        nonImpls[key1] = nonImpls[key1] ? nonImpls[key1] : {};
                        nonImpls[key1][key2] = true;
                        break;
                    case 1:
                        impls[key1] = impls[key1] ? impls[key1] : {};
                        impls[key1][key2] = true;
                        break;
                        
                }
            }
        }
        this.implications = impls;
        this.nonImplications = nonImpls;
    },
    
    // Build a big string in DOT format
    buildDot: function(relations){
        
        var text = "digraph G { graph ";
        text += "[rankdir = " + this.meta.graphviz.rankdir + "\n ranksep = 0.5 ]\n";
        text += "node [shape=ellipse,fillcolor=yellow,style=filled,color=white];\n";

        // Add nodes
        for(var key in this.nodes) {
            var size = this.nodes[key].size;
            var dim = 'width=' + ((size.width+10)/70) + ', height=' + ((size.height+10)/70);
            text += ' "' + key + '" [fixedsize=shape, ' + dim + '] \n';
        }
        
        
        // Add implications
        var impls = this.strongImplications;
        for(var i=0; i<impls.length; i++) {
            var from = impls[i].from;
            var to = impls[i].to;
            
            // Display a black arrow if the implication is strict
            // And a gray one otherwise
            var strict = this.nonImplications[to] && this.nonImplications[to][from]
                 ? ' [color = "black"]' : ' [color = "grey"]';
            text += ' "' + impls[i].from + '" -> "' + impls[i].to + '" ' + strict + '\n';
        }
        
        // Add equivalences
        var can = this.canonical;
        for(var id in can) {
            if(can[id] != id) {
                text += ' "' + can[id] + '" -> "' + id + '" [dir = both]\n';
            }
        }
        
        // Add non-implications
        if(this.options.displayNonImplications) {
            var nonImpls = this.strongNonImplications;
            for(var i=0; i<nonImpls.length; i++) {
                var from = nonImpls[i].from;
                var to = nonImpls[i].to;
                
                // Display only the non-obvious non-implications
                // Basically, if A -> B and B does not imply A,
                // this is already reflected by a black arrow instead of a gray one
                if(this.implications[to] && this.implications[to][from]) continue;
                text += ' "' + from + '" -> "' + to + '" [color = "#ff0000", constraint = false]\n';
            }
        }
        
        // Add weak open implications
        if(this.options.displayWeakOpenImplications) {
            var open = this.weakOpenImplications;
            for(var i=0; i<open.length; i++) {
                var from = open[i].from;
                var to = open[i].to;
                text += ' "' + from + '" -> "' + to + '" [color = "#008000", style = "dashed", constraint = false]\n';
            }
        }
        
        // Add strong open implications
        if(this.options.displayStrongOpenImplications) {
            var open = this.strongOpenImplications;
            for(var i=0; i<open.length; i++) {
                var from = open[i].from;
                var to = open[i].to;
                text += ' "' + from + '" -> "' + to + '" [color = "#ffa500", style = "dashed", constraint = false]\n';
            }
        }
        
        
        text += "}\n";
        
        return text;
    },
        
        // Compute the maximal non-implications
    computeStrongNonImplications: function() {

        var nonImpls = this.nonImplications;
        var ret = [];
        for(var from in nonImpls) {
            if(this.canonical[from] != from) continue;
            for(var to in nonImpls[from]) {
                if(this.canonical[to] != to) continue;
                var optimal = true;
                if(this.implications[to]) {
                    for(var weak in this.implications[to]) {
                        if(weak != to && this.canonical[weak] == weak && nonImpls[from][weak]) {
                            optimal = false;
                            break;
                        }
                    }
                }
                if(!optimal) continue;
                for(var weak in this.nodes) {
                    if(weak !=from && this.canonical[weak] == weak && this.implications[weak] && this.implications[weak][from]
                       && nonImpls[weak] && nonImpls[weak][to]) {
                        optimal = false;
                        break;
                    }
                }
                if(!optimal) continue;
                ret.push({from: from, to: to});
            }
        }

        
        this.strongNonImplications = ret;
    },
        
    // Compute the immediate predecessor relation
    computePredecessorsAndSuccessors: function() {
        var succ = {};
        var pred = {};
        for(var key in this.nodes) {
            succ[key] = {};
            pred[key] = {};
        }
        for(var i=0; i<this.strongImplications.length; i++) {
            var from = this.strongImplications[i].from;
            var to = this.strongImplications[i].to;
            succ[from][to] = true;
            pred[to][from] = true;
        }
        this.predecessors = pred;
        this.successors = succ;
    },
    
    // Compute all open implications
    // That is, the pairs which are neither an implication,
    // nor a provably non-implication
    computeOpenImplications: function() {
        var open = {};
        for(var from in this.nodes) {
            for(var to in this.nodes) {
                if(this.implications[from] && this.implications[from][to]) continue;
                if(this.nonImplications[from] && this.nonImplications[from][to]) continue;
                if(!open[from]) open[from] = {};
                open[from][to] = true;
            }
        }
        this.openImplications = open;
    },
        
    // Compute open relations such that every predecessor of the source
    // implies the destination, and every successor of the destination
    // is implied by the source
    computeWeakOpenImplications: function() {
      
        var ret = [];
        for(var from in this.openImplications) {
            if(this.canonical[from] != from) continue;
            for(var to in this.openImplications[from]) {
                if(this.canonical[to] != to) continue;
                var optimal = true;
                for(var pred in this.predecessors[from]) {
                   if(!this.implications[pred] || !this.implications[pred][to]) {
                    optimal = false;
                    break
                   }
                }
                
                if(!optimal) continue;
                   for(var succ in this.successors[to]) {
                   if(!this.implications[from] || !this.implications[from][succ]) {
                   optimal = false;
                   break;
                   }
                }
                
                if(!optimal) continue;
                   ret.push({from: from, to: to});
            }
        }
        this.weakOpenImplications = ret;
        
    },
        
        
    // Compute open relations such that no successor of the source implies the destination
    // And such that there is no shorter non-implications
    computeStrongOpenImplications: function() {
        
        var ret = [];
        for(var from in this.openImplications) {
            if(this.canonical[from] != from) continue;
            for(var to in this.openImplications[from]) {
                if(this.canonical[to] != to) continue;
                var optimal = true;
                for(var succ in this.successors[from]) {
                    if(!this.nonImplications[succ] || !this.nonImplications[succ][to]) {
                        optimal = false;
                        break;
                    }
                }
                
                if(!optimal) continue;
                
                for(var pred in this.predecessors[to]) {
                    if(this.openImplications[from][pred]) {
                        optimal = false;
                        break;
                    }
                }
                
                if(!optimal) continue;
                ret.push({from: from, to: to});
            }
        }
        this.strongOpenImplications = ret;
    },
        
        
    // Compute the immediate children
    computeStrongImplications: function() {
        var strong = {};
        var impls = this.implications;
        for(var from in impls) {
            if(this.canonical[from] != from) continue;
            for(var to in impls[from]) {
                if(this.canonical[to] != to) continue;
                if(from == to) continue;
                if(!strong[from]) {
                    strong[from] = {};
                }
                strong[from][to] = true;
            }
        }
        var ret = [];
        for(var from in strong) {
            for(var to in strong[from]) {
                var immediate = true;
                for(var k in this.nodes) {
                    if(strong[from][k] && strong[k] && strong[k][to]) {
                        immediate = false;
                        break;
                    }
                }
                if(immediate)
                    ret.push({from: from, to: to});
            }
        }
        this.strongImplications = ret;
    },
        
    
    
    // Compute a function which maps a statement to a canonical statement which is equivalent to it
    computeCanonical: function() {

        var can = {};
        for(var key in this.nodes) {
            can[key] = key;
            
        }
        var impls = this.implications;
        for(var key1 in impls) {
            var uid1 = this.nodes[key1].uid;
            for(var key2 in impls[key1]) {
                if(!impls[key2] || !impls[key2][key1])
                    continue;
                var uid2 = this.nodes[key2].uid;
                if(uid1 < uid2) {
                    can[key2] = can[key1];
                }
                if(uid1 > uid2) {
                    can[key1] = can[key2];
                }
                
            }
        }
        this.canonical = can;
    },
        
        
    setColoring: function(coloring) {
        this.meta.colorNode = coloring;
        this.colorNodes();
    },
    
    
    // Color the nodes in function of an arbitrary callback function
    colorNodes: function() {
        $('.node', this.svg).each(function(){
                                  
            var color = Graph.meta.colorNode.call(this, $(this).data('data'), {});
            $('ellipse',this).attr('fill', Graph.getSVGColor(color));
        });
    },
    
    getSVGColor: function(color) {
        if(color.indexOf(':') == -1)
            return color;
        if(this.svgPatterns[color])
            return this.svgPatterns[color];
        
        var c = color.split(':');
        var id = 'color_' + color.replace(/:/, '_');
        
        var pattern = $('#defs pattern:first').clone();
        pattern.attr('id', id);
        $('g:first', pattern).attr('fill', c[0]);
        $('g:last', pattern).attr('fill', c[1]);
        $('#defs').append(pattern);

      
        this.svgPatterns[color] = 'url(#' + id + ')';
        return this.svgPatterns[color];
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
          
          // Makes a node selectable
          Select.processNode(this, {});
          
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
        $('text', this).html(node.label);


        });
        
    },
    
    updateContext: function() {
        var sel = Select.getSelectionList();
        var div = $('#contextual div');
        if(sel.length == 0) {
            div.html('<p>Select nodes to see some context</p>');
        }
        else if(sel.length == 1) {
            var node = sel[0];
            
            div.html('<h3>Selected node</h3>');
            div.append('<p class="label"></p>');
            div.find('.label').append($('.MathJax_SVG > *', node.div).clone());
            if(node.definition) {
                div.append('<h3>Definition</h3><p class="definition">' + node.definition + '</p>');
            }
            var dl = $('<dl></dl>');
            for(var prop in node.properties) {
                var value = node.properties[prop].value;
                switch(value) {
                    case true: value = 'true'; break;
                    case false: value = 'false'; break;
                    case null : value = 'unknown'; break;
                }
                dl.append('<dt>' + prop + '</dt><dd>' + value + '</dd>');
            }
            div.append('<h3>Properties</h3>');
            if(dl.children().length > 0) {
                div.append(dl);
                div.append('<p class="proofs"><input type="button" value="Proofs" /></p>');
            }
            else {
                div.append('<p>There are no properties.</p>');
            }
            $('.proofs input', div).click(function() {
                  Proofs.showProperties(node);
            });
            MathJax.Hub.Queue(["Typeset",MathJax.Hub, div.get(0)]);
        }
        else {
            div.html('<p>You selected ' + sel.length + ' nodes. Click on "Proofs" to see the justification of the arrows.</p>');
            div.append('<p class="proofs"><input type="button" value="Proofs" /></p>');
            $('.proofs input', div).click(function() {
              Proofs.showArrows(sel);
              });
        }
    },
    
    downloadAsImage: function() {
        
        // Get the SVG of the graph
        var html = Graph.svg.get(0).outerHTML;
        
        // Add the mathematical symbols coming from another SVG
        var mathjaxSvg = $('#MathJax_SVG_glyphs').get(0).outerHTML;
        html = html.replace(/(<svg[^>]+>)/, "$1" + mathjaxSvg);
        
        // Add the stripped colors coming from another SVG
        var defs = $('#defs').get(0).innerHTML;
        html = html.replace(/(<svg[^>]+>)/, "$1" + defs);
        
        // Remove the rezooming
        html = html.replace(/(svg-pan-zoom_viewport.*transfor)m/, "$1");
        
        // Fix Safari href
        html = html.replace(/NS[0-9]+:href/g, 'xlink:href');
        
        // Replace html entities by xml entities
        html = html.replace(/&nbsp;/g, '&#032;');
        
        // Show image
        window.location.href = 'data:image/svg+xml;utf8,' +  unescape(html);
    }

    
};
