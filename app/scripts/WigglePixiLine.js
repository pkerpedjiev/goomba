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
    var trackH = 50;
    var shownT = {};


    function tileId(tile) {
        // uniquely identify the tile with a string
        return tile.join(".") + '.' + tile.mirrored;
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

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                d.stage.addChild(pMain);

                d.pMain = pMain;

            }

            if (!('chartType' in d)) {
                d.chartType = "line";
            }
            

                

            function redrawTile() {
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));


                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                .range([0, 1]);

                
                let reset = function(){
                    xPoints = [];
                    yPoints = [];
                    tileIDs = [];
                }
                

                let drawTile = function(graphics, tile) {

                    //console.log('drawing tile:', tile.tileId, xScale.domain(), xScale.range());
                    let tileData = loadTileData(tile.data);

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
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
                        graphics.beginFill(0xFF700B, 1);
                    } else if(d.chartType == "heatmap") {
                        color=d3.scale.linear()
                            .domain([0,1])
                            .range(["red","blue"]);
                    }
                    
                    
                   
                    /** if rect */
                    //graphics.lineStyle(0, 0x0000FF, 1);
                   // graphics.beginFill(0xFF700B, 1);
                    let j = 0;

                    for (let i = 0; i < tileData.length; i++) {


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
                            graphics.drawCircle(xScale(tileXScale(i+1))*d.scale, d.height - d.height*yScale(tileData[i+1]), 1);
                            
                              
                        } else if(d.chartType == "heatmap"){

                           // if (height > 0 && width > 0) {
                                if(color(height).replace("#","0x") == null){
                                    console.log("this is why im broken")
                                }
                                graphics.beginFill(color(height).replace("#","0x"), 1);
                                graphics.drawRect(xPos, 0, width, d.height);
                                graphics.endFill();
                            //}
                            
                        } 
                       // if (height > 0 && width > 0) {
                         //   graphics.drawRect(xPos, yPos, width, height);
                       // }
                       /** if circle */
                     //  

                       xPoints.push(xPos);
                       //yPoints.push(50 - 50*height);
                      // yPoints.push(d.height - d.height*height);
                       yPoints.push(height);

                       /** if line */
                       

                        
                    }
                    graphics.endFill(); 
                    //console.log(xPoints);
                }


                

                let shownTiles = {};
                shownT = {};
                let k = 0;
                for (let i = 0; i < tileData.length; i++) {
                    shownTiles[tileData[i].tileId] = true;
                    shownT[tileData[i].tileId] = true;

                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                        
                        if(k == 0){
                           reset();
                           k++; 
                        }
                         
                         let newGraphics = new PIXI.Graphics();
                         //drawTileLine(newGraphics, tileData[i]);
                         drawTile(newGraphics, tileData[i]);
                         d.pMain.addChild(newGraphics);
                         tileIDs.push(tileData[i].tileId);
                         d.tileGraphics[tileData[i].tileId] = newGraphics
                    } 
                }

                for (let tileIdStr in d.tileGraphics) {
                    if (!(tileIdStr in shownTiles)) {
                        //we're displaying graphics that are no longer necessary,
                        //so we need to get rid of them
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
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
                redraw();
                
            }

            $("#mode input[name=type]").change(function () { 
    
                var selectedChartType = $("#mode input[name=type]:checked").val();
                d.chartType = selectedChartType;
                redraw();
               // zoomChanged(d.translate, d.scale, d.chartType);
                
            });

            function redraw(){
                d.pMain.clear();
                d.pMain.position.x = d.translate[0];
                for (let tileIdStr in d.tileGraphics) {
                    if ((tileIdStr in shownT)) {
                        //we're displaying graphics that are no longer necessary,
                        //so we need to get rid of them
                        d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                        delete d.tileGraphics[tileIdStr];
                    }
                }
                
                d.pMain.removeChild(d.tileGraphics[1000]);
                delete d.tileGraphics[1000];

                let graphics = new PIXI.Graphics();
                let color;

                if(d.chartType == "bar"){
                    
                    graphics.lineStyle(0, 0x0000FF, 1);
                    graphics.beginFill(0xFF700B, 1);

                } else if(d.chartType == "line" || d.chartType == "point"){

                    graphics.lineStyle(1, 0x0000FF, 1);
                    
                } else if(d.chartType == "heatmap") {
                     color=d3.scale.linear()
                            .domain([0,1])
                            .range(["red","blue"]);
                }

                let j = 0;
                    //console.log("xpoints" +xPoints.length);
                let width = Math.round(xPoints[1]*d.scale-xPoints[0]*d.scale);

                for(let i = 0; i < xPoints.length-1; i++){
                    d.pMain.scale.x = 1;
                    if (d.chartType == "line"){
                        if(Math.abs(Math.round(xPoints[i+1]*d.scale-xPoints[i]*d.scale) - width) > 3) { 
                            graphics.lineStyle(0, 0xFF0000, 1);
                        } else {
                            graphics.lineStyle(1, 0x0000FF, 1);       
                        }
                        if(j == 0){
                            graphics.moveTo(xPoints[i]*d.scale, d.height-yPoints[i]*d.height);
                            j++;
                        }

                        graphics.lineTo(xPoints[i+1]*d.scale, d.height-yPoints[i+1]*d.height);
                    } else if (d.chartType == "point"){
                        graphics.drawCircle(xPoints[i]*d.scale, d.height-yPoints[i]*d.height, 1);
                           
                    } else if(d.chartType == "bar"){
                        graphics.beginFill(0xFF700B, 1);
                        graphics.drawRect(xPoints[i], d.height-yPoints[i]*d.height, xPoints[i+1]-xPoints[i], d.height*yPoints[i]);
                        graphics.endFill();

                    } else if(d.chartType == "heatmap"){
                        graphics.beginFill(color(yPoints[i]).replace("#","0x"), 1);
                        graphics.drawRect(xPoints[i], 0, xPoints[i+1]-xPoints[i], d.height);
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

                if(d.chartType == "bar"|| d.chartType == "heatmap"){
                    d.pMain.scale.x = scale;
                    sizeChanged();
                    return;
                }
                
                d.pMain.clear();
                let divider = 1000;
                if(scale < 8) {
                    divider = 1000;
                } else if(scale >= 8 && scale < 10000){
                    divider = 100;
                }  else{
                    divider = 1/100;
                }

                if(Math.round(d.preScale*divider) != Math.round(scale*divider)&& scale < 100000){
                //if()
               // console.log("im redrawing")
                 //   d.pMain.scale.x = 1;
                    for (let tileIdStr in d.tileGraphics) {
                        if ((tileIdStr in shownT)) {
                            //we're displaying graphics that are no longer necessary,
                            //so we need to get rid of them
                            d.pMain.removeChild(d.tileGraphics[tileIdStr]);
                            delete d.tileGraphics[tileIdStr];
                        }
                    }
                    d.pMain.removeChild(d.tileGraphics[1000]);
                    delete d.tileGraphics[1000];

                    let graphics = new PIXI.Graphics();
                    graphics.lineStyle(1, 0x0000FF, 1);
                    let j = 0;
                    //console.log("xpoints" +xPoints.length);
                    let width = Math.round(xPoints[1]*scale-xPoints[0]*scale);

                    for(let i = 0; i < xPoints.length-1; i++){
 

                        if (d.chartType == "line"){
                            if(Math.abs(Math.round(xPoints[i+1]*scale-xPoints[i]*scale) - width) > 3) { 
                                graphics.lineStyle(0, 0xFF0000, 1);
                            } else {
                                graphics.lineStyle(1, 0x0000FF, 1);       
                            }
                            if(j == 0){
                                graphics.moveTo(xPoints[i]*scale, d.height-yPoints[i]*d.height);
                                j++;
                            }
                            
                            graphics.lineTo(xPoints[i+1]*scale, d.height-yPoints[i+1]*d.height);
                          //  if(yPoints[i+1] != 50 || yPoints[i+1] != 0)
                            //console.log("("+(xPoints[i+1]*scale)+", "+yPoints[i+1]+")");
                        } else {
                            graphics.drawCircle(xPoints[i]*scale, d.height-yPoints[i]*d.height, 1);
                               
                        }
                        

                    }
                  
                    
                    
                    
                    graphics.endFill();
                    d.pMain.addChild(graphics);

                    d.tileGraphics[1000] = graphics;
                  //  console.log("added a child")
                } else{
                   // d.pMain.scale.x = 1+d.preScale-scale;
                }                   

                sizeChanged();
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
