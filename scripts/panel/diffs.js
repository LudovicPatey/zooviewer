
var Diffs = {

    diffs : null,
    
    init : function() {},
    
    create : function() {
        var urlData = Tools.getUrlData();
        this.diffs = {
            implications: [],
            separations: []
        };
        if(urlData.diffs) {
            this.diffs = urlData.diffs;
        }
        this.dataToPanel();
    },
    
    addEdge : function(kind, type, from, to) {
        this.diffs[type].push({
          kind : kind,
          from : from.key,
          to : to.key
        });
        Tools.updateUrlData({ diffs : this.diffs });
        this.dataToPanel();
        Zoo.newGraph({
          select : {
            keepSelection: true
          }
        });
    },
    
    removeEdge : function(type, i) {
        var diffs = this.diffs[type];
        i = parseInt(i);
        diffs.splice(diffs.indexOf(i), 1);
        Tools.updateUrlData({ diffs : this.diffs });
        this.dataToPanel();
        Zoo.newGraph({
            select : {
                keepSelection: true
            }
        });
    },
    
    dataToPanel: function() {
        var n = $('.local_modifications + *');
        if(this.diffs.implications.length == 0 && this.diffs.separations.length == 0) {
            n.replaceWith('<p>You have not made any local modification yet. Select nodes, right-click'
                          + ' and choose "Add arrows" to add implications or separations.</p>');
        }
        else {
            var ul = $('<ul></ul>');
            n.replaceWith(ul);
            for(var i=0; i<this.diffs.implications.length; i++) {
                var diff = this.diffs.implications[i];
                ul.append('<li><label><input type="checkbox" checked="checked" onchange="Diffs.removeEdge(\'implications\', ' + i + ')" /> '
                          + diff.from + ' implies ' + diff.to + ' by the relation "'
                          + Zoo.meta.edgeKinds[diff.kind].label + '"</label></li>');
            }
            for(var i=0; i<this.diffs.separations.length; i++) {
                var diff = this.diffs.separations[i];
                ul.append('<li><label><input type="checkbox" checked="checked" onchange="Diffs.removeEdge(\'separations\', ' + i + ')" /> '
                          + diff.from + ' does not imply ' + diff.to + ' by the relation "'
                          + Zoo.meta.edgeKinds[diff.kind].label + '"</label></li>');
            }
        }
    },
        
    clear: function() {
        this.diffs = {
            implications: [],
            separations: []
        };
        Tools.updateUrlData({ diffs : this.diffs });
        this.dataToPanel();
        Zoo.newGraph({
            select : {
                keepSelection: true
            }
        });
    }
};
