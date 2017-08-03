
var Contextmenu = {
    
    // Init for each graph
    init: function() {
        $(document).contextmenu({
            delegate: "svg, .node",
            autoFocus: false,
            preventContextMenuForPopup: true,
            preventSelect: true,
            taphold: true,
            menu: [],
            beforeOpen: function(event, ui) {
                var target = ui.target.closest('svg, .node');
                if(target.is('svg')) {
                    $(document).contextmenu('replaceMenu', Contextmenu.createGlobalMenu());
                }
                else {
                    var data = target.data('data');
                    $(document).contextmenu('replaceMenu', Contextmenu.createNodeMenu(data));
                }
            }
        });

    },
    
    createGlobalMenu: function() {
       return [
         {title: "Unselect all", action: function() { Select.unselectAll(); } },
        {title: "Extract the graph as an image", action: function() { Graph.downloadAsImage(); } }
               ];
    },
    
    createNodeMenu : function(data) {
        Select.select(data);
        var hasProperties = false;
        for(var key in data.properties) {
            if(data.properties[key].value !== null) {
                hasProperties = true; break;
            }
        }
        
        var multipleSelected = Select.getSelectionList().length > 1;

        return [
            {title: "Justify properties of this node", action: function() {
            Proofs.showProperties(data);
            }, disabled: !hasProperties},
            {title: "Justify arrows between the selected nodes", action: function() {
            Proofs.showArrows(Select.getSelectionList());
            }, disabled: !multipleSelected},
            {title: "----"},
            {title: "Exclude this node", action: function() {
            Filter.applyExclusion([data]);
            }},
            {title: "Exclude the selected nodes", action: function() {
            Filter.applyExclusion(Select.getSelectionList());
            }},
            {title: "Restrict to nodes in between the selected nodes", action: function() {
            Filter.applyComparable(Select.getSelectionList());
            }},
            {title: "----"},
            {title: "Unselect all but this node", action: function() {
            Select.unselectAll(); Select.select(data);
            } }];
    }
    
};
