var TiledChunks;
(function (TiledChunks) {
    var MapData = (function () {
        function MapData(_worldWidth, _worldHeight, _viewportWidth, _viewportHeight, _chunkTileRows, _chunkTileColumns, _tileWidth, _tileHeight, _tiledMap, _usedLayers, _tilesets) {
            this.wordWidth = _worldWidth;
            this.worldHeight = _worldHeight;
            this.viewportWidth = _viewportWidth;
            this.viewportHeight = _viewportHeight;
            this.tileWidth = _tileWidth;
            this.tileHeight = _tileHeight;
            this.chunkTileRows = _chunkTileRows;
            this.chunkTileColumns = _chunkTileColumns;
            this.chunkWidth = _chunkTileColumns * _tileWidth;
            this.chunkHeight = _chunkTileRows * _tileHeight;
            this.chunkColumns = this.wordWidth / this.chunkWidth;
            this.chunkRows = this.worldHeight / this.chunkHeight;
            this.tileCountX = this.chunkColumns * this.chunkTileColumns;
            this.tileCountY = this.chunkRows * this.chunkTileRows;
            this.CalculateNeededChunkCacheSizes();
            this.layers = _usedLayers;
            var uL;
            var tiles;
            for (var l = 0; l < _tiledMap["layers"].length; l++) {
                for (var u = 0; u < this.layers.length; u++) {
                    uL = this.layers[u];
                    if (uL.name == _tiledMap["layers"][l]["name"]) {
                        uL.SetTiles(this.ListToMatrix(_tiledMap["layers"][l]["data"]));
                    }
                }
            }
            this.tilesets = _tilesets;
            var foundTileset;
            var dummyTileset;
            for (var t = 0; t < _tiledMap["tilesets"].length; t++) {
                foundTileset = false;
                var from = _tiledMap["tilesets"][t]["firstgid"];
                var count = _tiledMap["tilesets"][t]["tilecount"];
                var customProperties = _tiledMap["tilesets"][t]["tileproperties"];
                for (var s = 0; s < this.tilesets.length; s++) {
                    if (this.tilesets[s].name == _tiledMap["tilesets"][t]["name"]) {
                        foundTileset = true;
                        this.tilesets[s].fromID = from;
                        this.tilesets[s].toID = from + count;
                        this.tilesets[s].properties = customProperties;
                    }
                }
                if (!foundTileset) {
                    dummyTileset = new TiledChunks.Tileset(_tiledMap["tilesets"][t]["name"], null);
                    dummyTileset[s].fromID = from;
                    dummyTileset[s].toID = from + count;
                    dummyTileset[s].properties = customProperties;
                    this.tilesets.push(dummyTileset);
                }
            }
            foundTileset = null;
            dummyTileset = null;
        }
        MapData.prototype.ListToMatrix = function (list) {
            var matrix = [], i, k;
            for (i = 0, k = -1; i < list.length; i++) {
                if (i % this.tileCountX === 0) {
                    k++;
                    matrix[k] = [];
                }
                matrix[k].push(list[i]);
            }
            return matrix;
        };
        MapData.prototype.GetTextureKeyForId = function (_tileID) {
            return this.GetTilesetForId(_tileID).textureKey;
        };
        MapData.prototype.GetTilesetForId = function (_tileID) {
            var i = 0;
            while (i < this.tilesets.length) {
                if (this.tilesets[i].fromID <= _tileID && _tileID < this.tilesets[i].toID) {
                    return this.tilesets[i];
                }
                i++;
            }
        };
        MapData.prototype.GetFrameForId = function (_tileID) {
            return this.GetTilesetForId(_tileID).GetFrameFromId(_tileID);
        };
        MapData.prototype.CalculateNeededChunkCacheSizes = function () {
            var foundWidth = 0;
            var foundHeight = 0;
            var needWidth = (this.viewportWidth - this.chunkWidth) / 2;
            var needHeight = (this.viewportHeight - this.chunkHeight) / 2;
            while (needWidth > foundWidth)
                foundWidth += this.chunkWidth;
            while (needHeight > foundHeight)
                foundHeight += this.chunkHeight;
            this.chunkNeedCacheHorizontal = Math.ceil(foundWidth / this.chunkWidth);
            this.chunkNeedCacheVertical = Math.ceil(foundHeight / this.chunkHeight);
        };
        return MapData;
    })();
    TiledChunks.MapData = MapData;
})(TiledChunks || (TiledChunks = {}));
