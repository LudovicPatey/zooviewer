
var Contextual = {

    init : function() {},
    
    create : function() {
        this.update();
    },
    
    update : function() {
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
            var ul = $('<ul></ul>');
            var func = Patches["panel.contextual.property"];
            for(var key in node.properties) {
                ul.append('<li>' + func.call(this, key, node.properties[key]) + '</li>');
            }
            div.append('<h3>Properties</h3>');
            if(ul.children().length > 0) {
                div.append(ul);
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
    }
    
};
