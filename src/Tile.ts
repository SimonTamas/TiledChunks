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
        offsetX: number;
        offsetY: number;
        static tiles: number = 0;

        public DrawTile(_chunkLayer: TiledChunks.ChunkLayer): void {
            _chunkLayer.mapLayer.container.add(this.sprite);
        }

        public EraseTile(_chunkLayer: TiledChunks.ChunkLayer): void {
            _chunkLayer.mapLayer.container.remove(this.sprite);
        }

        public RemoveFromWorld(): void {
            this.chunkLayer.tiles[this.chunkRow][this.chunkColumn] = null;
            this.EraseTile(this.chunkLayer);
            if (this.chunkLayer.layer.isCollisionLayer) {
                var collider: TiledChunks.Collider = this.chunkLayer.chunk.GetColliderByTile(this);
                if (collider)
                    this.chunkLayer.chunk.RemoveCollider(collider);
            }
        }

        constructor(_chunkLayer: TiledChunks.ChunkLayer, _offsetX: number, _offsetY: number, _data: TiledChunks.TileData)
        {
            this.chunkLayer = _chunkLayer;
            this.data = _data;


            this.chunkColumn = _offsetX;
            this.chunkRow = _offsetY;

            this.offsetX = _offsetX;
            this.offsetY = _offsetY;

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


    }

}