
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
        var nodeColorings = [];
        for(var i=0; i<Zoo.meta.colorings.length; i++) {
            var coloring = Zoo.meta.colorings[i];
            if(coloring.selection) continue;
            (function(i) {
             var selected = i == Zoo.meta.selectedColoring;
                nodeColorings.push({
                   title: coloring.label,
                                   className: 'ui-icon-check',
                                   uiIcon : selected ? 'ui-icon ui-menu-icon ui-icon-check' : null,
                   action: function() {
                        Zoo.changeColoring(i)
                   }
                });
            })(i);
        }
        
        
       return [
            {title: "Unselect all", action: function() { Select.unselectAll(); } },
            {title: "Clear", children : [
                {
                    title: "tag restrictions",
                    action: function() { Filter.applyTagRestrictions(false, []) },
                    disabled: !$('#filter .restrict_tags h3 input').is(':checked')
                },
                {
                    title: "interval restrictions",
                    action: function() { Filter.applyComparable(false, [], false) },
                    disabled: !$('#filter .restrict_comparable h3 input').is(':checked')
                },
                {
                    title: "nodes exclusions",
                    action: function() { Filter.applyExclusion(false, []) },
                    disabled: !$('#filter .exclude_nodes h3 input').is(':checked')
                },
            ]},
            {title: "----"},
            {title: "Color nodes", children : nodeColorings},
            {title: "View arrows", children : [
               {
                    title: "non-implications",
                    uiIcon: $('.arrow.nonimpl').prev().is(':checked') ? 'ui-icon ui-menu-icon ui-icon-check' : null,
                    action: function() { $('.arrow.nonimpl').prev().click(); }
               },
               {
                    title: "weak open implications",
                    uiIcon: $('.arrow.weakopen').prev().is(':checked') ? 'ui-icon ui-menu-icon ui-icon-check' : null,
                    action: function() { $('.arrow.weakopen').prev().click(); }
               },
               {
                    title: "strong open implications",
                    uiIcon: $('.arrow.strongopen').prev().is(':checked') ? 'ui-icon ui-menu-icon ui-icon-check' : null,
                    action: function() { $('.arrow.strongopen').prev().click(); }
               }
            ]},
            {title: "----"},
            {title: "Export to", children : [
                {title: "SVG image (recommended)", action: function() { Export.outputSVG(); }},
                {title: "PNG image", action: function() { Export.outputPNG(); }},
                {title: "Tikz graph", action: function() { Export.outputTikz(); }},
                {title: "DOT file", action: function() { Export.outputDot(false); }},
                {title: "DOT file with TeX labels", action: function() { Export.outputDot(true); }}
            ] }
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
            {title: "Justify", children : [
                {title: "properties of this node", action: function() {
                Proofs.showProperties(data);
                }, disabled: !hasProperties},
                {title: "arrows between the selected nodes", action: function() {
                Proofs.showArrows(Select.getSelectionList());
                }, disabled: !multipleSelected}
            ]},
            {title: "Exclude", children : [
                {title: "this node", action: function() {
                Filter.applyExclusion(true, [data]);
                }},
                {title: "the selected nodes", action: function() {
                Filter.applyExclusion(true, Select.getSelectionList());
                }}
            ]},
            {title: "Restrict to", children : [
                {title: "nodes in between the selected nodes", action: function() {
                        Filter.applyComparable(true, Select.getSelectionList(), true);
                }},
               {title: "nodes provably in between the selected nodes", action: function() {
               Filter.applyComparable(true, Select.getSelectionList(), true);
               }}
            ]},
            {title: "Unselect all but this node", action: function() {
            Select.unselectAll(); Select.select(data);
            } }];
    }
    
};
