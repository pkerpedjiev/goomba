import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WigglePixiLine() {
    let width = 200;//200
    let height = 15;//15
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;  
    let pixiStage = null;
    let inD = 0;
    var xPoints;
    var yPoints;
    var tileIDs;
    let m = 0;
    var trackH = 50;
    var shownT = {};

    
    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.tileId;
       // return tile.join(".") + '.' + tile.mirrored;
    }

    function loadTileData(tile_value) {
        if ('dense' in tile_value)
            return tile_value['dense'];
        else if ('sparse' in tile_value) {
            let values = Array.apply(null, 
                    Array(resolution)).map(Number.prototype.valueOf,0);
            for (let i = 0; i < tile_value.sparse.length; i++) {
                if ('pos' in tile_value.sparse[i])
                    values[ tile_value.sparse[i].pos[0]] = tile_value.sparse[i].value;
                else
                    values[ tile_value.sparse[i][0]] = tile_value.sparse[i][1];

            }
            return values;

        } else {
            return [];
        }

    }

    let chart = function(selection) {
        selection.each(function(d) {
            inD += 1;

            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize') : resizeDispatch;
            }

            if (!('loadedTiles' in d))
            {
                d.loadedTiles = [];
            }

            if (!('translate' in d)) {
                d.translate = [0,0]; 
            }

            if (!('scale' in d)) {
                d.scale = 1;
            }

            if (!('tileGraphics' in d)) {
                d.tileGraphics = {};
            }

            if (!('pixiStage' in d)) {
                d.stage = pixiStage; 
            }

            if (!('preScale' in d)) {
                d.preScale = 1; 
            }

            if (!('preHeight' in d)) {
                d.preHeight = d.height; 
            }

            if (!('totalWidth' in d)) {
                d.totalWidth = 0; 
            }

            if (!('shownT' in d)) {
                d.shownT = {}; 
            }           


            /*if (!('axis' in d)) {
                d.svg = "";
                d.y = "";
                d.yAxis = "";
            } */

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                d.stage.addChild(pMain);
                
                
                d.pMain = pMain;
                

            }


            if (!('chartType' in d)) {
                d.chartType = "line";
            }

            if (!('maxValue' in d)) {
                let tileData = d3.select(this).selectAll('.tile-g').data();
                
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));
                d.maxValue = maxVisibleValue;
            }


            if (!('onchange' in d)) {
                $("#mode input[name=type]").change(function () { 
    
                    var selectedChartType = $("#mode input[name=type]:checked").val();
                    d.chartType = selectedChartType;

                    
                    redraw();
                
                
                }); 
              //  let tileData = d3.select(this).selectAll('.tile-g').data();
                
                //let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));
                var ticks = Math.floor(d.height/10)-2;
                d.y = d3.scale.linear().domain([0, d.maxValue])
                .range([d.height,0]);
               // .range([100,0])

                d.yAxis = d3.svg.axis()
                .ticks(ticks)
                .orient("right") 
                .scale(d.y);
                d.w = $(this).css("width");
                d.w = parseInt(d.w, 10);
                d.svg = d3.select(this).append("svg").attr("id","svg").attr("height",d.height+10).style("margin-top","-5px").attr("viewBox", "0 -5 "+ d.w + " " + (d.height+10));
                //svg = d3.select(this).append("svg").attr("height",100);
                d.svg.append("g").attr("class", "y axis")/*.style("margin-top","5px")*/; 
                d.svg.select('g.y.axis').call(d.yAxis); 


                $(this).mousemove(function(e) { 

                    $("#tooltip").empty();
                    $('#tooltip').hide();
                   // var parentOffset = $(this).parent().offset();
                    var $div = $('.track');
                    var mouse = {x:e.clientX,y:e.clientY};
                    var top = $(this).css("top");
                    top = parseInt(top, 10);
                    var div = {x:$div.offset().left - $(window).scrollLeft(),y:$div.offset().top - $(window).scrollTop()};
               
                    let xPos = xScale.invert((mouse.x - div.x - d.translate[0])/d.scale);
                    let tileX, length, index, val;
                    let maxVisibleValue, ypos;
                    if(mouse.y-div.y-top > (d.height+5)){
                        
                        d.pMain.removeChild(d.tileGraphics[10]);
                        if(d.tileGraphics[10] != null){
                           d.tileGraphics[10].destroy();
                        }
                        delete d.tileGraphics[10];

                        return;
                    }
                    for(let tileId in d.shownT) {
                
                        var substring = tileId.split("/");
                        
                        length = d.totalWidth/Math.pow(2, parseInt(substring[0]));
                       // console.log(length);
                        //tile's starting point
                        tileX = length*parseInt(substring[1]);
                        //console.log(tileX);
                        if(xPos >= tileX && xPos < tileX+length){
                            //d.loadedTiles[tileId];  

                            index = Math.floor((xPos - tileX)/length * 256);
                            val = d.loadedTiles[tileId][index]; 
                           // maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));
                            
                            if(val != null){
                                $('#tooltip').show();
                                $("#tooltip").css('top', (e.pageY+10)+'px');
                                $("#tooltip").css('left', (e.pageX+10)+'px');

                                $("#tooltip").append("<span>The value at " + Math.floor(xPos) + " is " + Math.floor(val*100)/100 + ".</span>");
                                 d.pMain.removeChild(d.tileGraphics[10]);
                                // d.hover.removeChild(d.tileGraphics[10]);
                                    if(d.tileGraphics[10] != null){
                                       d.tileGraphics[10].destroy();
                                    }
                                    delete d.tileGraphics[10];
                                    let graphics = new PIXI.Graphics();
                                    ypos = val/d.maxValue;
                                if(d.chartType == "line" || d.chartType == "point"){
                                    
                                    //graphics.lineStyle(1, 0xFF0000, 1);
                                    graphics.beginFill(0xFF0000);
                                    
                                    graphics.drawRect(Math.floor((mouse.x - div.x)-d.translate[0]-2)-1, d.height-d.height*ypos-1, 3,3);
                                    graphics.endFill();
                                } else if(d.chartType == "bar"){
                                    graphics.beginFill(0xFF0000);
                                   // graphics.beginFill(0xC0C0C0);
                                    graphics.drawRect(Math.floor((mouse.x - div.x)-d.translate[0])/d.scale, d.height-d.height*ypos, xScale(length/256),d.height*ypos);
                                    graphics.endFill();
                                 //   d.hover.addChild(graphics);
                                }
                                d.pMain.addChild(graphics);
                                    
                                d.tileGraphics[10] = graphics;


                            }
                            
                        }
                        

                    }
                   // console.log($(this).css("top"));
                }); 

                $(this).mouseleave(function(e) {
                    $('#tooltip').empty();
                    $('#tooltip').hide();
                    d.pMain.removeChild(d.tileGraphics[10]);
                                    if(d.tileGraphics[10] != null){
                                       d.tileGraphics[10].destroy();
                                    }
                                    delete d.tileGraphics[10];
                });
                   //m++;
                //}
                d.onchange = true;
            }

    
            if (!('xPoints' in d)) {
                d.xPoints = [];
            }            

            if (!('yPoints' in d)) {
                d.yPoints = [];
            }                  


            function redrawTile() {
               // console.log("redraw called");
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));
                d.maxValue = maxVisibleValue;

                


                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                //.domain([0, maxVisibleValue])
                .range([0, 1]);

                d.y.domain([0, maxVisibleValue]); 
                d.svg.select('g.y.axis').call(d.yAxis);

                let reset = function(){
                    d.xPoints = [];
                    d.yPoints = [];
                    tileIDs = [];
                }
                

                let drawTile = function(graphics, tile) {


                    let tileData = [];

                    if(tileId(tile) in d.loadedTiles)
                    {
                        tileData = d.loadedTiles[tileId(tile)];
                    }
                    else
                    {
                        tileData = loadTileData(tile.data);
                        d.loadedTiles[tileId(tile)] = tileData;
                    }

                    //console.log('drawing tile:', tile.tileId, xScale.domain(), xScale.range());
                    //let tileData = loadTileData(tile.data);

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    d.totalWidth = tile.xRange[1] - tile.xRange[0];
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    let tileXScale = d3.scale.linear().domain([0, tileData.length])
                    .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                    let color;

                    /** if line*/
                    if(d.chartType == "line" || d.chartType == "point"){
                        graphics.lineStyle(1, 0x0000FF, 1);
                    } else if(d.chartType == "bar") {
                        graphics.lineStyle(0, 0x0000FF, 1);
                        //graphics.beginFill(0xFF700B, 1);
                        graphics.beginFill(0xA9A9A9, 1);
                    } else if(d.chartType == "heatmap") {
                        color=d3.scale.linear()
                            .domain([0,1])
                            .range(["white","black"]);
                    }
                    
                    let j = 0;
                    
                    for (let i = 0; i < tileData.length; i++) {
                        //console.log(tileXScale(i));

                        let xPos = xScale(tileXScale(i));
                        //let yPos = -(d.height - yScale(tileData[i]));
                        let yPos = -1; //-(d.height - yScale(tileData[i]));
                        let height = yScale(tileData[i])
                        let width = xScale(tileXScale(i+1)) - xScale(tileXScale(i));

                        /** if rect */
                        if(d.chartType == "bar"){
                            if (height > 0 && width > 0) {
                                graphics.drawRect(xPos, d.height - d.height*height, width, d.height*height);
                            }
                            
                        } else if (d.chartType == "line"){
                            if(j == 0){
                                graphics.moveTo(xPos*d.scale, d.height - d.height*height);
                                j++;
                            }
                            graphics.lineTo(xScale(tileXScale(i+1))*d.scale, d.height - d.height*yScale(tileData[i+1]));
                            
                        } else if(d.chartType == "point"){
                            graphics.drawRect(xScale(tileXScale(i+1))*d.scale, d.height - d.height*yScale(tileData[i+1]), 1, 1);
                            
                              
                        } else if(d.chartType == "heatmap"){

                          
                                
                                graphics.beginFill(color(height).replace("#","0x"), 1);
                                graphics.drawRect(xPos, 0, width, d.height);
                                graphics.endFill();
                            
                            
                        } 

                       d.xPoints.push(xPos);
                       d.yPoints.push(height);

                       /** if line */
                       

                        
                    }
                    graphics.endFill(); 
                    //console.log(xPoints);
                   
                }


                

                let shownTiles = {};
                d.shownT = {};
                let k = 0;

              
              //  var text = new PIXI.Text(maxVisibleValue,{font : '11px Arial', fill : 0x000000, align : 'center'});
                for (let i = 0; i < tileData.length; i++) {
                    shownTiles[tileData[i].tileId] = true;
                    d.shownT[tileData[i].tileId] = true;

                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                        
                        if(k == 0){
                           reset();
                           k++; 
                        }
                         
                         let newGraphics = new PIXI.Graphics();                        
                        
                         drawTile(newGraphics, tileData[i]);
                         
                         d.pMain.addChild(newGraphics);
                         tileIDs.push(tileData[i].tileId);
                         d.tileGraphics[tileData[i].tileId] = newGraphics
                    } 
                }
              //   d.pMain.addChild(text);
               // console.log(d.xPoints);

                for (let tileIdStr in d.tileGraphics) {
                    if (!(tileIdStr in shownTiles)) {
                        //we're displaying graphics that are no longer necessary,
                        //so we need to get rid of them
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                        d.tileGraphics[tileIdStr].destroy();
                        delete d.tileGraphics[tileIdStr];
                    }
                }
            }

            redrawTile.bind(this)();

            let localResizeDispatch = d.resizeDispatch;
            //console.log('localResizeDispatch', d.resizeDispatch);

            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {
                d.pMain.position.y = d.top;
                //redraw();
                
                if(d.preHeight != d.height){
                    d.y.range([d.height,0]);
                    //$("#svg").height(d.height);
                    if(Math.floor(d.height/10)-2 < 15 && Math.floor(d.height/10)-2 > 0){
                        d.yAxis.ticks(Math.floor(d.height/10)-2);
                    }
                    
                    d.svg.attr("height", d.height+10);
                    d.svg.attr("viewBox", "0 -5 "+ d.w + " " + (d.height+10))
                    d.svg.select('g.y.axis').call(d.yAxis);

                    redraw();
                }

                d.preHeight = d.height;
            }

            
            function redraw(){
               // svg.select("g.y.axis").call(yAxis);
                d.pMain.clear();
                d.pMain.position.x = d.translate[0];
                for (let tileIdStr in d.tileGraphics) {
                    if ((tileIdStr in d.shownT)) {
                        //we're displaying graphics that are no longer necessary,
                        //so we need to get rid of them
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                        d.tileGraphics[tileIdStr].destroy();
                        delete d.tileGraphics[tileIdStr];
                    }
                }
                
                d.pMain.removeChild(d.tileGraphics[1000]);
                if(d.tileGraphics[1000] != null){
                   d.tileGraphics[1000].destroy();
                }
                
                delete d.tileGraphics[1000];

                let graphics = new PIXI.Graphics();
                let color;

                if(d.chartType == "bar"){
                    
                    graphics.lineStyle(0, 0x0000FF, 1);
                   // graphics.beginFill(0xFF700B, 1);
                   graphics.beginFill(0xA9A9A9, 1);

                } else if(d.chartType == "line" || d.chartType == "point"){

                    graphics.lineStyle(1, 0x0000FF, 1);
                    
                } else if(d.chartType == "heatmap") {
                     color=d3.scale.linear()
                            .domain([0,1])
                            .range(["white","black"]);
                }

                //tile set info

                let j = 0;
                    //console.log("xpoints" +xPoints.length);
                let width = Math.round(d.xPoints[1]*d.scale-d.xPoints[0]*d.scale);

                for(let i = 0; i < d.xPoints.length; i++){
                    d.pMain.scale.x = 1;
                    if (d.chartType == "line"){
                        if(Math.abs(Math.round(d.xPoints[i+1]*d.scale-d.xPoints[i]*d.scale) - width) > 3) { 
                            graphics.lineStyle(0, 0xFF0000, 1);
                        } else {
                            graphics.lineStyle(1, 0x0000FF, 1);       
                        }
                        if(j == 0){
                            graphics.moveTo(d.xPoints[i]*d.scale, d.height-d.yPoints[i]*d.height);
                            j++;
                        }

                        graphics.lineTo(d.xPoints[i+1]*d.scale, d.height-d.yPoints[i+1]*d.height);
                    } else if (d.chartType == "point"){
                        graphics.drawRect(d.xPoints[i]*d.scale, d.height-d.yPoints[i]*d.height, 1, 1);
                           
                    } else if(d.chartType == "bar"){
                        //graphics.beginFill(0xFF700B, 1);
                        graphics.beginFill(0xA9A9A9, 1);
                        graphics.drawRect(d.xPoints[i], d.height-d.yPoints[i]*d.height, d.xPoints[i+1]-d.xPoints[i], d.height*d.yPoints[i]);
               

                        graphics.endFill();

                    } else if(d.chartType == "heatmap"){
                        graphics.beginFill(color(d.yPoints[i]).replace("#","0x"), 1);
                        graphics.drawRect(d.xPoints[i], 0, d.xPoints[i+1]-d.xPoints[i], d.height);
                        graphics.endFill();
                       
                        
                    }


                    
                    
                    
                    graphics.endFill();
                    d.pMain.addChild(graphics);

                    d.tileGraphics[1000] = graphics;
                    
                }

                if(d.chartType == "bar"|| d.chartType == "heatmap"){
                    d.pMain.scale.x = d.scale;
                    
                }
               // console.log("redrew");
                

            }

            function zoomChanged(translate, scale) {
                d.translate = translate;
                d.scale = scale;
                

                d.pMain.position.x = d.translate[0];

                if(d.chartType == "bar" || d.chartType == "heatmap"){
                    d.pMain.scale.x = scale;
                    return;
                }
                
                let divider = 1000;
                if(scale < 8) {
                    divider = 1000;
                } else {
                    divider = 100;
                } 

                d.pMain.clear();

                if(Math.round(d.preScale*divider) != Math.round(scale*divider)){

                    d.pMain.scale.x = 1;
                    for (let tileIdStr in d.tileGraphics) {
                        if ((tileIdStr in d.shownT)) {
                            //we're displaying graphics that are no longer necessary,
                            //so we need to get rid of them
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            d.tileGraphics[tileIdStr].destroy();
                            delete d.tileGraphics[tileIdStr];
                        }
                    }
                    d.pMain.removeChild(d.tileGraphics[1000]);
                    if(d.tileGraphics[1000] != null){
                       d.tileGraphics[1000].destroy();
                    }
                    delete d.tileGraphics[1000];

                    let graphics = new PIXI.Graphics();
                    graphics.lineStyle(1, 0x0000FF, 1);
                    let j = 0;
                    //console.log("xpoints" +xPoints.length);
                    let width = Math.round(d.xPoints[1]*scale-d.xPoints[0]*scale);

                    for(let i = 0; i < d.xPoints.length; i++){
 

                        if (d.chartType == "line"){
                          
                            if(Math.abs(Math.round(d.xPoints[i+1]*scale-d.xPoints[i]*scale) - width) > 3) { 
                                graphics.lineStyle(0, 0xFF0000, 1);
                            } else {
                                graphics.lineStyle(1, 0x0000FF, 1);       
                            }
                            if(j == 0){
                                graphics.moveTo(d.xPoints[i]*scale, d.height-d.yPoints[i]*d.height);
                                j++;
                            }
                                graphics.lineTo(d.xPoints[i+1]*scale, d.height-d.yPoints[i+1]*d.height);
                            
                        } else {
                            
                                graphics.drawRect(d.xPoints[i]*scale, d.height-d.yPoints[i]*d.height, 1, 1);
                         //   if(xPoints[i]*scale > (-translate[0])){
                               // graphics.visible = true;
                           // } else{
                      //          console.log("not drawing a circle");
                                //graphics.visible = false;
                            // }
                            
                               
                        }
                        

                    }
                  
                    
                    
                    
                    graphics.endFill();
                    d.pMain.addChild(graphics);

                    d.tileGraphics[1000] = graphics;
                  //  console.log("added a child")
                } else{
                    d.pMain.scale.x = 1+d.preScale-scale;
                }                   

             //   sizeChanged();
                d.preScale = scale;
            }

            sizeChanged();
        });
    }
 
    chart.width = function(_) {
        if (!arguments.length) return width;
        else width = _;
        return chart;
    }

    chart.height = function(_) {
        if (!arguments.length) return height;
        else height = _;
        return chart;
    }

    chart.resizeDispatch = function(_) {
        if (!arguments.length) return resizeDispatch;
        else resizeDispatch = _;
        return chart;
    }

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        else xScale = _;
        return chart;
    }

    chart.zoomDispatch = function(_) {
        if (!arguments.length) return zoomDispatch;
        else zoomDispatch = _;
        return chart;
    }

    chart.pixiStage = function(_) {
        if (!arguments.length) return pixiStage;
        else pixiStage = _;
        return chart;
    }

    return chart;
}
