var TiledChunks;
(function (TiledChunks) {
    var ChunkLayer = (function () {
        function ChunkLayer(_chunk, _layer, _tileDatas) {
            this.chunk = _chunk;
            this.layer = _layer;
            this.mapLayer = this.chunk.map.GetLayer(this.layer.name);
            this.drawn = false;
            this.tiles = [];
            var id;
            var tile;
            for (var cR = 0; cR < _chunk.map.data.chunkTileRows; cR++) {
                this.tiles[cR] = [];
                for (var cC = 0; cC < _chunk.map.data.chunkTileColumns; cC++) {
                    if (_tileDatas[cR] && _tileDatas[cR][cC] != null) {
                        tile = new TiledChunks.Tile(this, cC, cR, _tileDatas[cR][cC]);
                        this.tiles[cR][cC] = tile;
                    }
                }
            }
            id = null;
            tile = null;
        }
        ChunkLayer.prototype.DrawLayer = function () {
            if (this.drawn)
                return;
            this.drawn = true;
            var tile;
            for (var r = 0; r < this.tiles.length; r++) {
                for (var c = 0; c < this.tiles[r].length; c++) {
                    tile = this.tiles[r][c];
                    if (tile)
                        tile.DrawTile(this);
                }
            }
        };
        ChunkLayer.prototype.EraseLayer = function () {
            if (this.drawn) {
                this.drawn = false;
                var tile;
                for (var r = 0; r < this.tiles.length; r++) {
                    for (var c = 0; c < this.tiles[r].length; c++) {
                        tile = this.tiles[r][c];
                        if (tile)
                            tile.EraseTile(this);
                    }
                }
            }
        };
        return ChunkLayer;
    })();
    TiledChunks.ChunkLayer = ChunkLayer;
})(TiledChunks || (TiledChunks = {}));
