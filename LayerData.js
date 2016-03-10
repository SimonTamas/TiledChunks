var TiledChunks;
(function (TiledChunks) {
    var LayerData = (function () {
        function LayerData(_name, _batchLayer, _emptyID, _collision, _trigger) {
            this.name = _name;
            this.emptyID = _emptyID || 0;
            this.batch = _batchLayer || false;
            this.isCollisionLayer = _collision || false;
            this.isTriggerLayer = _trigger || false;
        }
        LayerData.prototype.SetTiles = function (_tileList) {
            this.tileDatas = [];
            var id;
            for (var r = 0; r < _tileList.length; r++) {
                this.tileDatas[r] = [];
                for (var c = 0; c < _tileList[r].length; c++) {
                    id = _tileList[r][c];
                    if (id != this.emptyID)
                        this.tileDatas[r][c] = new TiledChunks.TileData(id);
                }
            }
            id = null;
        };
        LayerData.prototype.GetChunkLayer = function (_chunk) {
            var chunkTileDatas = [];
            if (this.tileDatas) {
                var id;
                var tileRow;
                var tileColumn;
                for (var rowOffset = 0; rowOffset < _chunk.map.data.chunkTileRows; rowOffset++) {
                    chunkTileDatas[rowOffset] = [];
                    for (var columnOffset = 0; columnOffset < _chunk.map.data.chunkTileColumns; columnOffset++) {
                        tileRow = (_chunk.row * _chunk.map.data.chunkTileRows) + rowOffset;
                        tileColumn = (_chunk.column * _chunk.map.data.chunkTileColumns) + columnOffset;
                        if (this.tileDatas[tileRow] && this.tileDatas[tileRow][tileColumn]) {
                            id = this.tileDatas[tileRow][tileColumn].id;
                            if (id != this.emptyID)
                                chunkTileDatas[rowOffset][columnOffset] = new TiledChunks.TileData(id);
                            else
                                chunkTileDatas[rowOffset][columnOffset] = null;
                        }
                    }
                }
                id = null;
                tileRow = null;
                tileColumn = null;
            }
            return new TiledChunks.ChunkLayer(_chunk, this, chunkTileDatas);
        };
        return LayerData;
    })();
    TiledChunks.LayerData = LayerData;
})(TiledChunks || (TiledChunks = {}));
