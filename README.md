# Zoo viewer

Zoo viewer is an interactive web-based visualizer of zoos (partially ordered sets).

## Installation

The front-end is purely client-side, which means that it is ready to use by accessing the files on a web browser.
In order to add a database, simply edit the *index.html* file to add a the following line in the zoo list:

	<option value="http://url-of-the-database.json">Name of the zoo</option>

## Databases

There are currently four databases compatible with the zoo viewer.
* [The computability menagerie](https://www.math.wisc.edu/~jmiller/menagerie.json) maintained by Joe Miller
* [The reverse mathematics zoo](http://ludovicpatey.com/zooviewer/data/rmzoo.json) maintained by Eric Astor
* [The enumeration reducibility zoo](https://www.math.wisc.edu/~jmiller/e-verse.json) maintained by Joe Miller and Mariya Soskova
* [The randomness zoo](http://ludovicpatey.com/zooviewer/data/randomness.json) of Antoine Taveneaux

## Screenshot

Here is a preview of the interface with the enumeration reducibility zoo.

![Enumeration reducibility zoo](https://github.com/LudovicPatey/zooviewer/raw/master/imgs/screenshot.png)

## Database format

The whole database is in JSON. 

### Zoo

The root of the JSON object consists of two keys:

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

The *tags* key contains a list of tag keys. See the tags section to settle the possible tags. A tag is a way to classify nodes. The user will have the possibility to restrict the vertices to some tags.

> **Note:** The main difference between a tag and a property, is that a tag is supposed to be an arbitrary human classification, while a property has to be justified by a proof.

### Edge

An edge is an information related to an ordered pair (source node, destination node). It is of the form

	{
		"srcKey" : key of source node,
		"dstKey" : key of destination node,
		"properties" : {
			"property1" : Property
			...
		}
	}

Every pair of nodes has an edge, even the pairs whose source equals the destination, and representing a loop edge. Whether there will actually be an arrow or not depends on the edge kind functions (defined below) which will take a decision based on the *properties* key.

*srcKey* is the key of the source node, while *dstKey* is the key of the destination node. The *properties* key contains a dictionnary of zoo-specific properties, based on which the viewer will show an arrow or not. See below for the definition of a property.

### Property

A property represents a fact (about a node, or an edge), which has to be justified by a proof, or a reference to a proof.
It is of the form


	{
		"uid" : unique id,
		"value" : anything (null if open),
		"justification" : {
			"weight" : the weight
			"direct": string with a direct justification (with possible TeX and HTML),
			"composite" : array of property uids for a composite justification
		}
	}
	
The *uid* is a unique numerical identifier.  It is used for the composite justifications, which refer to other properties.

The *value* key contains the value of the property, or null if it is not known. 

The *justification* contains the information justifying the fact that this property has this particular value. There are two kind of justifications: the direct ones, and the composite ones. A direct justification is specified by the key *direct* which will contain a text justifying the value of the property. An obvious direct justification is specified by an empty string. A composite justification will contain an array of uids of other properties, which altogether are sufficient to justify the value of the current property. A typical composite justification is the justification of an arrow obtained by transitivity of two other arrows. Either *direct*, or *composite* must be equal to null. Moreover, *weight* equals 1 if and only if the justification is direct.



### Meta

The *meta* key in the root contains meta information, such as the coloring functions of the nodes, or the edge kinds... It is of the form

	 {
	 	"tags" : [ ... ],
		"edgeKinds" : [ ... ],
		"colorings" : [ ... ],
		"patches" : { ... }, // optional
		"about" : {
			"version" : 1, // optional
			"description" : "" // optional
		},
		"graphviz" = {
	        	"rankdir" : "TB" // optional. TB, BT, LR, RL
		}
	 }

The *tags*, *edgeKinds* and *coloring* keys contain respectively a list of tags, edge kinds, and of colorings (described below).

The *about* key is optional, and contains a dictionnary of informations about the graph. In particular, *description* contains a brief description (with possible TeX and HTML) of the database. It could basically contain some information about the zoo keeper, his email, a link to the source database, ... The *version* key should contain an integer, and is purely informative, as it is not used currently by the front-end.

The *graphviz* key contains a dictionary of options for graphviz, the rendering engine. The only option supported yet is *rankdir*, which specifies the orientation of the graph (TB for Top-Bottom, BT for Bottom-Top, LR for Left-Right and RL for... guess what).

The *patches* key is optional, and contains a dictionnary of "patches". See the patches section below.

### Tag

A tag represents a cluster of nodes. There are two kinds of tags: the static ones and the dynamical ones. The static ones are specified by a key. Any node having the tag key among its tags list will be tagged by it. A dynamical tag is specified by a filtering function. In general, a tag is of the form

	{
		"label" : "A string with possible Tex",
		"key" : "my key", // optional
		"functionBody" : "...", // optional
		"default" : true // optional
	}
	
The *label* key is the label of the tag to be displayed in the filter panel. It may contain TeX.

The *key* label is optional, and contains a short string in the case of a static tag. For a dynamical tag, the *functionBody* key must be specified, and must contain the body of a javascript function, with *node* as a free variable, and returning a boolean specifying whether the node should receive the tag or not.

The *default* key contains a boolean specifying whether or not the tag should be checked by default in the panel. In other words, it says whether the nodes tagged by this tag should be displayed by default or not.

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
		"functionBody" : "...",
		"node" : { ... } // Optional
	}

The *label* should be a short string which will be displayed in a list, so that the user can choose which edge kind to use.

The *functionBody* key contains the body of a javascript function, with *node* as a free variable. It is supposed to return 0, 1 or 2, depending on whether there is provably no arrow (return 0), there is provably an arrow (return 1), or it is currently an open question (return 2). For example, it could be

	"if(!edge.properties.implication.value == null) return 2; 
	return edge.properties.implication.value ? 1 : 0;"

Here, we suppose that the edges have an *implication* property, specifying whether the source implies the destination, and equal to null if it is unknown.

> **Important:** An edge kind should be a transitive relation. In other words, the transitive closure of the arrows should be precomputed by the JSON file.

The *node* key may contain an *Edge kind node* (see below). This information is useful only if there are multiple edge kinds. This enables the viewer to display, once fixed a pair of standard node, a graph of edge kind relations. This way, the user will be able to compare the edge kinds for which the given pair has an implication, or not.

### Edge kind node

An edge kind node is of the form

	{
		"label" : "a label which may contain some Tex",
		"key" : "a short unique string",
		"edges" : [ ... ]
	}

The *label* key is the string which will be displayed in the graph of edge kinds, when comparing two fixed standard nodes over various edge kinds. It may contain some TeX.

The *key* key is a short string which is unique among the edge kinds. This is used for the edges relation.

The *edges* key contains a list of other edge kind keys. There is an arrow from an edge kind to another edge kind if having an implication of the first kind implies having an implication of the second kind. The relation between edge kinds in not transitive.

### Patch

There are some places in the front-end were the zookeeper needs to replace the standard formatting functions by some custom functions. A patch is a javascript function specified in the JSON database, and which will replace a function in the front-end. It is part of the dictionary *patches* of the *meta* key. It is of the form

	"patches" : {
		"patch key" : "function body"
	}

There are a few patch keys, whose extensive list is available in [scripts/tools/patches.js](https://github.com/LudovicPatey/zooviewer/raw/master/scripts/tools/patches.js). The value is a string of a javascript function body whose free variables are the same as the corresponding function in [scripts/tools/patches.js]. The original function is available at "patch key.original". For example, you can set

	"patches" : {
		"panel.contextual.property" : "var ret = Patches['panel.contextual.property.original'].call(this, key, property); return 'customized ' + ret;"
	}

This patch will add the prefix "customized " to every property description in the contextual panel. 

## Credits

This visualizer has many inspirations.
The whole story started with the computability diagram of Bjørn Kjos-Hanssen available [here](http://www.math.wisc.edu/~jmiller/Menagerie/bn1g.pdf). Joe Miller developped a command line tool for managing a subset of the computability diagram, and extracting the open questions, among others. The [computability menagerie](http://menagerie.math.wisc.edu/) was born. Mushfeq Khan created a web interactive visualizer of the computability menagerie. Damir Dzhafarov modified the command line tool of the computability menagerie to create a [reverse mathematics zoo](http://rmzoo.math.uconn.edu). This [tool](http://rmzoo.math.uconn.edu) was largely rewritten and improved by Eric Astor. Last, facing the need of a new scalable and generalized visualiser, Joe Miller and Ludovic Patey designed a new interactive interface.

Many people have helped with the various zoos, by commenting on the code, contributing facts, suggesting new features, or just expressing their interest. Thanks in particular to David Belanger, Peter Cholak, Stephen Flood, Denis Hirschfeldt, Steffen Lempp, Antonio Montalbán, Carl Mummert, Sam Sanders, Mariya Soskova and Ted Slaman.
