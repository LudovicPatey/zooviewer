
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
    }

};
