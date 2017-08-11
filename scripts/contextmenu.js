
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
        
        // Compute colorings menu
        var nodeColorings = [];
        for(var i=0; i<Zoo.meta.colorings.length; i++) {
            var coloring = Zoo.meta.colorings[i];
            if(coloring.selection) continue;
            (function(i) {
             var selected = i == Zoo.meta.selectedColoring;
                nodeColorings.push({
                   title: coloring.label,
                   uiIcon : selected ? 'ui-icon ui-menu-icon ui-icon-check' : null,
                   action: function() {
                        Zoo.changeColoring(i)
                   }
                });
            })(i);
        }
        
        // Compute tags menu
        var tags = [];
        for(var i=0; i<Zoo.meta.tags.length; i++) {
            var tag = Zoo.meta.tags[i];
            (function(i) {
             var selected = Filter.filters.tags.indexOf(i) != -1 ? 'checked="checked"' : '';
             var label = $('#tags label[name=' + i + '] .wrapper').html();
             tags.push({
                title: label,
                uiIcon : selected ? 'ui-icon ui-menu-icon ui-icon-check' : null,
                action: function() {
                   var tags = Filter.filters.tags;
                   if(selected) {
                       tags.splice(tags.indexOf(i), 1);
                   }
                   else {
                       tags.push(i);
                   }
                   Filter.applyTagRestrictions(true, tags);
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
                {
                    title: "local modifications",
                    action: function() { Zoo.clearLocalModifications() },
                    disabled: !$('#zoo .local_modifications + *').is('ul')
                }
                                         
            ]},
            {title: "----"},
            {title: "Show only tags", children : tags},
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
        
        // Compute a list of possible database additions
        var sels = Select.getSelectionList();
        var add = [];
        for(var i=0; i<sels.length; i++) {
            var from = sels[i];
            for(var j=0; j<sels.length; j++) {
                var to = sels[j];

                // Don't add arrows if the link is already determined
                if(i == j) continue;
                if(Graph.implications[from.key] && Graph.implications[from.key][to.key]) continue;
                if(Graph.nonImplications[from.key] && Graph.nonImplications[from.key][to.key]) continue;
                (function(from, to) {
                 
                    add.push({
                         title : "implication from " + from.key + " to " + to.key,
                         action: function() {
                             Zoo.addEdge(Zoo.meta.selectedEdgeKind, "implications", from, to);
                         }
                    });
                    add.push({
                          title : "separation from " + from.key + " to " + to.key,
                          action: function() {
                          Zoo.addEdge(Zoo.meta.selectedEdgeKind, "separations", from, to);
                          }
                    });
                })(from, to);
                
            }
        }
        

        return [
            {title: "Justify", children : [
                {title: "properties of this node", action: function() {
                Proofs.showProperties(data);
                }, disabled: !hasProperties},
                {title: "arrows between the selected nodes", action: function() {
                Proofs.showArrows(Select.getSelectionList());
                }, disabled: !multipleSelected}
            ]},
            {title: "Add arrow", children : add, disabled: add.length == 0},
            {title: "Exclude nodes", children : [
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
