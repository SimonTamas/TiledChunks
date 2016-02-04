module TiledChunks {

    export class Tile
    {
        chunkLayer: TiledChunks.ChunkLayer;
        tile: Phaser.Sprite;
        data: TiledChunks.TileData;
        static tiles: number = 0;

        public DrawTile(_chunkLayer: TiledChunks.ChunkLayer): void {
            _chunkLayer.mapLayer.group.add(this.tile);
        }

        public EraseTile(_chunkLayer: TiledChunks.ChunkLayer): void {
            _chunkLayer.mapLayer.group.remove(this.tile);
        }

        constructor(_chunkLayer: TiledChunks.ChunkLayer, _offsetX: number, _offsetY: number, _data: TiledChunks.TileData)
        {
            this.chunkLayer = _chunkLayer;
            this.data = _data;

            var tileX = _chunkLayer.chunk.x + (_offsetX * this.chunkLayer.chunk.map.data.tileWidth);
            var tileY = _chunkLayer.chunk.y + (_offsetY * this.chunkLayer.chunk.map.data.tileHeight);



            this.tile = new Phaser.Sprite(this.chunkLayer.chunk.map.game, tileX, tileY);

            /* DEBUGGING VISUAL
            if (_offsetY == 0 || _offsetY == this.chunkLayer.chunk.map.data.chunkTileRows-1) {
                this.tile.height = 25;
            }
            if (_offsetX== 0 || _offsetX == this.chunkLayer.chunk.map.data.chunkTileColumns-1) {
                this.tile.width = 25;
            }
            */

            this.data.textureFrame = this.chunkLayer.chunk.map.data.GetFrameForId(this.data.id); 
            this.data.textureKey = this.chunkLayer.chunk.map.data.GetTextureKeyForId(this.data.id);
            

            this.tile.loadTexture(this.data.textureKey, this.data.textureFrame);
            

            Tile.tiles++;
        }


    }

}