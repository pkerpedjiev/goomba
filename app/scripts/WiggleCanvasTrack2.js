import PIXI from 'pixi.js';
import slugid from 'slugid';
import d3 from 'd3';

export function WiggleCanvasTrack2() {
    let width = 200;
    let height = 15;
    let resizeDispatch = null;
    let xScale = d3.scale.linear();
    let zoomDispatch = null;
    let resolution = 256;
    let pixiStage = null;
    let inD = 0;

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
    var first = 0;
    CanvasJS.addColorSet("constant", ["#3385ff"]); 
    var canvasChart = new CanvasJS.Chart("chartContainer", {
                colorSet: "constant",

                title:{
                    text:"Canvas Bar Wiggle"              

                }, 
                dataPointMinWidth: 3,
                axisX: {
                        viewportMinimum: 0,
                        viewportMaximum: 448,
                        lineThickness:0,
                        tickThickness:0,
                        valueFormatString: " "
                        //min , max
                },
                axisY:{
                    maximum: 1.2,
                    minimum: 0,
                    valueFormatString: " ",
                    gridThickness: 0,
                    //lineThickness:0,
                    //tickThickness:0

                },
               // data: {
                 //   type: "line",
                   // dataPoints: []
                //}
            });

    let chart = function(selection) {
        selection.each(function(d) {

//            let chart; 
            var yValues = [];
            var chartType = "column";

            inD += 1;

            if (!('resizeDispatch' in d)) {
                d.resizeDispatch = resizeDispatch == null ? d3.dispatch('resize') : resizeDispatch;
            }

            if (!('translate' in d)) {
                d.translate = [0,0];
            }

            if (!('chartType2' in d)) {
                d.chartType2 = "line";
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

            if (!('pMain' in d)) {

                let pMain = new PIXI.Graphics();
                d.stage.addChild(pMain);

                d.pMain = pMain;

            }
           
            


            function drawCanvas(canvasData, colorRange, axisX) {

                CanvasJS.addColorSet("heatmap", colorRange);
            /*    if(first == 0) {
                    console.log("first " + first)
                    chart.options.data = canvasData;
                    console.log(chart.options.data[0]);
                    first++;
                } else {
                    console.log("chart option");
                    console.log(chart.options.data[0]);
                }*/
                canvasChart.options.colorSet = "heatmap";
                canvasChart.options.data = canvasData;
                canvasChart.options.axisX = axisX;
                //chart.options.data[0].type = d.chartType2;
                canvasChart.render();

               
            }

            $("#mode input[name=type]").change(function () { 
                if($("#mode input[name=type]:checked").val() == "heatmap"){
                    canvasChart.options.data[0].type = "column";
                    d.chartType2 = "column";
                    for(let i= 0; i <canvasChart.options.data[0].dataPoints.length; i++){
                        canvasChart.options.data[0].dataPoints[i].y = 1;
                    }
                    canvasChart.options.colorSet = "heatmap";
                    canvasChart.render();
                } else{

                    var selectedChartType = $("#mode input[name=type]:checked").val();
                    canvasChart.options.data[0].type = selectedChartType;

                    d.chartType2 = selectedChartType;
                    for(let i= 0; i <canvasChart.options.data[0].dataPoints.length; i++){
                        canvasChart.options.data[0].dataPoints[i].y = yValues[i];
                    }
                    canvasChart.options.colorSet = "constant";
                    canvasChart.render();
                }
            });

            function redrawTile() {
                console.log("redraw is called, arrays are emptied");
                let tileData = d3.select(this).selectAll('.tile-g').data();
                let minVisibleValue = Math.min(...tileData.map((x) => x.valueRange[0]));
                let maxVisibleValue = Math.max(...tileData.map((x) => x.valueRange[1]));

                let yScale = d3.scale.linear()
                .domain([0, maxVisibleValue])
                .range([0, 1]);

                let canvasData = [];
                let canvasDatapoints = [];
                yValues = [];
                let colorRange = [];


                let color=d3.scale.linear()
                    .domain([0,1])
                    .range(["red","blue"]);

                let drawTile = function(graphics, tile) {
                    //console.log('drawing tile:', tile.tileId, xScale.domain(), xScale.range());
                    let tileData = loadTileData(tile.data);

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    let tileXScale = d3.scale.linear().domain([0, tileData.length])
                    .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                    graphics.lineStyle(0, 0x0000FF, 1);
                    graphics.beginFill(0xFF700B, 1);

                    let j = 0;
                    for (let i = 0; i < tileData.length - 1; i++) {
                        let xPos = xScale(tileXScale(i));
                        //let yPos = -(d.height - yScale(tileData[i]));
                        let yPos = -1; //-(d.height - yScale(tileData[i]));
                        let height = yScale(tileData[i]);
                        let width = xScale(tileXScale(i+1)) - xScale(tileXScale(i));

                        //DRAWING RECTS
                        //if (height > 0 && width > 0) {
                          //  graphics.drawRect(xPos, yPos, width, height);
                        //}
                       if(j == 0){
                            graphics.moveTo(xPos, 1 - height);
                            j++;
                        }

                        graphics.lineTo(xScale(tileXScale(i+1)), 1 - yScale(tileData[i+1]));

                    }


                }

                let index = 0;
                let retrieveData = function(tile){

                    let tileData = loadTileData(tile.data);

                    let tileWidth = (tile.xRange[1] - tile.xRange[0]) / Math.pow(2, tile.tilePos[0]);
                    // this scale should go from an index in the data array to 
                    // a position in the genome coordinates
                    let tileXScale = d3.scale.linear().domain([0, tileData.length])
                    .range([tile.xRange[0] + tile.tilePos[1] * tileWidth, 
                           tile.xRange[0] + (tile.tilePos[1] + 1) * tileWidth]  );

                    let width2 = xScale(tileXScale(1)) - xScale(tileXScale(0)); 
                    
                    for (let i = 0; i < tileData.length; i++) {
                  //      canvasChart.options.data[0].dataPoints[index] = { y: yScale(tileData[i]),x: xScale(tileXScale(i)) };
                        index++;
                        let height = yScale(tileData[i])
                        let width = xScale(tileXScale(i+1)) - xScale(tileXScale(i));


                            canvasDatapoints.push({
                                y: yScale(tileData[i]),
                                x: xScale(tileXScale(i)) 
                            });
                            yValues.push(yScale(tileData[i]));
                            colorRange.push(color(yScale(tileData[i])));
                        
                    }
                   
                }

             //   canvasChart.options.data[0].dataPoints = [];
                let shownTiles = {};
                for (let i = 0; i < tileData.length; i++) {
                    shownTiles[tileData[i].tileId] = true;

                    /** load data for canvas */
                    retrieveData(tileData[i]);

                    if (!(tileData[i].tileId in d.tileGraphics)) {
                        // we don't have a graphics object for this tile
                        // so we need to create one
                         let newGraphics = new PIXI.Graphics();
                         drawTile(newGraphics, tileData[i]);
                         d.pMain.addChild(newGraphics)
                         d.tileGraphics[tileData[i].tileId] = newGraphics
                    } 
                }
                canvasChart.render();
                //console.log("canvasDatapoints: " + canvasDatapoints.length);
                canvasData.push({
                    type: d.chartType2,  
                    dataPoints: canvasDatapoints
                });

                //console.log("canvasData: " + canvasData.length);*/

               let axisX;
                axisX = {
                        viewportMinimum: -d.translate[0]/d.scale,
                        viewportMaximum: 448/d.scale - d.translate[0]/d.scale,
                        lineThickness:0,
                        tickThickness:0,
                        valueFormatString: " "
                        //min , max
                }

                //canvasChart.options.data = [];
                //canvasChart.render();
                
                
                drawCanvas(canvasData, colorRange, axisX);

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

            let slugId = slugid.nice();
            localResizeDispatch.on('resize.' + slugId, sizeChanged);

            let localZoomDispatch = zoomDispatch == null ? d3.dispatch('zoom') : zoomDispatch;
            localZoomDispatch.on('zoom.' + slugId, zoomChanged);

            function sizeChanged() {

                d.pMain.position.y = d.top;
                d.pMain.scale.y = d.height;
            }

            function zoomChanged(translate, scale) {

                if(canvasChart != null) {
                    canvasChart.options.axisX.viewportMinimum = -translate[0]/scale; 
                    canvasChart.options.axisX.viewportMaximum = 448/scale - translate[0]/scale;
                    canvasChart.render();
                }

                d.translate = translate;
                d.scale = scale;

                d.pMain.scale.x = scale;
                d.pMain.position.x = d.translate[0];

                sizeChanged();
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