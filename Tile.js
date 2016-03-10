var TiledChunks;
(function (TiledChunks) {
    var Tile = (function () {
        function Tile(_chunkLayer, _offsetX, _offsetY, _data) {
            this.chunkLayer = _chunkLayer;
            this.data = _data;
            this.chunkColumn = _offsetX;
            this.chunkRow = _offsetY;
            var tileX = _chunkLayer.chunk.x + (_offsetX * this.chunkLayer.chunk.map.data.tileWidth);
            var tileY = _chunkLayer.chunk.y + (_offsetY * this.chunkLayer.chunk.map.data.tileHeight);
            this.point = new Phaser.Point(tileX, tileY);
            this.key = tileX + "/" + tileY;
            this.sprite = new Phaser.Sprite(this.chunkLayer.chunk.map.game, tileX, tileY);
            this.sprite.name = "Tile" + this.key;
            tileX = null;
            tileY = null;
            this.data.textureFrame = this.chunkLayer.chunk.map.data.GetFrameForId(this.data.id);
            this.data.textureKey = this.chunkLayer.chunk.map.data.GetTextureKeyForId(this.data.id);
            this.sprite.loadTexture(this.data.textureKey, this.data.textureFrame);
            Tile.tiles++;
        }
        Tile.prototype.DrawTile = function (_chunkLayer) {
            _chunkLayer.mapLayer.container.add(this.sprite);
        };
        Tile.prototype.EraseTile = function (_chunkLayer) {
            _chunkLayer.mapLayer.container.remove(this.sprite);
        };
        Tile.tiles = 0;
        return Tile;
    })();
    TiledChunks.Tile = Tile;
})(TiledChunks || (TiledChunks = {}));
