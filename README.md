# Zoo viewer

## Databases

There are currently three databases compatible with the zoo viewer.
* [The computability menagerie](https://www.math.wisc.edu/~jmiller/menagerie.json) maintained by Joe Miller
* [The reverse mathematics zoo](http://ludovicpatey.com/zooviewer/data/rmzoo.json) maintained by Eric Astor
* [The enumeration reducibility zoo](https://www.math.wisc.edu/~jmiller/e-verse.json) maintained by Joe Miller and Mariya Soskova

## Database format

The whole database is in JSON. 

### Zoo

The root JSON contains a pair

    {
		"nodes" : { "key1" : node1, "key2" : node2, ... },
		"meta" : { ... }
    }

The *nodes* key contains a *dictionary* of nodes, that is, a map of keys to nodes, which defines the graph model.
The *meta* key specifies meta information, such as the coloring functions of the nodes, or some rendering options.

### Node

A node is a vertex in the graph. It is a pet in the zoo. It has the following shape:

	{
		"uid" : unique id,
	    	"label" : string,
	    	"definition" : longer string (with possible TeX),
		"edges": {
			"key1" : Edge
			"key2" : Edge
		},
		"properties" : {
			"property1" : Property
			...
		},
		"tags" : [ "tag1", "tag2", ... ]
	}

The *uid* is a unique numerical identifier.  It gives the nodes a linear order structure. 

> **Note:** The linear order is used by the viewer whenever it needs to choose between equivalent nodes which one is *primary*. Given a group of equivalent nodes, the one with smallest uid is chosen as priulary.

The *label* is a short string with with possible TeX and '\n' for multiline labels. It specifies the label of the vertex to be displayed in the graph. A longer string which possible TeX is provided by *definition*.

The *edges* key contains a dictionary of edges, whose keys are the node keys of the destination. 

> **Note:** There should be a key for every destination node, even for the source node. An edge does not mean that an arrow is supposed to be displayed. It is supposed to contain various properties, from which the viewer will decide whether it should display an arrow or not.

The *properties* key contains a dictionary of properties (to be defined later), which are zoo-specific. For example, in a human zoo, the properties might be the age, or the profession.

The *tags* key contains a list of tags. A tag is nothing but a string used to classify nodes. The user will have the possibility to restrict the vertices to some tags. 

> **Note:** The main difference between a tag and a property, is that a tag is supposed to be an arbitrary human classification, while a property has to be justified by a proof.

### Edge

TODO

### Property

TODO


### Meta

The *meta* key in the root contains meta information, such as the coloring functions of the nodes, or the edge kinds... It is of the form

	 {
		"edgeKinds" : [ ... ],
		"colorings" : [ ... ],
		"graphviz" = {
	        	"rankdir" = "TB" // optional. TB, BT, LR, RL
		}
	 }

The *edgeKinds* and *coloring* keys contain respectively a list of edge kinds, and of colorings (described below).

The *graphviz* key contains a dictionary of options for graphviz, the rendering engine. The only option supported yet is *rankdir*, which specifies the orientation of the graph (TB for Top-Bottom, BT for Bottom-Top, LR for Left-Right and RL for... guess what).

### Coloring

	{
		"label" : "Name of the coloring",
		"colors" : [
			{ "color" : "lightblue", "label" : "Explanation 1" },
			{ "color" : "lightgreen", "label" : "Explanation 2" },
			...
		],
		"coloring" : "..."
	}

The *label* is the name of the coloring, to be displayed as a list, so that the user can choose which coloring to use.

The *colors* key contains a list of colors that the coloring function might output. A color is specified by some HTML color, and a label which will be displayed in the legend of the graph.

The *coloring* key must contain the body of a javascript function, with *node* as a free variable, and returning a color. For example, it could be

	"return node.properties.age.value > 5 ? 'lightblue' : 'lightgreen'"

### Edge kind

A same set of nodes might be related to each other by various kind of relations. An edge kind represents a kind of relation. For example, in reverse mathematics, one might consider implication over RCA, or the Weihrauch reduction.

	{
		"label" : "Name of the edge kind",
		"functionBody" : "if(!edge.properties.implication || edge.properties.implication.value == null) return 2; return edge.properties.implication.value ? 1 : 0;"
	}

The *label* should be a short string which will be displayed in a list, so that the user can choose which edge kind to use.

The *functionBody* key contains the body of a javascript function, with *node* as a free variable. It is supposed to return 0, 1 or 2, depending on whether there is provably no arrow (return 0), there is provably an arrow (return 1), or it is currently an open question (return 2). For example, it could be

	"if(!edge.properties.implication.value == null) return 2; 
	return edge.properties.implication.value ? 1 : 0;"

Here, we suppose that the edges have an *implication* property, specifying whether the source implies the destination, and equal to null if it is unknown.

## Credit

This visualizer has many inspirations.
The whole story started with the computability diagram of Bjørn Kjos-Hanssen available [here](http://www.math.wisc.edu/~jmiller/Menagerie/bn1g.pdf). Joe Miller developped a command line tool for managing a subset of the computability diagram, and extracting the open questions, among others. The [computability menagerie](http://menagerie.math.wisc.edu/) was born. Mushfeq Khan created a web interactive visualizer of the computability menagerie. Damir Dzhafarov modified the command line tool of the computability menagerie to create a [reverse mathematics zoo](http://rmzoo.math.uconn.edu). This [tool](http://rmzoo.math.uconn.edu) was largely rewritten and improved by Eric Astor. Last, facing the need of a new scalable and generalized visualiser, Joe Miller and Ludovic Patey designed a new interactive interface.

Many people have helped with the various zoos, by commenting on the code, contributing facts, suggesting new features, or just expressing their interest. Thanks in particular to David Belanger, Peter Cholak, Stephen Flood, Denis Hirschfeldt, Steffen Lempp, Antonio Montalbán, Carl Mummert, Sam Sanders, Mariya Soskova and Ted Slaman.
