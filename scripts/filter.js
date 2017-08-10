
var Filter = {
    
    filters: null,
    
    // Init once for all
    init: function() {
        
        // Show and hide filter parts according to whether or not
        // the checkbox is checked
        $('#panel h3 input').change(function() {
            var node = $(this).parent().parent().parent().find('> p, > div');
            if($(this).is(':checked')) {
                node.show('blind', {'direction': 'up'});
            }
            else {
                node.hide('blind', {'direction': 'up'});
            }
        });
        
    },
    
    initDatabase: function() {
        
        var tags = [];
        for(var i=0; i<Zoo.meta.tags.length; i++) {
            if(Zoo.meta.tags[i]["default"]) {
                tags.push(i);
            }
        }
        
        this.filters = {
            restrictToTags: true,
            tags: tags,
            comparableOptions: {
                provably: false,
                inBetween: true
            },
            restrictToComparable: false,
            comparableList: [],
            excludeElements: false,
            exclusionList: []
        };
        
        var node = $('#filter');
        $('input:checkbox', node).prop('checked', false);
        $('input:checkbox:first', node).prop('checked', true);
        $('input:checkbox', node).trigger('change');
        
        this.initTags();
        
        var urlData = Zoo.getUrlData();
        if(urlData.filters) {
            this.filters = urlData.filters;
            this.filters.comparableList = Zoo.keysToNodes(this.filters.comparableList);
            this.filters.exclusionList = Zoo.keysToNodes(this.filters.exclusionList);
            this.dataToPanel();
        }
    },
    
    // Init the filter panel
    // Call it once per database
    initTags: function() {
        var tagNode = $('#tags');
        tagNode.empty();
        for(var i=0; i<Zoo.meta.tags.length; i++) {
            var tag = Zoo.meta.tags[i];
            var checked = this.filters.tags.indexOf(i) != -1 ? 'checked="checked"' : '';
            tagNode.append('<label name="' + i + '"><input type="checkbox" ' + checked + ' /> ' + tag.label + '</label>');
        }
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, tagNode.get(0)]);

    },
    
    // Update the panel to correspond to Filter.filters
    dataToPanel: function(callback) {
        var f = this.filters;
        
        var restrictToTagsNode = $('#filter .restrict_tags h3 input');
        $('#filter .restrict_tags #tags label').each(function() {
            $('input', this).prop('checked', f.tags.indexOf(parseInt($(this).attr('name'))) != -1);
         });
        restrictToTagsNode.prop('checked', f.restrictToTags);
        restrictToTagsNode.trigger('change');
        
        var restrictToComparableNode = $('#filter .restrict_comparable h3 input');
        var nodes = $('#filter .restrict_comparable .nodes');
        $('#filter .restrict_comparable .provably_comparable input').prop('checked', f.comparableOptions.provably);
        nodes.empty();
        this.addNodesToList(nodes, f.comparableList);
        restrictToComparableNode.prop('checked', f.restrictToComparable);
        restrictToComparableNode.trigger('change');

        var excludeElementsNode = $('#filter .exclude_nodes h3 input');
        var nodes = $('#filter .exclude_nodes .nodes');
        nodes.empty();
        this.addNodesToList(nodes, f.exclusionList);
        excludeElementsNode.prop('checked', f.excludeElements);
        excludeElementsNode.trigger('change');
    },
    
    // Update Filter.filters from the panel
    panelToData: function() {
        var f = this.filters;
        
        // Restrict to nodes tagged by any of a list
        f.tags = [];
        f.restrictToTags =  $('#filter .restrict_tags h3 input').is(':checked');
        $('#filter .restrict_tags #tags input:checked').each(function() {
            f.tags.push(parseInt($(this).parent().attr('name')));
         });
        
        // Restrict to nodes comparable with a list
        f.comparable = [];
        f.comparableOptions = {};
        f.restrictToComparable =  $('#filter .restrict_comparable h3 input').is(':checked');
        f.comparableOptions.provably = $('#filter .restrict_comparable .provably_comparable input').is(':checked');
        f.comparableOptions.inBetween = true;
        $('#filter .restrict_comparable .nodes li').each(function() {
             f.comparableList.push($(this).data('node'));
        });
        
        
        // Exclude the elements of the exclusion list
        f.exclusionList = [];
        f.excludeElements = $('#filter .exclude_nodes h3 input').is(':checked');
        $('#filter .exclude_nodes .nodes li').each(function() {
            f.exclusionList.push($(this).data('node'));
        });
    },
    
    // Update Filter.filters from the panel
    // And refresh the graph
    applyFilter: function() {
        Zoo.disablePanel();
        this.panelToData();
        
        var urlData = Zoo.getUrlData();
        urlData.filters = $.extend({}, this.filters);
        urlData.filters.comparableList = Zoo.nodesToKeys(urlData.filters.comparableList);
        urlData.filters.exclusionList = Zoo.nodesToKeys(urlData.filters.exclusionList);
        Zoo.setUrlData(urlData);
        
        Select.unselectAll();
        Zoo.newGraph();
    },
    
    // Remove an element from the list in the panel
    // Does not affect Filter.filters
    removeItem: function(item) {
        $(item).closest('li').remove();
    },
    
    addNodesToList: function(content, list) {
        for(var i=0; i<list.length; i++) {
            var key = Tools.escapeChars(list[i].key);
            // Avoid duplicata
            if(content.find('[key="' + key + '"]').length) continue;
            
            // Add the element to the list
            var li = $('<li key="' + key + '" class="toAdd"><input type="checkbox" checked="checked" onchange="Filter.removeItem(this)" /></li>');
            li.data('node', list[i]);
            content.append(li);
        }
        Zoo.getNodesSize(list, function() {
            for(var i=0; i<list.length; i++) {
                var key = Tools.escapeChars(list[i].key);
                var li = content.find('[key="' + key + '"].toAdd');
                li.append($('.MathJax_SVG > *', list[i].div).clone());
                li.removeClass('toAdd');
            }
        });

    },
    
    // Add the selected nodes to the list in the panel.
    // Does not affect Filter.filters
    addToList: function(obj) {
        var content = $(obj).closest('div').find('.nodes'); //'#filter .restrict_comparable .nodes');
        var sel = Select.getSelectionList();
        this.addNodesToList(content, sel);
    },
    
    applyTagRestrictions: function(active, tags) {
        var f = this.filters;
        f.restrictToTags = active;
        f.tags = tags;
        this.dataToPanel();
        this.applyFilter();
    },
    
    applyComparable: function(active, comparable, provably) {
        var f = this.filters;
        f.comparableOptions.provably = provably;
        f.restrictToComparable = active;
        f.comparableList = comparable;
        this.dataToPanel();
        this.applyFilter();
    },
    
    // Restrict further the current graph by excluding a list of nodes
    // With immediate application
    applyExclusion: function(active, exclusion) {
        var f = this.filters;
        f.excludeElements = active;
        f.exclusionList = f.exclusionList.concat(exclusion);
        this.dataToPanel();
        this.applyFilter();
    },

    
};
