d3.select('body').append('p')
    .attr('id', 'favoriteNumber');

function tst()
{
    return d3.mouse(svg.node())[0] + ', '+ d3.mouse(svg.node())[1];
}

/**************************************/

var width  = 960,
    height = 500,
    colors = d3.scaleOrdinal(d3.schemeCategory10);

var svg = d3.select('body')
    .append('svg')
    .attr('oncontextmenu', 'return false;')
    .attr('width', width)
    .attr('height', height);

var nodes = [];
var links = [];

var lastNodeID = 0;


// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// Контейнер для нод
svg.append('svg:g')
    .attr('class', 'nodes');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

var edge = svg.append('svg:g').selectAll('g');
var el_node = d3.select('g.nodes').selectAll('g.node');

// mouse event vars
var selected_node = null,
    selected_link = null,
    mouse_drag = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}



function mousedown() {
    svg.classed('active', true);

    if(mousedown_node || mousedown_link) return;

    // insert new el_node at point
    var point = d3.mouse(this),
        node = {id: ++lastNodeID, reflexive: false};
    node.x = point[0];
    node.y = point[1];
    nodes.push(node);

    restart();
}

function mousemove() {
    document.getElementById('favoriteNumber').innerHTML = tst();

    if(!mousedown_node || mouse_drag) return;
    // update drag line
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if(mousedown_node) {
        // hide drag line
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');
    }

    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
    var toSplice = links.filter(function(l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
        links.splice(links.indexOf(l), 1);
    });
}


function restart(){

    // path (link) group
    edge = edge.data(links);

    // update existing links
    edge.classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


    // add new links
    var newEdge = edge.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) { return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
        .on('mousedown', function(d) {
            if(d3.event.ctrlKey) return;

            // select link
            mousedown_link = d;
            if(mousedown_link === selected_link) selected_link = null;
            else selected_link = mousedown_link;
            selected_node = null;
            restart();
        });

    // remove old links
    edge.exit().remove();

    newEdge.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });


    //d3.selectAll('g.node').remove();
    // Enter
    el_node = d3.select('g.nodes').selectAll('g.node');
    var g = el_node.data(nodes, function(d){return d.id; }).enter().append('svg:g').attr('class','node');
    createNode(g);
    // Update
    // Exit
    el_node.data(nodes).exit().remove();

    g.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}

function createNode(g) {


    g.append('svg:circle')
        .attr('class', 'el_node')
        .attr('r', 12)
        .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
        .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
        .classed('reflexive', function(d) { return d.reflexive; });


    // show el_node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) { return d.id; });

    g.append('svg:rect')
            .attr('class', 'box')
            .attr('height', '50')
            .attr('width', '80')
            .attr('x', '-40')
            .attr('y', '-25')
            .attr('stroke-width', '1')
            .attr('stroke', '#000')
            .call(d3.drag()
                .on("start", function(d){
                    mouse_drag = true;
                    d3.select(this.parentNode).raise().classed("active", true);
                })
                .on("drag", function(d){
                    d.x = d3.mouse(svg.node())[0];
                    d.y = d3.mouse(svg.node())[1];
                    d3.select(this.parentNode).attr("transform", 'translate(' + d.x + ',' + d.y + ')');
                })
                .on("end", function(d){
                    mouse_drag = false;
                    d3.select(this.parentNode).classed("active", false);
                }))
        ;

    g.append('svg:circle')
            .attr('class', 'port')
            .attr('r', '10')
            .attr('cy', '40')
            .attr('cx', '0')
            .attr('fill', '#ffc927')
            .on('mouseover', function(d) {
                if(!mousedown_node || d === mousedown_node || mouse_drag) return;
                // enlarge target el_node
                d3.select(this).attr('transform', 'scale(1.1)');
                })
            .on('mouseout', function(d) {
                if(!mousedown_node || d === mousedown_node || mouse_drag) return;
                // unenlarge target el_node
                d3.select(this).attr('transform', '');
            })
            .on('mousedown', function(d) {
                // select el_node
                mousedown_node = d;
                if(mousedown_node === selected_node) selected_node = null;
                else selected_node = mousedown_node;
                selected_link = null;

                // reposition drag line
                drag_line
                    .style('marker-end', 'url(#end-arrow)')
                    .classed('hidden', false)
                    .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

                restart();
            })
            .on('mouseup', function(d) {
                if(!mousedown_node) return;

                // needed by FF
                drag_line
                    .classed('hidden', true)
                    .style('marker-end', '');

                // check for drag-to-self
                mouseup_node = d;
                if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

                // unenlarge target el_node
                d3.select(this).attr('transform', '');

                // add link to graph (update if exists)
                // NB: links are strictly source < target; arrows separately specified by booleans
                var source, target, direction;
                if(mousedown_node.id < mouseup_node.id) {
                    source = mousedown_node;
                    target = mouseup_node;
                    direction = 'right';
                } else {
                    source = mouseup_node;
                    target = mousedown_node;
                    direction = 'left';
                }

                var link;
                link = links.filter(function(l) {
                    return (l.source === source && l.target === target);
                })[0];

                if(link) {
                    link[direction] = true;
                } else {
                    link = {source: source, target: target, left: false, right: false};
                    link[direction] = true;
                    links.push(link);
                }

                // select new link
                selected_link = link;
                selected_node = null;
                restart();
            })
        ;
}

// app starts here
svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);/*
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);*/
restart();


// Класс ноды
function WorkNode(){
    // Задача ноды

    this.createNode = function(){

    }
}
