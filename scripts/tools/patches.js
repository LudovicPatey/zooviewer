
var Patches = {

    
    init: function(patches) {
        var patches = patches || {};
        for(var key in patches) {
            if(!this[key]) alert('Database error : the patch key "' + key +'" does not exist');
            
            // This is a dynamic way to define a function with the same formal parameters
            // as the original function
            var previous = this[key];
            var originalSource = previous.toString();
            var newSource = originalSource.substr(0, originalSource.indexOf("{") + 1) + patches[key] + "}";
            this[key + ".original"] = originalSource;
            eval('this[key] = ' + newSource);
        }
        
    },
    
    "panel.contextual.property" : function(key, property) {
        if(property.description) return property.description;
        var value = property.value;
        switch(value) {
            case true: value = 'true'; break;
            case false: value = 'false'; break;
            case null : value = 'unknown'; break;
        }
        return '<span class="dt">' + key + '</span><span class="dd">' + value + '</span>';
        
    },
    
    "window.proofs.property" : function(key, property) {
        return Patches["panel.contextual.property"];
    }
};
