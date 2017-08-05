# Zoo viewer

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

> The linear order is used by the viewer whenever it needs to choose between equivalent nodes which one is *primary*. Given a group of equivalent nodes, the one with smallest uid is chosen as priulary.

The *label* is a short string with with possible TeX and '\n' for multiline labels. It specifies the label of the vertex to be displayed in the graph. A longer string which possible TeX is provided by *definition*.

The *properties* key contains a dictionary of properties (to be defined later), which are zoo-specific. For example, in a human zoo, the properties might be the age, or the profession.

The *tags* key contains a list of tags. A tag is nothing but a string used to classify nodes. The user will have the possibility to restrict the vertices to some tags. 

> The main difference between a tag and a property, is that a tag is supposed to be an arbitrary human classification, while a property has to be justified by a proof.

### Property

TODO


### Meta

TODO
