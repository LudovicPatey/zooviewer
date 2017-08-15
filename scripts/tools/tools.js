
var Tools = {

    // Transform a string into a safe html hascode
    escapeChars: function(str) {
        return btoa(str).replace(/=/g, '_equals_');
    },
    
    // Transforms the label into a multiline latex array
    toTex: function(label) {
        if(label[0] == '$') {
            label = label.substring(1);
        }
        else {
            label = '$' + label;
        }
        if(label[label.length-1] == '$') {
            label = label.substring(0, label.length-1);
        }
        else {
            label = label + '$';
        }
        label = label.replace(/\$([^\$]+)\$/g, '\\mbox{$1}');
        label = label.replace(/\\n/g, '}\\\\[-5pt]\\mbox{');
        return '$\\begin{array}{c}' + label + '\\end{array}$';
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
            Tools.computingSize = false;
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
    
    updateUrlData: function(obj) {
        var data = this.getUrlData();
        data = $.extend(data, obj);
        this.setUrlData(data);
    }

};
