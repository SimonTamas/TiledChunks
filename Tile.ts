module TiledChunks {

    export class Tile
    {
        chunkLayer: TiledChunks.ChunkLayer;
        sprite: Phaser.Sprite;
        data: TiledChunks.TileData;
        key: string;
        point: Phaser.Point;
        chunkRow: number;
        chunkColumn: number;
        static tiles: number = 0;

        public DrawTile(_chunkLayer: TiledChunks.ChunkLayer): void {
            _chunkLayer.mapLayer.container.add(this.sprite);
        }

        public EraseTile(_chunkLayer: TiledChunks.ChunkLayer): void {
            _chunkLayer.mapLayer.container.remove(this.sprite);
        }

        constructor(_chunkLayer: TiledChunks.ChunkLayer, _offsetX: number, _offsetY: number, _data: TiledChunks.TileData)
        {
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

            // DEBUGGING VISUAL 
            /*
            if (_offsetY == 0 || _offsetY == this.chunkLayer.chunk.map.data.chunkTileRows - 1) {
                this.tile.height = 25;
            }
            if (_offsetX== 0 || _offsetX == this.chunkLayer.chunk.map.data.chunkTileColumns-1) {
                this.tile.width = 25;
            }
            */

            this.data.textureFrame = this.chunkLayer.chunk.map.data.GetFrameForId(this.data.id); 
            this.data.textureKey = this.chunkLayer.chunk.map.data.GetTextureKeyForId(this.data.id);
            

            this.sprite.loadTexture(this.data.textureKey, this.data.textureFrame);

            //this.sprite.anchor.set(0.5, 0.5);

            Tile.tiles++;
        }


    }

}