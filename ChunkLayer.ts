module TiledChunks {

    export class ChunkLayer {
        
        chunk: TiledChunks.Chunk;
        layer: TiledChunks.LayerData;
        mapLayer: TiledChunks.MapLayer;
        tiles: TiledChunks.Tile[][];
        drawn: boolean;
        container: Phaser.Group;

        public DrawLayer():void {
            if (this.drawn)
                return;
            this.drawn = true;
            var tile: TiledChunks.Tile;
            for (var r: number = 0; r < this.tiles.length; r++) {
                for (var c: number = 0; c < this.tiles[r].length; c++) {
                    tile = this.tiles[r][c];
                    if ( tile )
                        tile.DrawTile(this);
                }
            }

        }

        public EraseLayer(): void {
            if (this.drawn) {
                this.drawn = false;
                //this.chunk.map.GetLayer(this.layer.name).group.remove(this.container);
                var tile: TiledChunks.Tile;
                for (var r: number = 0; r < this.tiles.length; r++) {
                    for (var c: number = 0; c < this.tiles[r].length; c++) {
                        tile = this.tiles[r][c];
                        if (tile)
                            tile.EraseTile(this);
                    }
                }
            }
        }

        constructor(_chunk: TiledChunks.Chunk, _layer: TiledChunks.LayerData, _tileDatas: TiledChunks.TileData[][]) {

            this.chunk = _chunk;
            this.layer = _layer;
            this.mapLayer = this.chunk.map.GetLayer(this.layer.name)
            this.drawn = false;

            // Store tiles in memory
            this.tiles = [];
            var id: number;
            var tile: TiledChunks.Tile;
            for (var cR: number = 0; cR < _chunk.map.data.chunkTileRows; cR++)
            {
                this.tiles[cR] = [];
                for (var cC: number = 0; cC < _chunk.map.data.chunkTileColumns; cC++) {
                    if (_tileDatas[cR] && _tileDatas[cR][cC] != null)
                    {
                        tile = new TiledChunks.Tile(this, cC, cR, _tileDatas[cR][cC]);
                        this.tiles[cR][cC] = tile;
                    }
                }
            }
            id = null;
            tile = null;
        }

    }

}