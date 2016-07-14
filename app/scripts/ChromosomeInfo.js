import d3 from 'd3';

export function ChromosomeInfo(filepath, success) {
    d3.text(filepath, (text) => {
        let data = d3.tsv.parseRows(text);
        let cumValues = [];
        let chrPositions = {};
        let totalLength = 0;

        for (let i = 0; i < data.length; i++) {
            totalLength += +data[i][1];

            let newValue = {'id': i, 'chr': data[i][0], 'pos': totalLength - +data[i][1]}

            cumValues.push(newValue);
            chrPositions[newValue.chr] = newValue;
        }

        let chromInfo = {'cumPositions': cumValues,
                         'chrPositions': chrPositions,
                          'totalLength': totalLength }



        chromInfo.genomePosToChrPos = function(genomePos) {
            // Convert a genome position (e.g. 762323234) to a chromosome position (e.g. ['chr5', 12345])
            let bisect = d3.bisector(function(d) { return d.pos; }).left;
            let bsCenter = bisect(cumValues, genomePos);

            if (bsCenter == 0)
                bsCenter += 1;
            if (bsCenter == cumValues.length)
                bsCenter -= 1;

            let chrCenter = cumValues[bsCenter-1].chr
            let centerInChrPos = Math.floor(genomePos - cumValues[bsCenter - 1].pos);

            return [chrCenter, centerInChrPos]
        }


        success(chromInfo);
    });
}
