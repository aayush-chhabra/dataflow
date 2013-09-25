( function(Dataflow) {

  var Edit = Dataflow.prototype.plugin("edit");

  Edit.initialize = function(dataflow){

    var buttons = $(
      '<div class="dataflow-plugin-edit">'+
        '<button class="selectall">Select All (A)</button><br />'+
        '<button class="cut">Cut (X)</button><br />'+
        '<button class="copy">Copy (C)</button><br />'+
        '<button class="paste">Paste (V)</button><br />'+
      '</div>'
    );

    // dataflow.addPlugin({
    //   id: "edit", 
    //   name: "edit", 
    //   menu: buttons, 
    //   icon: "edit"
    // });
    
    //
    // A
    //

    function selectAll(){
      dataflow.currentGraph.nodes.invoke("set", {selected:true});
    }
    buttons.children(".selectall").click(selectAll);
    Edit.selectAll = selectAll;

    //
    // X
    //
    
    Edit.removeSelected = function () {
      var toRemove = dataflow.currentGraph.nodes.where({selected:true});      
      _.each(toRemove, function(node){
        node.remove();
      });      
    }

    function cut(){
      // Copy selected
      copy();
      // Move back so paste in original place
      _.each(copied.nodes, function(node){
        node.x -= 50;
        node.y -= 50;
      });
      // Remove selected
      Edit.removeSelected()      
    }
    buttons.children(".cut").click(cut);
    Edit.cut = cut;
    
    

    function removeEdge(){
      var selected = dataflow.currentGraph.edges.where({selected:true});
      selected.forEach(function(edge){
        edge.remove();
      });
    }
    Edit.removeEdge = removeEdge;

    //
    // C
    //

    var copied = {};
    function copy(){
      copied = {};
      // nodes
      copied.nodes = dataflow.currentGraph.nodes.where({selected:true});
      copied.nodes = JSON.parse(JSON.stringify(copied.nodes));
      // edges
      copied.edges = [];
      dataflow.currentGraph.edges.each(function(edge){
        // Only copy the edges between nodes being copied
        var connectedSource = _.any(copied.nodes, function(node){
          return (edge.source.parentNode.id === node.id);
        });
        var connectedTarget = _.any(copied.nodes, function(node){
          return (edge.target.parentNode.id === node.id);
        });
        if (connectedSource || connectedTarget){
          copied.edges.push( JSON.parse(JSON.stringify(edge)) );
        }
      });
    }
    buttons.children(".copy").click(copy);
    Edit.copy = copy;

    //
    // V
    //

    function paste(){
      if (copied && copied.nodes && copied.nodes.length > 0) {
        // Deselect all
        dataflow.currentGraph.nodes.invoke("set", {selected:false});
        // Add nodes
        _.each(copied.nodes, function(node){
          // Offset pasted
          node.x += 50;
          node.y += 50;
          node.parentGraph = dataflow.currentGraph;
          node.selected = true;
          var oldId = node.id;
          // Make unique id
          while (dataflow.currentGraph.nodes.get(node.id)){
            node.id++;
          }
          // Update copied edges with new node id
          if (oldId !== node.id) {
            _.each(copied.edges, function(edge){
              if (edge.source.node === oldId) {
                edge.source.node = node.id;
              }
              if (edge.target.node === oldId) {
                edge.target.node = node.id;
              }
            });
          }
          var newNode = new dataflow.nodes[node.type].Model(node);
          dataflow.currentGraph.nodes.add(newNode);
          // Select new node
          newNode.view.bringToTop();
          newNode.view.highlight();
        });
        // Add edges
        _.each(copied.edges, function(edge){
          // Clone edge object (otherwise weirdness on multiple pastes)
          edge = JSON.parse(JSON.stringify(edge));
          // Add it
          edge.parentGraph = dataflow.currentGraph;
          edge.id = edge.source.node+":"+edge.source.port+"::"+edge.target.node+":"+edge.target.port;
          var newEdge = new dataflow.modules.edge.Model(edge);
          dataflow.currentGraph.edges.add(newEdge);
        });
      }
      // Rerender edges
      _.defer(function(){
        dataflow.currentGraph.view.rerenderEdges();
      });
    }
    buttons.children(".paste").click(paste);
    Edit.paste = paste;






    // Add context actions for actionbar

    dataflow.addContext({
      id: "cut",
      icon: "cut",
      label: "cut",
      action: cut,
      contexts: ["one", "twoplus"]
    });
    dataflow.addContext({
      id: "copy",
      icon: "copy",
      label: "copy",
      action: copy,
      contexts: ["one", "twoplus"]
    });
    dataflow.addContext({
      id: "paste",
      icon: "paste",
      label: "paste",
      action: paste,
      contexts: ["one", "twoplus"]
    });



    dataflow.addContext({
      id: "edgeRemove",
      icon: "cut",
      label: "remove edges",
      action: removeEdge,
      contexts: ["edge"]
    });


  };


}(Dataflow) );
