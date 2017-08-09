
var Export = {
    
    outputSVG: function() {
        
        var svg = this.toSVG();
        this.download('data:image/svg+xml;utf8,' +  unescape(svg), 'diagram.svg');
        
    },
    
    outputPNG: function() {

        this.download(this.toPNG(), 'diagram.png');
        
    },
    
    outputDot: function(useLabels) {
        
        var text = this.toDot({
            displayNonImplications : Graph.options.displayNonImplications,
            displayWeakOpenImplications : Graph.options.displayWeakOpenImplications,
            displayStrongOpenImplications : Graph.options.displayStrongOpenImplications,
            useLabels : useLabels,
            fixNodeSize : useLabels
        
        });
        this.downloadText(text, 'diagram.dot');
        //document.write('<pre>' + text + '</pre>');
    },
        
    outputTikz: function() {
        
        var text = this.toTikz({
           displayNonImplications : Graph.options.displayNonImplications,
           displayWeakOpenImplications : Graph.options.displayWeakOpenImplications,
           displayStrongOpenImplications : Graph.options.displayStrongOpenImplications
           
        });
        this.downloadText(text, 'diagram.tex');
        //document.write('<pre>' + text + '</pre>');
        
    },
    
    downloadText: function(text, filename) {
        this.download('data:text/plain;charset=utf-8,' + encodeURIComponent(text), filename);
    },
    
    download: function(url, filename) {
        var e = document.createElement('a');
        e.setAttribute('href', url);
        e.setAttribute('download', filename);
        e.style.display = 'none';
        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    },
    
    toSVG: function() {
        
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
        
        return html;
    },
    
    toPNG: function() {
        
        // Get the SVG of the graph
        var svg = this.toSVG();
        var p = $('#graph svg polygon:first').get(0).getBBox();
        var canvas = $('<canvas width="' + p.width + '" height="' + p.height + 'px"></canvas');
        $(document.body).append(canvas);
        canvg(canvas.get(0), svg, { ignoreDimensions : true });

        var png = canvas.get(0).toDataURL('image/png');
        canvas.remove();
        
        return png;
    },
    
    toDot: function(options){
        
        var text = "digraph G { graph ";
        text += "[\n\t rankdir = " + Graph.meta.graphviz.rankdir + "\n\t ranksep = 0.5\n]\n";
        text += "\tnode [shape=ellipse,style=filled,color=white];\n";
        
        // Add nodes
        if(options.useLabels || options.fixNodeSize) {
            for(var key in Graph.nodes) {
                var size = Graph.nodes[key].size;
                var label = options.useLabels ? ', labels="' + Graph.nodes[key].label + '"' : '';
                var dim =  options.fixNodeSize ? 'fixedsize=shape, width=' + ((size.width+10)/70) + ', height=' + ((size.height+10)/70) : '';
                text += "\t" + '"' + key + '" [' + dim + label + '] \n';
            }
        }
        
        
        // Add implications
        var impls = Graph.strongImplications;
        var strong = [];
        for(var i=0; i<impls.length; i++) {
            var from = impls[i].from;
            var to = impls[i].to;
            var strict = Graph.nonImplications[to] && Graph.nonImplications[to][from];
            
            if(strict) {
                strong.push({from : from, to : to });
            }
            
            
            // Display a black arrow if the implication is strict
            // And a gray one otherwise
            var color = strict ? ' [color = "black"]' : ' [color = "grey"]';
            text += "\t" + '"' + impls[i].from + '" -> "' + impls[i].to + '" ' + color + '\n';
        }
        
        // Add equivalences
        var can = Graph.canonical;
        for(var id in can) {
            if(can[id] != id) {
                text += "\t" + '"' + can[id] + '" -> "' + id + '" [dir = both]\n';
            }
        }
        
        // Add non-implications
        if(options.displayNonImplications) {
            var nonImpls = Graph.strongNonImplications;
            for(var i=0; i<nonImpls.length; i++) {
                var from = nonImpls[i].from;
                var to = nonImpls[i].to;
                
                // Display only the non-obvious non-implications
                // Basically, if A -> B and B does not imply A,
                // this is already reflected by a black arrow instead of a gray one
                var display = true;
                for(var j = 0; j<strong.length; j++) {
                    var s = strong[j];
                    if(Graph.implications[to] && Graph.implications[to][s.from] && Graph.implications[s.to] && Graph.implications[s.to][from]) {
                        display = false;
                        break;
                    }
                }
                //if(this.implications[to] && this.implications[to][from]) continue;
                if(!display) continue
                    text += "\t" + '"' + from + '" -> "' + to + '" [color = "#ff0000", constraint = false]\n';
            }
        }
        
        // Add weak open implications
        if(options.displayWeakOpenImplications) {
            var open = Graph.weakOpenImplications;
            for(var i=0; i<open.length; i++) {
                var from = open[i].from;
                var to = open[i].to;
                text += "\t" + '"' + from + '" -> "' + to + '" [color = "#008000", style = "dashed", constraint = false]\n';
            }
        }
        
        // Add strong open implications
        if(options.displayStrongOpenImplications) {
            var open = Graph.strongOpenImplications;
            for(var i=0; i<open.length; i++) {
                var from = open[i].from;
                var to = open[i].to;
                text += "\t" + '"' + from + '" -> "' + to + '" [color = "#ffa500", style = "dashed", constraint = false]\n';
            }
        }
        
        
        text += "}\n";
        
        return text;
    },

    
    toTikz: function(options) {
        
        var text = "";
        
        // Explanations
        text += "% Zoo generated by Zoo Viewer 1.0\n";
        text += "% https://github.com/LudovicPatey/zooviewer\n";
        text += "% You need to compile with lualatex because of the layout\n\n";
        
        // Include the latex libraries
        text += "\\usetikzlibrary{graphs, graphdrawing, shapes}\n";
        text += "\\usegdlibrary{force}\n\n";
    
        // Start the graph structure
        text += "\\tikz [\n";
        text += "\tspring layout,\n";
        text += "\tsibling distance=3cm,\n";
        text += "\tlevel distance=2cm,\n";
        text += "\tnode/.style={ellipse, draw, minimum size=2em, align=center},\n";
        text += "\tarrow/.style={draw,very thick,-latex},\n";
        text += "\timpl/.style={arrow},\n";
        text += "\tstrictimpl/.style={arrow},\n";
        text += "\tequiv/.style={arrow,latex-latex},\n";
        text += "\tnonimpl/.style={arrow},\n";
        text += "\tweakopenimpl/.style={arrow},\n";
        text += "\tstrongopenimpl/.style={arrow}\n";
        text += "] {\n";
        
        
        // Add nodes
        var nodes = Graph.nodes;
        text += "\n\t% Nodes\n";
        for(var key in nodes) {
            text += "\t\\node[node] (" + this.toTexKey(key) + ") {" + this.toGoodLabel(nodes[key].label) + "};\n";
        }
        
        // Add implications
        text += "\n\t% Implications\n";
        var impls = Graph.strongImplications;
        var strong = [];
        for(var i=0; i<impls.length; i++) {
            var from = impls[i].from;
            var to = impls[i].to;
            var strict = Graph.nonImplications[to] && Graph.nonImplications[to][from];
            
            if(strict) {
                strong.push({from : from, to : to });
            }
            
            
            // Display a black arrow if the implication is strict
            // And a gray one otherwise
            var color = strict ? 'strictimpl' : 'impl';;
            text += this.addArrow(color, from, to);
        }
        
        // Add equivalences
        var can = Graph.canonical;
        text += "\n\t% Equivalences\n";
        for(var id in can) {
            if(can[id] != id) {
                text += this.addArrow("equiv", can[id], id);
            }
        }
        
        // Add non-implications
        if(options.displayNonImplications) {
            text += "\n\t% Non-implications\n";
            var nonImpls = Graph.strongNonImplications;
            for(var i=0; i<nonImpls.length; i++) {
                var from = nonImpls[i].from;
                var to = nonImpls[i].to;
                
                // Display only the non-obvious non-implications
                // Basically, if A -> B and B does not imply A,
                // this is already reflected by a black arrow instead of a gray one
                var display = true;
                for(var j = 0; j<strong.length; j++) {
                    var s = strong[j];
                    if(Graph.implications[to] && Graph.implications[to][s.from] && Graph.implications[s.to] && Graph.implications[s.to][from]) {
                        display = false;
                        break;
                    }
                }
                //if(this.implications[to] && this.implications[to][from]) continue;
                if(!display) continue
                    text += this.addArrow("nonimpl", from, to);
            }
        }
        
        // Add weak open implications
        if(options.displayWeakOpenImplications) {
            text += "\n\t% Weak open implications\n";
            var open = this.weakOpenImplications;
            for(var i=0; i<open.length; i++) {
                var from = open[i].from;
                var to = open[i].to;
                text += this.addArrow("weakopenimpl", from, to);
            }
        }
        
        // Add strong open implications
        if(options.displayStrongOpenImplications) {
            text += "\n\t% Strong open implications\n";
            var open = this.strongOpenImplications;
            for(var i=0; i<open.length; i++) {
                var from = open[i].from;
                var to = open[i].to;
                text += this.addArrow("strongopenimpl", from, to);
            }
        }
        
        // End the graph structure
        text += "}\n";
        
        return text;
    },
                                                     
    addArrow : function(type, from, to) {
        return "\t\\draw (" + this.toTexKey(from) + ") edge [" + type + "] (" + this.toTexKey(to) + ");\n";
    },

    toGoodLabel: function(label) {
        return label.replace(/\\n/g, "\\\\");
    },
    
    toTexKey : function(key) {
        return key.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
};
